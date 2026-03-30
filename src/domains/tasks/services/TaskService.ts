import taskRepository, {
  Task,
  TaskFilters,
  CreateTaskData,
  UpdateTaskData,
} from '../repositories/TaskRepository.js'
import handoffService from '../../../services/handoff/handoff.service.js'
import reviewService from '../../../services/review/review.service.js'
import queueService from '../../../services/queue/queue.service.js'
import { extractTaskData } from '../../../services/nlp/extractor.js'
import { scheduleTask } from '../../../services/scheduling/scheduler.js'
import { AppError, ErrorCodes } from '../../../utils/errors.js'
import notificationService from '../../../services/notifications/notification.service.js'
import rebalancerService from '../../../services/calendar/rebalancer.js'

class TaskService {
  async listTasks(workspaceId: string, filters: TaskFilters): Promise<Task[]> {
    return taskRepository.findByWorkspace(workspaceId, filters)
  }

  async getTask(id: string, workspaceId: string): Promise<Task> {
    const task = await taskRepository.findById(id, workspaceId)
    if (!task) {
      throw new AppError(
        ErrorCodes.TASK_NOT_FOUND,
        'Task not found',
        { task_id: id },
        404
      )
    }
    return task
  }

  async createTask(data: CreateTaskData): Promise<Task> {
    if (!data.title) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Title is required',
        {},
        400
      )
    }

    if (data.project_id) {
      const projectExists = await taskRepository.hasWorkspaceResource(
        'projects',
        data.project_id,
        data.workspace_id
      )
      if (!projectExists) {
        throw new AppError(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid project_id for workspace',
          {},
          400
        )
      }
    }

    if (data.assignee_id) {
      const assigneeExists = await taskRepository.hasWorkspaceResource(
        'users',
        data.assignee_id,
        data.workspace_id
      )
      if (!assigneeExists) {
        throw new AppError(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid assignee_id for workspace',
          {},
          400
        )
      }
    }

    if (data.label_ids && data.label_ids.length > 0) {
      await this.validateLabelIds(data.label_ids, data.workspace_id)
    }

    const task = await taskRepository.create(data)

    if (data.assignee_id) {
      await this.sendNotification(
        data.assignee_id,
        'task_assigned',
        'New task assigned',
        `You have been assigned: ${task.title}`,
        task.id
      )
    }

    return task
  }

  private async sendNotification(
    userId: string,
    type: 'task_assigned' | 'task_completed' | 'mentioned_in_comment',
    title: string,
    body: string,
    taskId?: string
  ): Promise<void> {
    try {
      await notificationService.createNotification(
        userId,
        type,
        title,
        body,
        taskId
      )
    } catch (error) {
      console.error('Error sending notification:', error)
    }
  }

  private async validateLabelIds(
    labelIds: string[],
    workspaceId: string
  ): Promise<void> {
    const placeholders = labelIds.map((_, i) => `$${i + 1}`).join(', ')

    const { query } = await import('../../../config/database.js')
    const labelCheck = await query(
      `SELECT id FROM labels WHERE id IN (${placeholders}) AND workspace_id = $${labelIds.length + 1}`,
      [...labelIds, workspaceId]
    )

    if (labelCheck.rows.length !== labelIds.length) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid label_id for workspace',
        {},
        400
      )
    }
  }

  async createQuickTask(
    input: string,
    userId: string,
    workspaceId: string
  ): Promise<Task> {
    const extracted = extractTaskData(input)

    return taskRepository.create({
      title: extracted.title,
      status: 'todo',
      priority: extracted.priority || 'medium',
      creator_id: userId,
      workspace_id: workspaceId,
      due_date: extracted.due_date,
    })
  }

  async updateTask(
    id: string,
    workspaceId: string,
    userId: string,
    data: UpdateTaskData
  ): Promise<Task> {
    const existingTask = await taskRepository.findById(id, workspaceId)
    if (!existingTask) {
      throw new AppError(
        ErrorCodes.TASK_NOT_FOUND,
        'Task not found',
        { task_id: id },
        404
      )
    }

    if (data.project_id) {
      const projectExists = await taskRepository.hasWorkspaceResource(
        'projects',
        data.project_id,
        workspaceId
      )
      if (!projectExists) {
        throw new AppError(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid project_id for workspace',
          {},
          400
        )
      }
    }

    if (data.assignee_id) {
      const assigneeExists = await taskRepository.hasWorkspaceResource(
        'users',
        data.assignee_id,
        workspaceId
      )
      if (!assigneeExists) {
        throw new AppError(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid assignee_id for workspace',
          {},
          400
        )
      }
    }

    if (data.label_ids && data.label_ids.length > 0) {
      await this.validateLabelIds(data.label_ids, workspaceId)
    }

    const updatedTask = await taskRepository.update(id, workspaceId, data)
    if (!updatedTask) {
      throw new AppError(
        ErrorCodes.TASK_NOT_FOUND,
        'Task not found',
        { task_id: id },
        404
      )
    }

    if (data.assignee_id && data.assignee_id !== existingTask.assignee_id) {
      await this.sendNotification(
        data.assignee_id,
        'task_assigned',
        'New task assigned',
        `You have been assigned: ${updatedTask.title}`,
        updatedTask.id
      )
    }

    if (data.status === 'completed' && userId) {
      try {
        await queueService.autoAssignNext(updatedTask.id, userId, workspaceId)
      } catch (queueError) {
        console.error('Error auto-assigning next task:', queueError)
      }
    }

    if (data.status) {
      try {
        await handoffService.triggerHandoffsForTask(updatedTask, workspaceId)
        await reviewService.triggerReviewForTask(updatedTask, workspaceId)

        if (data.status === 'completed' || data.status === 'cancelled') {
          await rebalancerService.rebalanceSchedule({
            userId,
            workspaceId,
            triggerTaskId: id,
          })
        }
      } catch (handoffError) {
        console.error('Error triggering handoffs:', handoffError)
      }
    }

    return updatedTask
  }

  async deleteTask(id: string, workspaceId: string): Promise<void> {
    const deleted = await taskRepository.delete(id, workspaceId)
    if (!deleted) {
      throw new AppError(
        ErrorCodes.TASK_NOT_FOUND,
        'Task not found',
        { task_id: id },
        404
      )
    }
  }

  async scheduleTask(
    taskId: string,
    userId: string,
    workspaceId: string
  ): Promise<any> {
    const task = await taskRepository.findById(taskId, workspaceId)
    if (!task) {
      throw new AppError(
        ErrorCodes.TASK_NOT_FOUND,
        'Task not found',
        { task_id: taskId },
        404
      )
    }

    if (task.workspace_id !== workspaceId) {
      throw new AppError(
        ErrorCodes.FORBIDDEN,
        'Forbidden',
        { task_id: taskId },
        403
      )
    }

    const scheduleResult = await scheduleTask({
      taskId,
      userId,
      workspaceId,
    })

    await taskRepository.createScheduleSlot(
      userId,
      taskId,
      scheduleResult.suggested_slot.start_time,
      scheduleResult.suggested_slot.end_time
    )

    return scheduleResult
  }

  extractTaskData(input: string) {
    if (!input || typeof input !== 'string') {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Input is required',
        {},
        400
      )
    }
    return extractTaskData(input)
  }

  async bulkUpdateTasks(
    taskIds: string[],
    workspaceId: string,
    userId: string,
    data: UpdateTaskData
  ): Promise<{
    success: number
    failed: number
    errors?: Array<{ task_id: string; error: string }>
  }> {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const invalidIds = taskIds.filter(id => !uuidRegex.test(id))
    const validIds = taskIds.filter(id => uuidRegex.test(id))

    const errors: Array<{ task_id: string; error: string }> = invalidIds.map(
      id => ({ task_id: id, error: 'Invalid task ID format' })
    )

    if (validIds.length === 0) {
      return {
        success: 0,
        failed: taskIds.length,
        errors: errors.length > 0 ? errors : undefined,
      }
    }

    if (data.project_id) {
      const projectExists = await taskRepository.hasWorkspaceResource(
        'projects',
        data.project_id,
        workspaceId
      )
      if (!projectExists) {
        throw new AppError(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid project_id for workspace',
          {},
          400
        )
      }
    }

    if (data.label_ids && data.label_ids.length > 0) {
      await this.validateLabelIds(data.label_ids, workspaceId)
    }

    const result = await taskRepository.bulkUpdate(validIds, workspaceId, data)

    if (data.label_ids !== undefined && result.taskIds.length > 0) {
      for (const taskId of result.taskIds) {
        await taskRepository.setTaskLabels(taskId, data.label_ids)
      }
    }

    const notFoundErrors = validIds
      .filter(id => !result.taskIds.includes(id))
      .map(id => ({ task_id: id, error: 'Task not found or access denied' }))

    const allErrors = [...errors, ...notFoundErrors]

    return {
      success: result.updatedCount,
      failed: taskIds.length - result.updatedCount,
      errors: allErrors.length > 0 ? allErrors : undefined,
    }
  }

  async bulkDeleteTasks(
    taskIds: string[],
    workspaceId: string
  ): Promise<{
    success: number
    failed: number
    errors?: Array<{ task_id: string; error: string }>
  }> {
    const result = await taskRepository.bulkDelete(taskIds, workspaceId)

    const errors = taskIds
      .filter(id => !result.taskIds.includes(id))
      .map(id => ({ task_id: id, error: 'Task not found or access denied' }))

    return {
      success: result.deletedCount,
      failed: taskIds.length - result.deletedCount,
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  async bulkMoveTasks(
    taskIds: string[],
    workspaceId: string,
    projectId: string
  ): Promise<{
    success: number
    failed: number
    errors?: Array<{ task_id: string; error: string }>
  }> {
    const projectExists = await taskRepository.hasWorkspaceResource(
      'projects',
      projectId,
      workspaceId
    )
    if (!projectExists) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid project_id for workspace',
        {},
        400
      )
    }

    const result = await taskRepository.bulkMoveToProject(
      taskIds,
      workspaceId,
      projectId
    )

    const errors = taskIds
      .filter(id => !result.taskIds.includes(id))
      .map(id => ({ task_id: id, error: 'Task not found or access denied' }))

    return {
      success: result.movedCount,
      failed: taskIds.length - result.movedCount,
      errors: errors.length > 0 ? errors : undefined,
    }
  }
}

export default new TaskService()

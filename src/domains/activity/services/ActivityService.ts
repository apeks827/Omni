import activityRepository from '../repositories/ActivityRepository.js'
import diffGenerator from './DiffGenerator.js'
import {
  CreateActivityEventInput,
  ActivityEventModel,
} from '../models/ActivityEvent.js'
import {
  ActivityEventWithDetails,
  ActivityFeedFilters,
  ActivityCursor,
  ActivityEventType,
  EntityType,
} from '../../../../shared/types/activity.js'

export class ActivityService {
  async log(input: CreateActivityEventInput): Promise<ActivityEventModel> {
    return activityRepository.create({
      ...input,
      source: input.source || 'client',
    })
  }

  async logTaskCreated(
    taskId: string,
    workspaceId: string,
    userId: string,
    taskData: any
  ): Promise<ActivityEventModel> {
    return this.log({
      workspace_id: workspaceId,
      user_id: userId,
      event_type: 'task.created',
      entity_type: 'task',
      entity_id: taskId,
      action: 'create',
      new_value: taskData,
      source: 'client',
    })
  }

  async logTaskUpdated(
    taskId: string,
    workspaceId: string,
    userId: string,
    previousState: any,
    updatedState: any,
    source: 'client' | 'api' | 'agent' = 'client'
  ): Promise<ActivityEventModel> {
    const fieldChanges = diffGenerator.generate(previousState, updatedState)

    if (fieldChanges.length === 0) {
      const { events } = await activityRepository.list(workspaceId, {
        entity_id: taskId,
        limit: 1,
      })
      return events[0]
    }

    return this.log({
      workspace_id: workspaceId,
      user_id: userId,
      event_type: 'task.updated',
      entity_type: 'task',
      entity_id: taskId,
      action: 'update',
      field_changes: fieldChanges,
      source,
    })
  }

  async logTaskCompleted(
    taskId: string,
    workspaceId: string,
    userId: string
  ): Promise<ActivityEventModel> {
    return this.log({
      workspace_id: workspaceId,
      user_id: userId,
      event_type: 'task.completed',
      entity_type: 'task',
      entity_id: taskId,
      action: 'complete',
      source: 'client',
    })
  }

  async logTaskAssigned(
    taskId: string,
    workspaceId: string,
    userId: string,
    previousAssigneeId: string | null,
    newAssigneeId: string
  ): Promise<ActivityEventModel> {
    return this.log({
      workspace_id: workspaceId,
      user_id: userId,
      event_type: 'task.assigned',
      entity_type: 'task',
      entity_id: taskId,
      action: 'assign',
      previous_value: previousAssigneeId,
      new_value: newAssigneeId,
      source: 'client',
    })
  }

  async logTaskDeleted(
    taskId: string,
    workspaceId: string,
    userId: string
  ): Promise<ActivityEventModel> {
    return this.log({
      workspace_id: workspaceId,
      user_id: userId,
      event_type: 'task.deleted',
      entity_type: 'task',
      entity_id: taskId,
      action: 'delete',
      source: 'client',
    })
  }

  async logTaskRestored(
    taskId: string,
    workspaceId: string,
    userId: string
  ): Promise<ActivityEventModel> {
    return this.log({
      workspace_id: workspaceId,
      user_id: userId,
      event_type: 'task.restored',
      entity_type: 'task',
      entity_id: taskId,
      action: 'restore',
      source: 'client',
    })
  }

  async logTaskArchived(
    taskId: string,
    workspaceId: string,
    userId: string
  ): Promise<ActivityEventModel> {
    return this.log({
      workspace_id: workspaceId,
      user_id: userId,
      event_type: 'task.archived',
      entity_type: 'task',
      entity_id: taskId,
      action: 'archive',
      source: 'client',
    })
  }

  async logCommentAdded(
    commentId: string,
    taskId: string,
    workspaceId: string,
    userId: string,
    commentData: any
  ): Promise<ActivityEventModel> {
    return this.log({
      workspace_id: workspaceId,
      user_id: userId,
      event_type: 'comment.added',
      entity_type: 'comment',
      entity_id: commentId,
      action: 'comment',
      parent_entity_type: 'task',
      parent_entity_id: taskId,
      new_value: commentData,
      source: 'client',
    })
  }

  async logLabelAdded(
    labelId: string,
    taskId: string,
    workspaceId: string,
    userId: string
  ): Promise<ActivityEventModel> {
    return this.log({
      workspace_id: workspaceId,
      user_id: userId,
      event_type: 'label.added',
      entity_type: 'label',
      entity_id: labelId,
      action: 'attach',
      parent_entity_type: 'task',
      parent_entity_id: taskId,
      source: 'client',
    })
  }

  async logLabelRemoved(
    labelId: string,
    taskId: string,
    workspaceId: string,
    userId: string
  ): Promise<ActivityEventModel> {
    return this.log({
      workspace_id: workspaceId,
      user_id: userId,
      event_type: 'label.removed',
      entity_type: 'label',
      entity_id: labelId,
      action: 'attach',
      parent_entity_type: 'task',
      parent_entity_id: taskId,
      source: 'client',
    })
  }

  async getFeed(
    workspaceId: string,
    filters: ActivityFeedFilters
  ): Promise<{
    events: ActivityEventWithDetails[]
    pagination: {
      has_more: boolean
      next_cursor: string | null
      total_count: number
    }
  }> {
    const { events, totalCount } = await activityRepository.list(workspaceId, {
      ...filters,
      limit: filters.limit || 50,
    })

    const hasMore = events.length > (filters.limit || 50)
    const displayEvents = events.slice(0, filters.limit || 50)

    let nextCursor: string | null = null
    if (hasMore && displayEvents.length > 0) {
      const last = displayEvents[displayEvents.length - 1]
      const cursor: ActivityCursor = {
        last_id: last.id,
        last_created_at: last.created_at,
      }
      nextCursor = Buffer.from(JSON.stringify(cursor)).toString('base64')
    }

    return {
      events: displayEvents,
      pagination: {
        has_more: hasMore,
        next_cursor: nextCursor,
        total_count: totalCount,
      },
    }
  }

  async getTaskActivity(
    taskId: string,
    workspaceId: string,
    limit: number = 50
  ): Promise<{
    events: ActivityEventWithDetails[]
    subtasks: { task_id: string; events: ActivityEventWithDetails[] }[]
  }> {
    return activityRepository.getForTask(taskId, workspaceId, limit)
  }

  async getEventById(
    id: string,
    workspaceId: string
  ): Promise<ActivityEventWithDetails | null> {
    return activityRepository.findById(id, workspaceId)
  }
}

export default new ActivityService()

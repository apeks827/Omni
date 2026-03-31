import { schedulingQueue, QueuedTask } from './priority-queue.js'
import { scheduleTask } from './scheduler.js'
import { query } from '../../config/database.js'

interface QueueProcessingResult {
  taskId: string
  success: boolean
  scheduledSlot?: {
    start_time: Date
    end_time: Date
  }
  error?: string
}

interface QueueProcessingStats {
  total: number
  successful: number
  failed: number
  skipped: number
  durationMs: number
}

class QueueProcessor {
  private isProcessing: Map<string, boolean> = new Map()

  async addToQueue(
    taskId: string,
    userId: string,
    workspaceId: string,
    priority: QueuedTask['priority'],
    dueDate?: Date,
    estimatedDuration?: number
  ): Promise<{ success: boolean; position?: number; message?: string }> {
    const taskResult = await query(
      'SELECT id, status FROM tasks WHERE id = $1 AND workspace_id = $2',
      [taskId, workspaceId]
    )

    if (taskResult.rows.length === 0) {
      return { success: false, message: 'Task not found' }
    }

    const task = taskResult.rows[0]
    if (task.status === 'completed' || task.status === 'cancelled') {
      return {
        success: false,
        message: 'Task is already completed or cancelled',
      }
    }

    const existingSlots = await query(
      'SELECT id FROM schedule_slots WHERE task_id = $1 AND status = $2',
      [taskId, 'scheduled']
    )

    if (existingSlots.rows.length > 0) {
      return { success: false, message: 'Task is already scheduled' }
    }

    if (schedulingQueue.hasTask(taskId)) {
      return { success: false, message: 'Task is already in scheduling queue' }
    }

    schedulingQueue.add({
      taskId,
      userId,
      workspaceId,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      estimatedDuration,
    })

    const queue = schedulingQueue.getAll(userId)
    const position = queue.findIndex(t => t.taskId === taskId) + 1

    return { success: true, position }
  }

  async removeFromQueue(
    taskId: string,
    userId: string
  ): Promise<{ success: boolean; message?: string }> {
    if (!schedulingQueue.hasTask(taskId)) {
      return { success: false, message: 'Task not in queue' }
    }

    const removed = schedulingQueue.remove(taskId, userId)
    if (!removed) {
      return { success: false, message: 'Task belongs to another user' }
    }

    return { success: true }
  }

  async reprioritize(
    taskId: string,
    userId: string,
    newPriority: QueuedTask['priority']
  ): Promise<{ success: boolean; message?: string }> {
    if (!schedulingQueue.hasTask(taskId)) {
      return { success: false, message: 'Task not in queue' }
    }

    const updated = schedulingQueue.reprioritize(taskId, userId, newPriority)
    if (!updated) {
      return { success: false, message: 'Task belongs to another user' }
    }

    return { success: true }
  }

  async processQueue(
    userId: string,
    limit: number = 10
  ): Promise<{
    results: QueueProcessingResult[]
    stats: QueueProcessingStats
  }> {
    if (this.isProcessing.get(userId)) {
      return {
        results: [],
        stats: {
          total: 0,
          successful: 0,
          failed: 0,
          skipped: 0,
          durationMs: 0,
        },
      }
    }

    this.isProcessing.set(userId, true)
    const startTime = Date.now()
    const results: QueueProcessingResult[] = []

    try {
      schedulingQueue.recalculateScores(userId)

      const existingSlotsResult = await query(
        'SELECT start_time, end_time, task_id FROM schedule_slots WHERE user_id = $1 AND status IN ($2, $3)',
        [userId, 'scheduled', 'active']
      )

      const processedCount = 0
      let successful = 0
      let failed = 0
      let skipped = 0

      for (let i = 0; i < limit; i++) {
        const task = schedulingQueue.getNext(userId)
        if (!task) break

        const conflictingSlot = existingSlotsResult.rows.find(
          (slot: any) => slot.task_id === task.taskId
        )

        if (conflictingSlot) {
          results.push({
            taskId: task.taskId,
            success: false,
            error: 'Task already has a scheduled slot',
          })
          skipped++
          continue
        }

        try {
          const scheduleResult = await scheduleTask({
            taskId: task.taskId,
            userId: task.userId,
            workspaceId: task.workspaceId,
          })

          await query(
            `INSERT INTO schedule_slots (task_id, user_id, workspace_id, start_time, end_time, status)
             VALUES ($1, $2, $3, $4, $5, 'scheduled')`,
            [
              task.taskId,
              task.userId,
              task.workspaceId,
              scheduleResult.suggested_slot.start_time,
              scheduleResult.suggested_slot.end_time,
            ]
          )

          results.push({
            taskId: task.taskId,
            success: true,
            scheduledSlot: {
              start_time: scheduleResult.suggested_slot.start_time,
              end_time: scheduleResult.suggested_slot.end_time,
            },
          })
          successful++
        } catch (error) {
          results.push({
            taskId: task.taskId,
            success: false,
            error: error instanceof Error ? error.message : 'Scheduling failed',
          })
          failed++
        }
      }

      return {
        results,
        stats: {
          total: successful + failed + skipped,
          successful,
          failed,
          skipped,
          durationMs: Date.now() - startTime,
        },
      }
    } finally {
      this.isProcessing.set(userId, false)
    }
  }

  getQueueStatus(userId: string): {
    queue: QueuedTask[]
    stats: ReturnType<typeof schedulingQueue.getStats>
    isProcessing: boolean
  } {
    return {
      queue: schedulingQueue.getAll(userId),
      stats: schedulingQueue.getStats(userId),
      isProcessing: this.isProcessing.get(userId) || false,
    }
  }
}

export const queueProcessor = new QueueProcessor()
export { QueueProcessor }
export type { QueueProcessingResult, QueueProcessingStats }

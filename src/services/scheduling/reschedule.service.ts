import { query } from '../../config/database.js'
import { scheduleTask } from './scheduler.js'
import notificationService from '../notifications/notification.service.js'

interface MissedTask {
  id: string
  task_id: string
  user_id: string
  workspace_id: string
  start_time: Date
  end_time: Date
  task_title: string
  task_priority: string
  estimated_duration: number
}

interface RescheduleResult {
  reschedule_id: string
  task_id: string
  original_time: Date
  new_time: Date
  reason: string
}

export class RescheduleService {
  async detectMissedTasks(): Promise<MissedTask[]> {
    const result = await query(
      `SELECT 
        ss.id,
        ss.task_id,
        ss.user_id,
        t.workspace_id,
        ss.start_time,
        ss.end_time,
        t.title as task_title,
        t.priority as task_priority,
        t.estimated_duration
       FROM schedule_slots ss
       JOIN tasks t ON ss.task_id = t.id
       WHERE ss.start_time < NOW()
         AND ss.status = 'scheduled'
         AND t.status NOT IN ('completed', 'cancelled')
         AND NOT EXISTS (
           SELECT 1 FROM reschedule_history rh
           WHERE rh.task_id = ss.task_id
             AND rh.created_at > NOW() - INTERVAL '1 day'
         )
       ORDER BY ss.start_time ASC
       LIMIT 50`
    )

    return result.rows as MissedTask[]
  }

  async rescheduleTask(
    taskId: string,
    userId: string,
    workspaceId: string,
    originalTime: Date
  ): Promise<RescheduleResult | null> {
    const scheduleResponse = await scheduleTask({
      taskId,
      userId,
      workspaceId,
    })

    if (!scheduleResponse.suggested_slot) {
      return null
    }

    const newTime = scheduleResponse.suggested_slot.start_time
    const reason = this.buildRescheduleReason(
      originalTime,
      newTime,
      scheduleResponse.reasoning
    )

    const result = await query(
      `INSERT INTO reschedule_history 
        (task_id, user_id, workspace_id, original_time, rescheduled_time, reason, user_response)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING id`,
      [taskId, userId, workspaceId, originalTime, newTime, reason]
    )

    const rescheduleId = result.rows[0].id

    await query(
      `UPDATE schedule_slots
       SET start_time = $1,
           end_time = $2,
           updated_at = NOW()
       WHERE task_id = $3 AND user_id = $4 AND status = 'scheduled'`,
      [
        scheduleResponse.suggested_slot.start_time,
        scheduleResponse.suggested_slot.end_time,
        taskId,
        userId,
      ]
    )

    const taskResult = await query('SELECT title FROM tasks WHERE id = $1', [
      taskId,
    ])
    const taskTitle = taskResult.rows[0]?.title || 'Task'

    await notificationService.createNotification(
      userId,
      'task_rescheduled' as any,
      `${taskTitle} rescheduled`,
      reason,
      taskId
    )

    return {
      reschedule_id: rescheduleId,
      task_id: taskId,
      original_time: originalTime,
      new_time: newTime,
      reason,
    }
  }

  async handleUserResponse(
    rescheduleId: string,
    userId: string,
    response: 'accepted' | 'rejected' | 'manual'
  ): Promise<boolean> {
    const result = await query(
      `UPDATE reschedule_history
       SET user_response = $1,
           responded_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING task_id, rescheduled_time`,
      [response, rescheduleId, userId]
    )

    if (result.rows.length === 0) {
      return false
    }

    const { task_id, rescheduled_time } = result.rows[0]

    if (response === 'rejected') {
      await query(
        `UPDATE schedule_slots
         SET status = 'skipped',
             updated_at = NOW()
         WHERE task_id = $1 AND user_id = $2 AND start_time = $3`,
        [task_id, userId, rescheduled_time]
      )

      await query(
        `UPDATE tasks
         SET status = 'pending',
             updated_at = NOW()
         WHERE id = $1`,
        [task_id]
      )
    }

    return true
  }

  async getHistory(userId: string, days: number, limit: number) {
    const result = await query(
      `SELECT 
         rh.id,
         rh.task_id,
         t.title as task_title,
         rh.original_time,
         rh.rescheduled_time,
         rh.reason,
         rh.user_response,
         rh.responded_at,
         rh.created_at
       FROM reschedule_history rh
       JOIN tasks t ON rh.task_id = t.id
       WHERE rh.user_id = $1
         AND rh.created_at > NOW() - ($2 || ' days')::interval
       ORDER BY rh.created_at DESC
       LIMIT $3`,
      [userId, days, limit]
    )
    return result.rows
  }

  async getPendingReschedules(userId: string) {
    const result = await query(
      `SELECT 
         rh.id,
         rh.task_id,
         t.title as task_title,
         t.priority,
         t.estimated_duration,
         rh.original_time,
         rh.rescheduled_time,
         rh.reason,
         rh.created_at
       FROM reschedule_history rh
       JOIN tasks t ON rh.task_id = t.id
       WHERE rh.user_id = $1
         AND rh.user_response = 'pending'
       ORDER BY rh.created_at DESC`,
      [userId]
    )
    return result.rows
  }

  async getAcceptanceRate(userId: string, days: number = 30): Promise<number> {
    const result = await query(
      `SELECT 
         COUNT(*) FILTER (WHERE user_response = 'accepted') as accepted,
         COUNT(*) FILTER (WHERE user_response IN ('accepted', 'rejected', 'manual')) as total
       FROM reschedule_history
       WHERE user_id = $1
         AND created_at > NOW() - ($2 || ' days')::interval
         AND user_response != 'pending'`,
      [userId, days]
    )

    if (!result.rows[0]) return 0

    const { accepted, total } = result.rows[0]
    if (!total || parseInt(total) === 0) return 0

    return (parseInt(accepted) / parseInt(total)) * 100
  }

  private buildRescheduleReason(
    originalTime: Date,
    newTime: Date,
    schedulingReasoning: string
  ): string {
    const originalHour = originalTime.getHours()
    const newHour = newTime.getHours()

    const formatTime = (date: Date) => {
      const hours = date.getHours()
      const minutes = date.getMinutes()
      const ampm = hours >= 12 ? 'PM' : 'AM'
      const displayHours = hours % 12 || 12
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`
    }

    return `Moved from ${formatTime(originalTime)} to ${formatTime(newTime)} to fit your schedule`
  }

  async runMissedTaskDetection(): Promise<void> {
    const missedTasks = await this.detectMissedTasks()

    console.log(`Found ${missedTasks.length} missed tasks to reschedule`)

    for (const missed of missedTasks) {
      try {
        const result = await this.rescheduleTask(
          missed.task_id,
          missed.user_id,
          missed.workspace_id,
          missed.start_time
        )

        if (result) {
          console.log(
            `Rescheduled task ${missed.task_id} from ${missed.start_time} to ${result.new_time}`
          )
        }
      } catch (error) {
        console.error(`Failed to reschedule task ${missed.task_id}:`, error)
      }
    }
  }
}

export default new RescheduleService()

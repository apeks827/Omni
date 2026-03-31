import { query } from '../../config/database.js'
import { scheduleTask } from './scheduler.js'
import notificationService from '../notifications/notification.service.js'

interface RescheduleTriggerResult {
  success: boolean
  rescheduled: number
  errors: string[]
}

class RescheduleTrigger {
  async onTaskCompleted(
    taskId: string,
    userId: string,
    workspaceId: string
  ): Promise<RescheduleTriggerResult> {
    const result: RescheduleTriggerResult = {
      success: true,
      rescheduled: 0,
      errors: [],
    }

    try {
      const slotResult = await query(
        `SELECT id, start_time, end_time 
         FROM schedule_slots 
         WHERE task_id = $1 AND user_id = $2 AND status IN ('scheduled', 'active')`,
        [taskId, userId]
      )

      if (slotResult.rows.length === 0) {
        return result
      }

      const completedSlot = slotResult.rows[0]

      await query(
        `UPDATE schedule_slots 
         SET status = 'completed', updated_at = NOW() 
         WHERE id = $1`,
        [completedSlot.id]
      )

      const pendingTasks = await query(
        `SELECT t.id, t.title, t.priority, t.estimated_duration
         FROM tasks t
         WHERE t.workspace_id = $1
           AND t.status = 'pending'
           AND t.priority IN ('high', 'critical')
           AND NOT EXISTS (
             SELECT 1 FROM schedule_slots ss 
             WHERE ss.task_id = t.id AND ss.status = 'scheduled'
           )
         ORDER BY 
           CASE t.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 ELSE 3 END,
           t.created_at ASC
         LIMIT 3`,
        [workspaceId]
      )

      for (const task of pendingTasks.rows) {
        try {
          const scheduleResult = await scheduleTask({
            taskId: task.id,
            userId,
            workspaceId,
          })

          if (scheduleResult.suggested_slot) {
            await query(
              `INSERT INTO schedule_slots (task_id, user_id, workspace_id, start_time, end_time, status)
               VALUES ($1, $2, $3, $4, $5, 'scheduled')`,
              [
                task.id,
                userId,
                workspaceId,
                scheduleResult.suggested_slot.start_time,
                scheduleResult.suggested_slot.end_time,
              ]
            )

            await query(
              'UPDATE tasks SET status = \'scheduled\', due_date = $1, updated_at = NOW() WHERE id = $2',
              [scheduleResult.suggested_slot.start_time, task.id]
            )

            await notificationService.createNotification(
              userId,
              'task_scheduled' as any,
              'Task auto-scheduled',
              `${task.title} scheduled for ${new Date(scheduleResult.suggested_slot.start_time).toLocaleString()}`,
              task.id
            )

            result.rescheduled++
          }
        } catch (taskError) {
          result.errors.push(
            `Failed to schedule task ${task.id}: ${taskError instanceof Error ? taskError.message : 'Unknown error'}`
          )
        }
      }
    } catch (error) {
      result.success = false
      result.errors.push(
        `Trigger failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      console.error('Error in onTaskCompleted reschedule trigger:', error)
    }

    return result
  }

  async onTaskMissed(
    taskId: string,
    userId: string,
    workspaceId: string
  ): Promise<RescheduleTriggerResult> {
    const result: RescheduleTriggerResult = {
      success: true,
      rescheduled: 0,
      errors: [],
    }

    try {
      const missedTask = await query(
        `SELECT t.id, t.title, t.priority, t.estimated_duration, t.status,
                ss.start_time, ss.end_time
         FROM tasks t
         JOIN schedule_slots ss ON t.id = ss.task_id
         WHERE t.id = $1 AND ss.user_id = $2 AND ss.status = 'scheduled'`,
        [taskId, userId]
      )

      if (missedTask.rows.length === 0) {
        return result
      }

      const task = missedTask.rows[0]

      const scheduleResult = await scheduleTask({
        taskId: task.id,
        userId,
        workspaceId,
      })

      if (scheduleResult.suggested_slot) {
        await query(
          `UPDATE schedule_slots 
           SET start_time = $1, end_time = $2, updated_at = NOW() 
           WHERE task_id = $3 AND user_id = $4 AND status = 'scheduled'`,
          [
            scheduleResult.suggested_slot.start_time,
            scheduleResult.suggested_slot.end_time,
            task.id,
            userId,
          ]
        )

        await notificationService.createNotification(
          userId,
          'task_rescheduled' as any,
          'Missed task rescheduled',
          `${task.title} moved to ${new Date(scheduleResult.suggested_slot.start_time).toLocaleString()}`,
          task.id
        )

        result.rescheduled = 1
      }
    } catch (error) {
      result.success = false
      result.errors.push(
        `Trigger failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      console.error('Error in onTaskMissed reschedule trigger:', error)
    }

    return result
  }

  async checkAndTriggerMissedTasks(
    userId: string,
    workspaceId: string
  ): Promise<number> {
    const missedTasks = await query(
      `SELECT t.id, ss.start_time
       FROM tasks t
       JOIN schedule_slots ss ON t.id = ss.task_id
       WHERE ss.user_id = $1 
         AND ss.start_time < NOW()
         AND ss.status = 'scheduled'
         AND t.status NOT IN ('completed', 'cancelled')
         AND NOT EXISTS (
           SELECT 1 FROM reschedule_history rh
           WHERE rh.task_id = t.id
             AND rh.created_at > NOW() - INTERVAL '1 hour'
         )`,
      [userId]
    )

    let rescheduledCount = 0

    for (const task of missedTasks.rows) {
      const triggerResult = await this.onTaskMissed(
        task.id,
        userId,
        workspaceId
      )
      if (triggerResult.rescheduled > 0) {
        rescheduledCount++
      }
    }

    return rescheduledCount
  }
}

export default new RescheduleTrigger()

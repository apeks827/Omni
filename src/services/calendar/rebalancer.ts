import { pool } from '../../config/database.js'
import { Task } from '../../models/Task.js'
import energyService from './energy.service.js'

interface RebalanceOptions {
  userId: string
  workspaceId: string
  triggerTaskId?: string
}

interface ScheduleSlot {
  id: string
  task_id: string
  user_id: string
  start_time: Date
  end_time: Date
  priority: string
}

class RebalancerService {
  async rebalanceSchedule(options: RebalanceOptions): Promise<void> {
    const { userId, workspaceId, triggerTaskId } = options
    const startTime = Date.now()

    const user = await pool.query(
      'SELECT low_energy_mode, energy_pattern FROM users WHERE id = $1',
      [userId]
    )

    if (user.rows.length === 0) {
      throw new Error('User not found')
    }

    const lowEnergyMode = user.rows[0].low_energy_mode || false
    const energyPattern = user.rows[0].energy_pattern

    const missedTasks = await pool.query(
      `SELECT id, title, priority, estimated_duration, due_date
       FROM tasks
       WHERE workspace_id = $1
         AND status = 'scheduled'
         AND due_date < NOW()
         AND id != $2
       ORDER BY priority DESC, due_date ASC`,
      [workspaceId, triggerTaskId || null]
    )

    for (const task of missedTasks.rows) {
      await this.rescheduleTask(task, userId, workspaceId, energyPattern)
    }

    if (lowEnergyMode) {
      await this.filterLowEnergyTasks(userId, workspaceId)
    }

    const elapsed = Date.now() - startTime
    console.log(`Rebalancing completed in ${elapsed}ms`)
  }

  private async rescheduleTask(
    task: any,
    userId: string,
    workspaceId: string,
    energyPattern: any
  ): Promise<void> {
    const duration = task.estimated_duration || 60
    const nextSlot = await this.findNextAvailableSlot(
      userId,
      workspaceId,
      duration,
      task.priority,
      energyPattern
    )

    if (nextSlot) {
      await pool.query(
        'UPDATE tasks SET due_date = $1, updated_at = NOW() WHERE id = $2',
        [nextSlot.start_time, task.id]
      )
    }
  }

  private async findNextAvailableSlot(
    userId: string,
    workspaceId: string,
    duration: number,
    priority: string,
    energyPattern: any
  ): Promise<{ start_time: Date } | null> {
    const now = new Date()
    const searchEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const existingSlots = await pool.query(
      `SELECT due_date, estimated_duration
       FROM tasks
       WHERE workspace_id = $1
         AND status = 'scheduled'
         AND due_date >= $2
         AND due_date <= $3
       ORDER BY due_date`,
      [workspaceId, now, searchEnd]
    )

    let currentTime = new Date(now)
    currentTime.setMinutes(0, 0, 0)

    while (currentTime < searchEnd) {
      const hour = currentTime.getHours()
      const score = energyService.scoreTimeBlock(hour, priority, energyPattern)

      if (score >= 70) {
        const slotEnd = new Date(currentTime.getTime() + duration * 60000)
        const hasConflict = existingSlots.rows.some((slot: any) => {
          const slotStart = new Date(slot.due_date)
          const slotEnd = new Date(
            slotStart.getTime() + (slot.estimated_duration || 60) * 60000
          )
          return currentTime < slotEnd && slotEnd > slotStart
        })

        if (!hasConflict) {
          return { start_time: currentTime }
        }
      }

      currentTime = new Date(currentTime.getTime() + 60 * 60000)
    }

    return null
  }

  private async filterLowEnergyTasks(
    userId: string,
    workspaceId: string
  ): Promise<void> {
    await pool.query(
      `UPDATE tasks
       SET status = 'pending'
       WHERE workspace_id = $1
         AND status = 'scheduled'
         AND priority NOT IN ('critical', 'high')`,
      [workspaceId]
    )
  }

  async bumpLowerPriorityTask(
    highPriorityTask: Task,
    targetSlot: Date,
    userId: string,
    workspaceId: string
  ): Promise<boolean> {
    const conflictingTasks = await pool.query(
      `SELECT id, priority, estimated_duration, due_date
       FROM tasks
       WHERE workspace_id = $1
         AND status = 'scheduled'
         AND due_date = $2
       ORDER BY priority ASC`,
      [workspaceId, targetSlot]
    )

    if (conflictingTasks.rows.length === 0) {
      return true
    }

    const priorityOrder = { low: 1, medium: 2, high: 3, critical: 4 }
    const highPriority =
      priorityOrder[highPriorityTask.priority as keyof typeof priorityOrder]

    for (const conflicting of conflictingTasks.rows) {
      const conflictPriority =
        priorityOrder[conflicting.priority as keyof typeof priorityOrder]

      if (highPriority > conflictPriority) {
        const user = await pool.query(
          'SELECT energy_pattern FROM users WHERE id = $1',
          [userId]
        )
        const energyPattern = user.rows[0]?.energy_pattern

        await this.rescheduleTask(
          conflicting,
          userId,
          workspaceId,
          energyPattern
        )
        return true
      }
    }

    return false
  }
}

export default new RebalancerService()

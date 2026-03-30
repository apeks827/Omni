import { query } from '../../../config/database.js'

export interface ScheduledTask {
  id: string
  title: string
  priority: string
  estimated_duration: number | null
  due_date: Date
}

class CalendarRepository {
  async findScheduledTasksByDate(
    workspaceId: string,
    date: string
  ): Promise<ScheduledTask[]> {
    const result = await query(
      `SELECT t.id, t.title, t.priority, t.estimated_duration, t.due_date
       FROM tasks t
       WHERE t.workspace_id = $1 
         AND t.status = 'scheduled'
         AND DATE(t.due_date) = $2
       ORDER BY t.due_date`,
      [workspaceId, date]
    )
    return result.rows
  }

  async findScheduledTasksByDateRange(
    workspaceId: string,
    startDate: string,
    endDate: string
  ): Promise<ScheduledTask[]> {
    const result = await query(
      `SELECT t.id, t.title, t.priority, t.estimated_duration, t.due_date
       FROM tasks t
       WHERE t.workspace_id = $1 
         AND t.status = 'scheduled'
         AND t.due_date >= $2
         AND t.due_date < $3
       ORDER BY t.due_date`,
      [workspaceId, startDate, endDate]
    )
    return result.rows
  }

  async checkScheduleConflict(
    workspaceId: string,
    taskId: string,
    startTime: Date
  ): Promise<boolean> {
    const result = await query(
      `SELECT id FROM tasks
       WHERE workspace_id = $1
         AND id != $2
         AND status = 'scheduled'
         AND due_date = $3`,
      [workspaceId, taskId, startTime]
    )
    return result.rows.length > 0
  }

  async updateTaskSchedule(taskId: string, dueDate: Date): Promise<void> {
    await query(
      'UPDATE tasks SET due_date = $1, updated_at = NOW() WHERE id = $2',
      [dueDate, taskId]
    )
  }

  async updateUserLowEnergyMode(
    userId: string,
    lowEnergyMode: boolean
  ): Promise<void> {
    await query(
      'UPDATE users SET low_energy_mode = $1, updated_at = NOW() WHERE id = $2',
      [lowEnergyMode, userId]
    )
  }

  async getUserPreferences(userId: string): Promise<{
    id: string
    email: string
    name: string
    workspace_id: string
    low_energy_mode: boolean
    energy_pattern: any
  } | null> {
    const result = await query(
      'SELECT id, email, name, workspace_id, low_energy_mode, energy_pattern FROM users WHERE id = $1',
      [userId]
    )
    return result.rows[0] || null
  }

  async getUserEnergyPattern(userId: string): Promise<any> {
    const result = await query(
      'SELECT energy_pattern FROM users WHERE id = $1',
      [userId]
    )
    return result.rows[0]?.energy_pattern
  }
}

export default new CalendarRepository()

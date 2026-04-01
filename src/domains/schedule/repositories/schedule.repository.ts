import { query } from '../../../config/database.js'

interface Task {
  id: string
  title: string
  description?: string
  type: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  due_date?: Date
  estimated_duration?: number
}

interface ScheduleSlot {
  start_time: Date
  end_time: Date
}

interface UserPreferences {
  work_start_hour?: number
  work_end_hour?: number
  preferences?: Record<string, any>
}

class ScheduleRepository {
  async findTaskById(
    taskId: string,
    workspaceId: string
  ): Promise<Task | null> {
    const result = await query(
      'SELECT id, title, description, type, priority, due_date, estimated_duration FROM tasks WHERE id = $1 AND workspace_id = $2',
      [taskId, workspaceId]
    )
    return result.rows.length > 0 ? result.rows[0] : null
  }

  async findUserPreferences(
    userId: string,
    workspaceId: string
  ): Promise<UserPreferences | null> {
    const result = await query(
      'SELECT timezone, preferences FROM users WHERE id = $1 AND workspace_id = $2',
      [userId, workspaceId]
    )
    return result.rows.length > 0 ? result.rows[0] : null
  }

  async findOccupiedSlots(userId: string): Promise<ScheduleSlot[]> {
    const result = await query(
      'SELECT start_time, end_time FROM schedule_slots WHERE user_id = $1 AND status IN ($2, $3) ORDER BY start_time',
      [userId, 'scheduled', 'active']
    )
    return result.rows
  }
}

export default new ScheduleRepository()

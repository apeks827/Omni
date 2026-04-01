import { query } from '../../../config/database.js'

export interface Task {
  id: string
  title: string
  description?: string
  type: string
  estimated_duration?: number
}

interface DailyEnergyLevel {
  id: string
  user_id: string
  date: string
  energy_level: 'low' | 'normal' | 'high'
  created_at: Date
  updated_at: Date
}

class EnergyRepository {
  async findTaskById(
    taskId: string,
    workspaceId: string
  ): Promise<Task | null> {
    const result = await query(
      'SELECT id, title, description, type, estimated_duration FROM tasks WHERE id = $1 AND workspace_id = $2',
      [taskId, workspaceId]
    )
    return result.rows.length > 0 ? result.rows[0] : null
  }

  async setDailyEnergyLevel(
    userId: string,
    date: string,
    energyLevel: 'low' | 'normal' | 'high'
  ): Promise<DailyEnergyLevel> {
    const result = await query(
      `INSERT INTO daily_energy_levels (user_id, date, energy_level, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, date)
       DO UPDATE SET energy_level = $3, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, date, energyLevel]
    )
    return result.rows[0]
  }

  async getDailyEnergyLevel(
    userId: string,
    date: string
  ): Promise<DailyEnergyLevel | null> {
    const result = await query(
      'SELECT * FROM daily_energy_levels WHERE user_id = $1 AND date = $2',
      [userId, date]
    )
    return result.rows.length > 0 ? result.rows[0] : null
  }

  async getTasksByEnergyMatch(
    userId: string,
    energyLevel: 'low' | 'normal' | 'high',
    workspaceId: string
  ): Promise<Task[]> {
    const cognitiveLoadMap = {
      low: ['admin', 'light'],
      normal: ['admin', 'light', 'medium', 'deep_work'],
      high: ['deep_work', 'medium'],
    }

    const targetLoads = cognitiveLoadMap[energyLevel]

    const result = await query(
      `SELECT DISTINCT t.id, t.title, t.description, t.type, t.estimated_duration
       FROM tasks t
       LEFT JOIN task_cognitive_loads tcl ON t.id = tcl.task_id
       WHERE t.workspace_id = $1
         AND t.assignee_id = $2
         AND t.status IN ('pending', 'scheduled')
         AND (tcl.cognitive_load = ANY($3) OR tcl.cognitive_load IS NULL)
       ORDER BY t.created_at DESC
       LIMIT 20`,
      [workspaceId, userId, targetLoads]
    )
    return result.rows
  }
}

export default new EnergyRepository()

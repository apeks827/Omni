import { pool } from '../../../config/database.js'
import { TimerState } from '../models/TimeEntry.js'

export interface CreateTimerStateData {
  user_id: string
  task_id: string
  workspace_id: string
  pomodoro_type?: 'work' | 'break' | 'long_break'
}

class TimerRepository {
  async getActiveTimer(
    userId: string,
    workspaceId: string
  ): Promise<TimerState | null> {
    const result = await pool.query(
      `SELECT * FROM timer_states 
       WHERE user_id = $1 AND workspace_id = $2 AND status != 'stopped'
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, workspaceId]
    )
    return result.rows[0] || null
  }

  async create(data: CreateTimerStateData): Promise<TimerState> {
    await this.stopAllTimers(data.user_id, data.workspace_id)

    const result = await pool.query(
      `INSERT INTO timer_states (
        user_id, task_id, workspace_id, status, start_time, 
        elapsed_seconds, pomodoro_type, pomodoro_work_count
      ) VALUES ($1, $2, $3, 'running', NOW(), 0, $4, 0)
      RETURNING *`,
      [
        data.user_id,
        data.task_id,
        data.workspace_id,
        data.pomodoro_type || 'work',
      ]
    )
    return result.rows[0]
  }

  async update(
    userId: string,
    workspaceId: string,
    data: Partial<{
      status: 'running' | 'paused' | 'stopped'
      elapsed_seconds: number
      last_tick_at: Date
      pomodoro_type: 'work' | 'break' | 'long_break'
      pomodoro_work_count: number
    }>
  ): Promise<TimerState | null> {
    const fields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (data.status !== undefined) {
      fields.push(`status = $${paramIndex}`)
      values.push(data.status)
      paramIndex++
    }

    if (data.elapsed_seconds !== undefined) {
      fields.push(`elapsed_seconds = $${paramIndex}`)
      values.push(data.elapsed_seconds)
      paramIndex++
    }

    if (data.last_tick_at !== undefined) {
      fields.push(`last_tick_at = $${paramIndex}`)
      values.push(data.last_tick_at)
      paramIndex++
    }

    if (data.pomodoro_type !== undefined) {
      fields.push(`pomodoro_type = $${paramIndex}`)
      values.push(data.pomodoro_type)
      paramIndex++
    }

    if (data.pomodoro_work_count !== undefined) {
      fields.push(`pomodoro_work_count = $${paramIndex}`)
      values.push(data.pomodoro_work_count)
      paramIndex++
    }

    if (fields.length === 0) return null

    fields.push('updated_at = NOW()')
    values.push(userId, workspaceId)

    const result = await pool.query(
      `UPDATE timer_states 
       SET ${fields.join(', ')}
       WHERE user_id = $${paramIndex} AND workspace_id = $${paramIndex + 1}
         AND status != 'stopped'
       RETURNING *`,
      values
    )

    return result.rows[0] || null
  }

  async stopAllTimers(userId: string, workspaceId: string): Promise<void> {
    await pool.query(
      `UPDATE timer_states 
       SET status = 'stopped', updated_at = NOW()
       WHERE user_id = $1 AND workspace_id = $2 AND status != 'stopped'`,
      [userId, workspaceId]
    )
  }

  async delete(userId: string, workspaceId: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM timer_states WHERE user_id = $1 AND workspace_id = $2',
      [userId, workspaceId]
    )
    return result.rowCount !== null && result.rowCount > 0
  }
}

export default new TimerRepository()

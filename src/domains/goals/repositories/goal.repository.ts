import { query } from '../../../config/database.js'
import {
  Goal,
  GoalWithKeyResults,
  KeyResult,
  CreateGoalData,
  UpdateGoalData,
  CreateKeyResultData,
  UpdateKeyResultData,
  TaskGoalLink,
  LinkedTask,
} from '../types.js'

class GoalRepository {
  async findAll(statusFilter?: string): Promise<Goal[]> {
    let sql = 'SELECT * FROM goals WHERE 1=1'
    const params: any[] = []

    if (statusFilter) {
      params.push(statusFilter)
      sql += ` AND status = $${params.length}`
    }

    sql += ' ORDER BY created_at DESC'

    const result = await query(sql, params)
    return result.rows
  }

  async findById(id: string): Promise<GoalWithKeyResults | null> {
    const goalResult = await query('SELECT * FROM goals WHERE id = $1', [id])

    if (goalResult.rows.length === 0) {
      return null
    }

    const krResult = await query(
      'SELECT * FROM key_results WHERE goal_id = $1 ORDER BY created_at ASC',
      [id]
    )

    return {
      ...goalResult.rows[0],
      key_results: krResult.rows,
    }
  }

  async create(data: CreateGoalData): Promise<Goal> {
    const result = await query(
      `INSERT INTO goals (title, description, status, timeframe_type, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.title,
        data.description || null,
        data.status || 'draft',
        data.timeframe_type || 'quarter',
        data.start_date,
        data.end_date,
      ]
    )

    return result.rows[0]
  }

  async update(id: string, data: UpdateGoalData): Promise<Goal | null> {
    const fields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    Object.entries(data).forEach(([key, value]) => {
      fields.push(`${key} = $${paramIndex}`)
      values.push(value)
      paramIndex++
    })

    if (fields.length === 0) {
      return null
    }

    fields.push('updated_at = NOW()')
    values.push(id)

    const sql = `UPDATE goals SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`
    const result = await query(sql, values)

    return result.rows.length > 0 ? result.rows[0] : null
  }

  async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM goals WHERE id = $1 RETURNING id', [
      id,
    ])
    return result.rows.length > 0
  }

  async findKeyResultsByGoalId(goalId: string): Promise<KeyResult[]> {
    const result = await query(
      'SELECT * FROM key_results WHERE goal_id = $1 ORDER BY created_at ASC',
      [goalId]
    )
    return result.rows
  }

  async findKeyResultById(id: string): Promise<KeyResult | null> {
    const result = await query('SELECT * FROM key_results WHERE id = $1', [id])
    return result.rows.length > 0 ? result.rows[0] : null
  }

  async createKeyResult(
    goalId: string,
    data: CreateKeyResultData
  ): Promise<KeyResult> {
    const result = await query(
      `INSERT INTO key_results (goal_id, title, target_value, current_value, measurement_type, unit)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        goalId,
        data.title,
        data.target_value,
        data.current_value || 0,
        data.measurement_type || 'numeric',
        data.unit || null,
      ]
    )

    return result.rows[0]
  }

  async updateKeyResult(
    id: string,
    data: UpdateKeyResultData
  ): Promise<KeyResult | null> {
    const fields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    Object.entries(data).forEach(([key, value]) => {
      fields.push(`${key} = $${paramIndex}`)
      values.push(value)
      paramIndex++
    })

    if (fields.length === 0) {
      return null
    }

    fields.push('updated_at = NOW()')
    values.push(id)

    const sql = `UPDATE key_results SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`
    const result = await query(sql, values)

    return result.rows.length > 0 ? result.rows[0] : null
  }

  async deleteKeyResult(id: string): Promise<string | null> {
    const result = await query(
      'SELECT goal_id FROM key_results WHERE id = $1',
      [id]
    )

    if (result.rows.length === 0) {
      return null
    }

    const goalId = result.rows[0].goal_id

    await query('DELETE FROM key_results WHERE id = $1', [id])

    return goalId
  }

  async updateGoalProgress(goalId: string): Promise<void> {
    const krResult = await query(
      'SELECT progress_percentage FROM key_results WHERE goal_id = $1',
      [goalId]
    )

    let goalProgress = 0
    if (krResult.rows.length > 0) {
      const sum = krResult.rows.reduce(
        (acc: number, kr: any) =>
          acc + parseFloat(kr.progress_percentage || '0'),
        0
      )
      goalProgress = sum / krResult.rows.length
    }

    await query(
      'UPDATE goals SET progress_percentage = $1, updated_at = NOW() WHERE id = $2',
      [goalProgress, goalId]
    )
  }

  async linkTaskToGoal(
    taskId: string,
    goalId: string,
    keyResultId?: string
  ): Promise<TaskGoalLink> {
    const existingResult = await query(
      'SELECT task_id, goal_id FROM task_goal_links WHERE task_id = $1 AND goal_id = $2',
      [taskId, goalId]
    )

    if (existingResult.rows.length > 0) {
      await query(
        'UPDATE task_goal_links SET key_result_id = $1 WHERE task_id = $2 AND goal_id = $3',
        [keyResultId || null, taskId, goalId]
      )
      return {
        task_id: taskId,
        goal_id: goalId,
        key_result_id: keyResultId,
        created_at: new Date(),
      }
    }

    const result = await query(
      `INSERT INTO task_goal_links (task_id, goal_id, key_result_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [taskId, goalId, keyResultId || null]
    )

    return result.rows[0]
  }

  async unlinkTaskFromGoal(taskId: string, goalId: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM task_goal_links WHERE task_id = $1 AND goal_id = $2 RETURNING *',
      [taskId, goalId]
    )
    return result.rows.length > 0
  }

  async findTaskGoalLinks(taskId: string): Promise<TaskGoalLink[]> {
    const result = await query(
      `SELECT tgl.*, g.title as goal_title, g.status as goal_status,
              kr.title as key_result_title, kr.progress_percentage as kr_progress
       FROM task_goal_links tgl
       JOIN goals g ON g.id = tgl.goal_id
       LEFT JOIN key_results kr ON kr.id = tgl.key_result_id
       WHERE tgl.task_id = $1`,
      [taskId]
    )
    return result.rows
  }

  async findGoalTasks(goalId: string): Promise<LinkedTask[]> {
    const result = await query(
      `SELECT t.*, tgl.key_result_id, kr.title as key_result_title
       FROM tasks t
       JOIN task_goal_links tgl ON tgl.task_id = t.id
       LEFT JOIN key_results kr ON kr.id = tgl.key_result_id
       WHERE tgl.goal_id = $1
       ORDER BY t.created_at DESC`,
      [goalId]
    )
    return result.rows
  }

  async goalExists(id: string): Promise<boolean> {
    const result = await query('SELECT id FROM goals WHERE id = $1', [id])
    return result.rows.length > 0
  }

  async taskExists(id: string): Promise<boolean> {
    const result = await query('SELECT id FROM tasks WHERE id = $1', [id])
    return result.rows.length > 0
  }

  async keyResultBelongsToGoal(
    keyResultId: string,
    goalId: string
  ): Promise<boolean> {
    const result = await query(
      'SELECT id FROM key_results WHERE id = $1 AND goal_id = $2',
      [keyResultId, goalId]
    )
    return result.rows.length > 0
  }
}

export default new GoalRepository()

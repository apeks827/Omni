import { pool } from '../../config/database.js'

interface CreateRoutineData {
  user_id: string
  name: string
  time_window?: 'morning' | 'afternoon' | 'evening'
}

interface UpdateRoutineData {
  name?: string
  time_window?: 'morning' | 'afternoon' | 'evening'
}

interface CreateStepData {
  routine_id: string
  order_index: number
  name: string
  duration_minutes: number
}

interface UpdateStepData {
  name?: string
  duration_minutes?: number
  order_index?: number
}

export class RoutineService {
  async createRoutine(data: CreateRoutineData) {
    const result = await pool.query(
      `INSERT INTO routines (user_id, name, time_window)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.user_id, data.name, data.time_window || null]
    )
    return result.rows[0]
  }

  async listRoutines(userId: string) {
    const result = await pool.query(
      `SELECT r.*, 
        (SELECT COUNT(*) FROM routine_steps WHERE routine_id = r.id) as step_count,
        (SELECT SUM(duration_minutes) FROM routine_steps WHERE routine_id = r.id) as total_duration
       FROM routines r
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    )
    return result.rows
  }

  async getRoutine(id: string, userId: string) {
    const result = await pool.query(
      'SELECT * FROM routines WHERE id = $1 AND user_id = $2',
      [id, userId]
    )
    if (result.rows.length === 0) {
      throw new Error('Routine not found')
    }
    return result.rows[0]
  }

  async getRoutineWithSteps(id: string, userId: string) {
    const routine = await this.getRoutine(id, userId)

    const stepsResult = await pool.query(
      `SELECT * FROM routine_steps 
       WHERE routine_id = $1 
       ORDER BY order_index ASC`,
      [id]
    )

    return {
      ...routine,
      steps: stepsResult.rows,
    }
  }

  async updateRoutine(id: string, userId: string, data: UpdateRoutineData) {
    const fields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex}`)
      values.push(data.name)
      paramIndex++
    }

    if (data.time_window !== undefined) {
      fields.push(`time_window = $${paramIndex}`)
      values.push(data.time_window)
      paramIndex++
    }

    if (fields.length === 0) {
      return this.getRoutine(id, userId)
    }

    fields.push('updated_at = NOW()')
    values.push(id, userId)

    const result = await pool.query(
      `UPDATE routines SET ${fields.join(', ')}
       WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
       RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      throw new Error('Routine not found')
    }

    return result.rows[0]
  }

  async deleteRoutine(id: string, userId: string) {
    const result = await pool.query(
      'DELETE FROM routines WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    )
    if (result.rows.length === 0) {
      throw new Error('Routine not found')
    }
  }

  async addStep(routineId: string, userId: string, data: CreateStepData) {
    await this.getRoutine(routineId, userId)

    const result = await pool.query(
      `INSERT INTO routine_steps (routine_id, order_index, name, duration_minutes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [routineId, data.order_index, data.name, data.duration_minutes]
    )

    await this.updateRoutineTotalSteps(routineId)

    return result.rows[0]
  }

  async updateStep(
    routineId: string,
    stepId: string,
    userId: string,
    data: UpdateStepData
  ) {
    await this.getRoutine(routineId, userId)

    const fields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex}`)
      values.push(data.name)
      paramIndex++
    }

    if (data.duration_minutes !== undefined) {
      fields.push(`duration_minutes = $${paramIndex}`)
      values.push(data.duration_minutes)
      paramIndex++
    }

    if (data.order_index !== undefined) {
      fields.push(`order_index = $${paramIndex}`)
      values.push(data.order_index)
      paramIndex++
    }

    if (fields.length === 0) {
      const stepResult = await pool.query(
        'SELECT * FROM routine_steps WHERE id = $1 AND routine_id = $2',
        [stepId, routineId]
      )
      if (stepResult.rows.length === 0) {
        throw new Error('Step not found')
      }
      return stepResult.rows[0]
    }

    values.push(stepId, routineId)

    const result = await pool.query(
      `UPDATE routine_steps SET ${fields.join(', ')}
       WHERE id = $${paramIndex} AND routine_id = $${paramIndex + 1}
       RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      throw new Error('Step not found')
    }

    return result.rows[0]
  }

  async removeStep(routineId: string, stepId: string, userId: string) {
    await this.getRoutine(routineId, userId)

    const result = await pool.query(
      'DELETE FROM routine_steps WHERE id = $1 AND routine_id = $2 RETURNING id',
      [stepId, routineId]
    )

    if (result.rows.length === 0) {
      throw new Error('Step not found')
    }

    await this.updateRoutineTotalSteps(routineId)
  }

  async startRoutine(
    routineId: string,
    userId: string,
    scheduledDate?: string
  ) {
    await this.getRoutine(routineId, userId)

    const stepsResult = await pool.query(
      'SELECT COUNT(*) as total_steps FROM routine_steps WHERE routine_id = $1',
      [routineId]
    )
    const totalSteps = parseInt(stepsResult.rows[0].total_steps)

    const date = scheduledDate || new Date().toISOString().split('T')[0]

    const existingResult = await pool.query(
      `SELECT * FROM routine_completions 
       WHERE routine_id = $1 AND scheduled_date = $2`,
      [routineId, date]
    )

    if (existingResult.rows.length > 0) {
      return existingResult.rows[0]
    }

    const result = await pool.query(
      `INSERT INTO routine_completions (routine_id, scheduled_date, total_steps)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [routineId, date, totalSteps]
    )

    return result.rows[0]
  }

  async completeStep(
    routineId: string,
    stepId: string,
    userId: string,
    scheduledDate?: string
  ) {
    await this.getRoutine(routineId, userId)

    const stepResult = await pool.query(
      'SELECT * FROM routine_steps WHERE id = $1 AND routine_id = $2',
      [stepId, routineId]
    )
    if (stepResult.rows.length === 0) {
      throw new Error('Step not found')
    }

    const date = scheduledDate || new Date().toISOString().split('T')[0]

    const completionResult = await pool.query(
      `SELECT * FROM routine_completions 
       WHERE routine_id = $1 AND scheduled_date = $2`,
      [routineId, date]
    )

    if (completionResult.rows.length === 0) {
      const stepsCount = await pool.query(
        'SELECT COUNT(*) as total FROM routine_steps WHERE routine_id = $1',
        [routineId]
      )
      await pool.query(
        `INSERT INTO routine_completions (routine_id, scheduled_date, completed_steps, total_steps)
         VALUES ($1, $2, 1, $3)`,
        [routineId, date, parseInt(stepsCount.rows[0].total)]
      )
    } else {
      await pool.query(
        `UPDATE routine_completions 
         SET completed_steps = completed_steps + 1,
             completed_at = CASE WHEN completed_steps + 1 = total_steps THEN NOW() ELSE completed_at END
         WHERE routine_id = $1 AND scheduled_date = $2`,
        [routineId, date]
      )
    }

    const updated = await pool.query(
      'SELECT * FROM routine_completions WHERE routine_id = $1 AND scheduled_date = $2',
      [routineId, date]
    )

    return {
      step_completed: true,
      progress: updated.rows[0],
    }
  }

  async getRoutineProgress(
    routineId: string,
    userId: string,
    scheduledDate?: string
  ) {
    await this.getRoutine(routineId, userId)

    const date = scheduledDate || new Date().toISOString().split('T')[0]

    const progressResult = await pool.query(
      `SELECT * FROM routine_completions 
       WHERE routine_id = $1 AND scheduled_date = $2`,
      [routineId, date]
    )

    if (progressResult.rows.length === 0) {
      return {
        routine_id: routineId,
        scheduled_date: date,
        completed_steps: 0,
        total_steps: 0,
        is_complete: false,
      }
    }

    const progress = progressResult.rows[0]
    return {
      routine_id: routineId,
      scheduled_date: date,
      completed_steps: progress.completed_steps,
      total_steps: progress.total_steps,
      is_complete: progress.completed_steps === progress.total_steps,
      completed_at: progress.completed_at,
    }
  }

  async getRoutineStats(routineId: string, userId: string) {
    await this.getRoutine(routineId, userId)

    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_scheduled,
        COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as total_completed,
        AVG(completed_steps * 100.0 / NULLIF(total_steps, 0)) as avg_completion_rate
       FROM routine_completions
       WHERE routine_id = $1`,
      [routineId]
    )

    const stats = result.rows[0]

    return {
      routine_id: routineId,
      total_scheduled: parseInt(stats.total_scheduled),
      total_completed: parseInt(stats.total_completed),
      avg_completion_rate: stats.avg_completion_rate
        ? parseFloat(stats.avg_completion_rate.toFixed(2))
        : 0,
    }
  }

  private async updateRoutineTotalSteps(routineId: string) {
    await pool.query('UPDATE routines SET updated_at = NOW() WHERE id = $1', [
      routineId,
    ])
  }
}

export default new RoutineService()

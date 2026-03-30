import { pool } from '../../config/database.js'

interface CreateHabitData {
  user_id: string
  name: string
  description?: string
  frequency_type: 'daily' | 'weekly' | 'custom'
  frequency_value?: string
  preferred_time_start?: string
  preferred_time_end?: string
  duration_minutes: number
  energy_level?: 'low' | 'medium' | 'high'
}

interface UpdateHabitData {
  name?: string
  description?: string
  frequency_type?: 'daily' | 'weekly' | 'custom'
  frequency_value?: string
  preferred_time_start?: string
  preferred_time_end?: string
  duration_minutes?: number
  energy_level?: 'low' | 'medium' | 'high'
}

export class HabitService {
  async createHabit(data: CreateHabitData) {
    const result = await pool.query(
      `INSERT INTO habits (
        user_id, name, description, frequency_type, frequency_value,
        preferred_time_start, preferred_time_end, duration_minutes, energy_level
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        data.user_id,
        data.name,
        data.description || null,
        data.frequency_type,
        data.frequency_value || null,
        data.preferred_time_start || null,
        data.preferred_time_end || null,
        data.duration_minutes,
        data.energy_level || null,
      ]
    )
    return result.rows[0]
  }

  async listHabits(userId: string) {
    const result = await pool.query(
      'SELECT * FROM habits WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    )
    return result.rows
  }

  async getHabit(id: string, userId: string) {
    const result = await pool.query(
      'SELECT * FROM habits WHERE id = $1 AND user_id = $2',
      [id, userId]
    )
    if (result.rows.length === 0) {
      throw new Error('Habit not found')
    }
    return result.rows[0]
  }

  async updateHabit(id: string, userId: string, data: UpdateHabitData) {
    const fields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex}`)
      values.push(data.name)
      paramIndex++
    }

    if (data.description !== undefined) {
      fields.push(`description = $${paramIndex}`)
      values.push(data.description)
      paramIndex++
    }

    if (data.frequency_type !== undefined) {
      fields.push(`frequency_type = $${paramIndex}`)
      values.push(data.frequency_type)
      paramIndex++
    }

    if (data.frequency_value !== undefined) {
      fields.push(`frequency_value = $${paramIndex}`)
      values.push(data.frequency_value)
      paramIndex++
    }

    if (data.preferred_time_start !== undefined) {
      fields.push(`preferred_time_start = $${paramIndex}`)
      values.push(data.preferred_time_start)
      paramIndex++
    }

    if (data.preferred_time_end !== undefined) {
      fields.push(`preferred_time_end = $${paramIndex}`)
      values.push(data.preferred_time_end)
      paramIndex++
    }

    if (data.duration_minutes !== undefined) {
      fields.push(`duration_minutes = $${paramIndex}`)
      values.push(data.duration_minutes)
      paramIndex++
    }

    if (data.energy_level !== undefined) {
      fields.push(`energy_level = $${paramIndex}`)
      values.push(data.energy_level)
      paramIndex++
    }

    if (fields.length === 0) {
      return this.getHabit(id, userId)
    }

    fields.push('updated_at = NOW()')
    values.push(id, userId)

    const result = await pool.query(
      `UPDATE habits SET ${fields.join(', ')} 
       WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
       RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      throw new Error('Habit not found')
    }

    return result.rows[0]
  }

  async deleteHabit(id: string, userId: string) {
    const result = await pool.query(
      'DELETE FROM habits WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    )
    if (result.rows.length === 0) {
      throw new Error('Habit not found')
    }
  }

  async completeHabit(id: string, userId: string, note?: string) {
    await this.getHabit(id, userId)

    await pool.query(
      `INSERT INTO habit_completions (habit_id, note, skipped)
       VALUES ($1, $2, false)`,
      [id, note || null]
    )

    await this.updateStreak(id)

    return { success: true, message: 'Habit marked complete' }
  }

  async skipHabit(id: string, userId: string, note?: string) {
    await this.getHabit(id, userId)

    await pool.query(
      `INSERT INTO habit_completions (habit_id, note, skipped)
       VALUES ($1, $2, true)`,
      [id, note || null]
    )

    await pool.query('UPDATE habits SET current_streak = 0 WHERE id = $1', [id])

    return { success: true, message: 'Habit skipped' }
  }

  async getHabitStats(id: string, userId: string) {
    const habit = await this.getHabit(id, userId)

    const completionResult = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE skipped = false) as total_completions,
        COUNT(*) FILTER (WHERE skipped = true) as total_skips,
        COUNT(*) FILTER (WHERE skipped = false AND completed_at >= NOW() - INTERVAL '7 days') as completions_last_7_days,
        COUNT(*) FILTER (WHERE skipped = false AND completed_at >= NOW() - INTERVAL '30 days') as completions_last_30_days
       FROM habit_completions
       WHERE habit_id = $1`,
      [id]
    )

    const stats = completionResult.rows[0]

    return {
      habit_id: id,
      current_streak: habit.current_streak,
      best_streak: habit.best_streak,
      total_completions: parseInt(stats.total_completions),
      total_skips: parseInt(stats.total_skips),
      completions_last_7_days: parseInt(stats.completions_last_7_days),
      completions_last_30_days: parseInt(stats.completions_last_30_days),
    }
  }

  private async updateStreak(habitId: string) {
    const result = await pool.query(
      `SELECT completed_at, skipped 
       FROM habit_completions 
       WHERE habit_id = $1 
       ORDER BY completed_at DESC 
       LIMIT 30`,
      [habitId]
    )

    let currentStreak = 0
    const completions = result.rows

    for (const completion of completions) {
      if (completion.skipped) {
        break
      }
      currentStreak++
    }

    await pool.query(
      `UPDATE habits 
       SET current_streak = $1,
           best_streak = GREATEST(best_streak, $1)
       WHERE id = $2`,
      [currentStreak, habitId]
    )
  }
}

export default new HabitService()

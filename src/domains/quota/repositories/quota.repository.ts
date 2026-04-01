import { pool } from '../../../config/database.js'

interface QuotaData {
  daily_quota: number
  daily_used: number
  daily_reset_at: Date
  weekly_quota: number
  weekly_used: number
  weekly_reset_at: Date
  monthly_quota: number
  monthly_used: number
  monthly_reset_at: Date
}

class QuotaRepository {
  async findByUserId(userId: string): Promise<QuotaData | null> {
    const result = await pool.query(
      `SELECT 
        daily_quota, daily_used, daily_reset_at,
        weekly_quota, weekly_used, weekly_reset_at,
        monthly_quota, monthly_used, monthly_reset_at
       FROM api_quotas 
       WHERE user_id = $1`,
      [userId]
    )

    return result.rows.length > 0 ? result.rows[0] : null
  }

  async updateLimits(
    userId: string,
    limits: { daily?: number; weekly?: number; monthly?: number }
  ): Promise<QuotaData> {
    const existing = await pool.query(
      'SELECT id FROM api_quotas WHERE user_id = $1',
      [userId]
    )

    if (existing.rows.length > 0) {
      const updates: string[] = []
      const values: any[] = []
      let paramCount = 1

      if (limits.daily !== undefined) {
        updates.push(`daily_quota = $${paramCount++}`)
        values.push(limits.daily)
      }
      if (limits.weekly !== undefined) {
        updates.push(`weekly_quota = $${paramCount++}`)
        values.push(limits.weekly)
      }
      if (limits.monthly !== undefined) {
        updates.push(`monthly_quota = $${paramCount++}`)
        values.push(limits.monthly)
      }

      values.push(userId)
      const result = await pool.query(
        `UPDATE api_quotas SET ${updates.join(', ')} 
         WHERE user_id = $${paramCount} 
         RETURNING *`,
        values
      )
      return result.rows[0]
    } else {
      const now = new Date()
      const result = await pool.query(
        `INSERT INTO api_quotas (
          user_id, daily_quota, daily_used, daily_reset_at,
          weekly_quota, weekly_used, weekly_reset_at,
          monthly_quota, monthly_used, monthly_reset_at
        ) VALUES ($1, $2, 0, $3, $4, 0, $5, $6, 0, $7)
        RETURNING *`,
        [
          userId,
          limits.daily || 1000,
          new Date(now.getTime() + 24 * 60 * 60 * 1000),
          limits.weekly || 5000,
          new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          limits.monthly || 20000,
          new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        ]
      )
      return result.rows[0]
    }
  }
}

export default new QuotaRepository()

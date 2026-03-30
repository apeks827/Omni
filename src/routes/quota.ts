import { Router, Response } from 'express'
import { pool } from '../config/database.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { quotaMiddleware } from '../middleware/rateLimitAdvanced.js'

const router = Router()

router.get(
  '/usage',
  authenticateToken,
  quotaMiddleware({ daily: 1000, weekly: 5000, monthly: 20000 }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT 
          daily_quota, daily_used, daily_reset_at,
          weekly_quota, weekly_used, weekly_reset_at,
          monthly_quota, monthly_used, monthly_reset_at
         FROM api_quotas 
         WHERE user_id = $1`,
        [req.userId]
      )

      const quota = result.rows[0] || {
        daily_quota: 1000,
        daily_used: 0,
        weekly_quota: 5000,
        weekly_used: 0,
        monthly_quota: 20000,
        monthly_used: 0,
      }

      const now = new Date()
      const dailyResetAt = new Date(quota.daily_reset_at || now)
      const weeklyResetAt = new Date(quota.weekly_reset_at || now)
      const monthlyResetAt = new Date(quota.monthly_reset_at || now)

      const usage = {
        daily: {
          limit: quota.daily_quota,
          used: quota.daily_used,
          remaining: Math.max(0, quota.daily_quota - quota.daily_used),
          resetAt: dailyResetAt.toISOString(),
        },
        weekly: {
          limit: quota.weekly_quota,
          used: quota.weekly_used,
          remaining: Math.max(0, quota.weekly_quota - quota.weekly_used),
          resetAt: weeklyResetAt.toISOString(),
        },
        monthly: {
          limit: quota.monthly_quota,
          used: quota.monthly_used,
          remaining: Math.max(0, quota.monthly_quota - quota.monthly_used),
          resetAt: monthlyResetAt.toISOString(),
        },
      }

      const alertThresholds = {
        daily: usage.daily.remaining / usage.daily.limit <= 0.1,
        weekly: usage.weekly.remaining / usage.weekly.limit <= 0.1,
        monthly: usage.monthly.remaining / usage.monthly.limit <= 0.1,
      }

      res.json({
        usage,
        alerts: alertThresholds,
      })
    } catch (error) {
      console.error('Error fetching usage:', error)
      res.status(500).json({ error: 'Failed to fetch usage data' })
    }
  }
)

router.get(
  '/limits',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT 
          daily_quota, weekly_quota, monthly_quota
         FROM api_quotas 
         WHERE user_id = $1`,
        [req.userId]
      )

      const limits = result.rows[0] || {
        daily_quota: 1000,
        weekly_quota: 5000,
        monthly_quota: 20000,
      }

      res.json({
        limits: {
          daily: limits.daily_quota,
          weekly: limits.weekly_quota,
          monthly: limits.monthly_quota,
        },
      })
    } catch (error) {
      console.error('Error fetching limits:', error)
      res.status(500).json({ error: 'Failed to fetch limits' })
    }
  }
)

router.put(
  '/limits',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { daily, weekly, monthly } = req.body

      if (!daily && !weekly && !monthly) {
        return res
          .status(400)
          .json({ error: 'At least one quota limit is required' })
      }

      if (daily && (typeof daily !== 'number' || daily < 1 || daily > 100000)) {
        return res
          .status(400)
          .json({ error: 'Daily quota must be between 1 and 100000' })
      }
      if (
        weekly &&
        (typeof weekly !== 'number' || weekly < 1 || weekly > 500000)
      ) {
        return res
          .status(400)
          .json({ error: 'Weekly quota must be between 1 and 500000' })
      }
      if (
        monthly &&
        (typeof monthly !== 'number' || monthly < 1 || monthly > 2000000)
      ) {
        return res
          .status(400)
          .json({ error: 'Monthly quota must be between 1 and 2000000' })
      }

      const existing = await pool.query(
        'SELECT id FROM api_quotas WHERE user_id = $1',
        [req.userId]
      )

      let updatedQuotas
      if (existing.rows.length > 0) {
        const updates: string[] = []
        const values: any[] = []
        let paramCount = 1

        if (daily !== undefined) {
          updates.push(`daily_quota = $${paramCount++}`)
          values.push(daily)
        }
        if (weekly !== undefined) {
          updates.push(`weekly_quota = $${paramCount++}`)
          values.push(weekly)
        }
        if (monthly !== undefined) {
          updates.push(`monthly_quota = $${paramCount++}`)
          values.push(monthly)
        }

        values.push(req.userId)
        const result = await pool.query(
          `UPDATE api_quotas SET ${updates.join(', ')} 
           WHERE user_id = $${paramCount} 
           RETURNING *`,
          values
        )
        updatedQuotas = result.rows[0]
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
            req.userId,
            daily || 1000,
            new Date(now.getTime() + 24 * 60 * 60 * 1000),
            weekly || 5000,
            new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            monthly || 20000,
            new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          ]
        )
        updatedQuotas = result.rows[0]
      }

      res.json({
        message: 'Quotas updated successfully',
        limits: {
          daily: updatedQuotas.daily_quota,
          weekly: updatedQuotas.weekly_quota,
          monthly: updatedQuotas.monthly_quota,
        },
      })
    } catch (error) {
      console.error('Error updating limits:', error)
      res.status(500).json({ error: 'Failed to update limits' })
    }
  }
)

export default router

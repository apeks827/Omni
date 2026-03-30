import { Request, Response, NextFunction } from 'express'
import { AuthRequest } from './auth.js'
import { pool } from '../config/database.js'

interface RateLimitConfig {
  windowMs: number
  max: number
  message?: string
  keyGenerator?: (req: Request) => string
}

interface QuotaConfig {
  daily?: number
  weekly?: number
  monthly?: number
}

const memoryStore: Map<string, { count: number; resetTime: number }> = new Map()

const cleanupInterval = setInterval(() => {
  const now = Date.now()
  const keysToDelete: string[] = []
  memoryStore.forEach((value, key) => {
    if (now > value.resetTime) {
      keysToDelete.push(key)
    }
  })
  keysToDelete.forEach(key => memoryStore.delete(key))
}, 60000)

if (cleanupInterval.unref) {
  cleanupInterval.unref()
}

export const rateLimitMiddleware = (config: RateLimitConfig) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = config.keyGenerator
      ? config.keyGenerator(req)
      : req.ip || req.header('x-forwarded-for') || 'default'

    const now = Date.now()
    const entry = memoryStore.get(key)

    if (!entry || now > entry.resetTime) {
      memoryStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      })

      const remaining = config.max - 1
      const resetTime = Math.ceil((now + config.windowMs) / 1000)

      res.setHeader('X-RateLimit-Limit', config.max.toString())
      res.setHeader('X-RateLimit-Remaining', remaining.toString())
      res.setHeader('X-RateLimit-Reset', resetTime.toString())

      return next()
    }

    entry.count++
    const remaining = Math.max(0, config.max - entry.count)
    const resetTime = Math.ceil(entry.resetTime / 1000)

    res.setHeader('X-RateLimit-Limit', config.max.toString())
    res.setHeader('X-RateLimit-Remaining', remaining.toString())
    res.setHeader('X-RateLimit-Reset', resetTime.toString())

    if (entry.count > config.max) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
      res.setHeader('Retry-After', retryAfter.toString())

      return res.status(429).json({
        error: config.message || 'Too many requests, please try again later.',
        retryAfter,
      })
    }

    next()
  }
}

export const quotaMiddleware = (config: QuotaConfig) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

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

      let quotaRecord = result.rows[0]
      const now = new Date()

      if (!quotaRecord) {
        await pool.query(
          `INSERT INTO api_quotas (
            user_id, 
            daily_quota, daily_used, daily_reset_at,
            weekly_quota, weekly_used, weekly_reset_at,
            monthly_quota, monthly_used, monthly_reset_at
          ) VALUES ($1, $2, 0, $3, $4, 0, $5, $6, 0, $7)`,
          [
            req.userId,
            config.daily || 1000,
            new Date(now.getTime() + 24 * 60 * 60 * 1000),
            config.weekly || 5000,
            new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            config.monthly || 20000,
            new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          ]
        )
        return next()
      }

      if (now > new Date(quotaRecord.daily_reset_at)) {
        await pool.query(
          `UPDATE api_quotas 
           SET daily_used = 0, daily_reset_at = $1 
           WHERE user_id = $2`,
          [new Date(now.getTime() + 24 * 60 * 60 * 1000), req.userId]
        )
        quotaRecord.daily_used = 0
      }

      if (now > new Date(quotaRecord.weekly_reset_at)) {
        await pool.query(
          `UPDATE api_quotas 
           SET weekly_used = 0, weekly_reset_at = $1 
           WHERE user_id = $2`,
          [new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), req.userId]
        )
        quotaRecord.weekly_used = 0
      }

      if (now > new Date(quotaRecord.monthly_reset_at)) {
        await pool.query(
          `UPDATE api_quotas 
           SET monthly_used = 0, monthly_reset_at = $1 
           WHERE user_id = $2`,
          [new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), req.userId]
        )
        quotaRecord.monthly_used = 0
      }

      if (config.daily && quotaRecord.daily_used >= quotaRecord.daily_quota) {
        return res.status(429).json({
          error: 'Daily API quota exceeded',
          quota: {
            limit: quotaRecord.daily_quota,
            used: quotaRecord.daily_used,
            resetAt: quotaRecord.daily_reset_at,
          },
        })
      }

      if (
        config.weekly &&
        quotaRecord.weekly_used >= quotaRecord.weekly_quota
      ) {
        return res.status(429).json({
          error: 'Weekly API quota exceeded',
          quota: {
            limit: quotaRecord.weekly_quota,
            used: quotaRecord.weekly_used,
            resetAt: quotaRecord.weekly_reset_at,
          },
        })
      }

      if (
        config.monthly &&
        quotaRecord.monthly_used >= quotaRecord.monthly_quota
      ) {
        return res.status(429).json({
          error: 'Monthly API quota exceeded',
          quota: {
            limit: quotaRecord.monthly_quota,
            used: quotaRecord.monthly_used,
            resetAt: quotaRecord.monthly_reset_at,
          },
        })
      }

      await pool.query(
        `UPDATE api_quotas 
         SET daily_used = daily_used + 1,
             weekly_used = weekly_used + 1,
             monthly_used = monthly_used + 1
         WHERE user_id = $1`,
        [req.userId]
      )

      res.setHeader('X-Quota-Daily-Limit', quotaRecord.daily_quota.toString())
      res.setHeader(
        'X-Quota-Daily-Remaining',
        (quotaRecord.daily_quota - quotaRecord.daily_used - 1).toString()
      )
      res.setHeader('X-Quota-Weekly-Limit', quotaRecord.weekly_quota.toString())
      res.setHeader(
        'X-Quota-Weekly-Remaining',
        (quotaRecord.weekly_quota - quotaRecord.weekly_used - 1).toString()
      )
      res.setHeader(
        'X-Quota-Monthly-Limit',
        quotaRecord.monthly_quota.toString()
      )
      res.setHeader(
        'X-Quota-Monthly-Remaining',
        (quotaRecord.monthly_quota - quotaRecord.monthly_used - 1).toString()
      )

      next()
    } catch (error) {
      console.error('Quota middleware error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
}

export const clearMemoryStore = () => {
  memoryStore.clear()
}

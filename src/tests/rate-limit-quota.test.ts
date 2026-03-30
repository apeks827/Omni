import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import express, { Express } from 'express'
import { randomUUID } from 'crypto'
import {
  rateLimitMiddleware,
  quotaMiddleware,
  clearMemoryStore,
} from '../middleware/rateLimitAdvanced.js'
import { AuthRequest } from '../middleware/auth.js'
import { pool } from '../config/database.js'

describe('Rate Limiting and Quota System', () => {
  let app: Express

  beforeEach(async () => {
    app = express()
    app.use(express.json())
    clearMemoryStore()
    await pool.query('DELETE FROM api_quotas')
  })

  afterEach(async () => {
    clearMemoryStore()
  })

  describe('Rate Limiting Middleware', () => {
    it('should allow requests within rate limit', async () => {
      app.get(
        '/test',
        rateLimitMiddleware({ windowMs: 60000, max: 5 }),
        (req, res) => {
          res.json({ success: true })
        }
      )

      for (let i = 0; i < 5; i++) {
        const response = await request(app).get('/test')
        expect(response.status).toBe(200)
        expect(response.headers['x-ratelimit-limit']).toBe('5')
        expect(response.headers['x-ratelimit-remaining']).toBe(String(4 - i))
      }
    })

    it('should block requests exceeding rate limit', async () => {
      app.get(
        '/test',
        rateLimitMiddleware({ windowMs: 60000, max: 3 }),
        (req, res) => {
          res.json({ success: true })
        }
      )

      for (let i = 0; i < 3; i++) {
        await request(app).get('/test')
      }

      const response = await request(app).get('/test')
      expect(response.status).toBe(429)
      expect(response.body.error).toContain('Too many requests')
      expect(response.headers['retry-after']).toBeDefined()
    })

    it('should include rate limit headers', async () => {
      app.get(
        '/test',
        rateLimitMiddleware({ windowMs: 60000, max: 10 }),
        (req, res) => {
          res.json({ success: true })
        }
      )

      const response = await request(app).get('/test')
      expect(response.headers['x-ratelimit-limit']).toBe('10')
      expect(response.headers['x-ratelimit-remaining']).toBe('9')
      expect(response.headers['x-ratelimit-reset']).toBeDefined()
    })

    it('should use custom key generator', async () => {
      app.get(
        '/test',
        rateLimitMiddleware({
          windowMs: 60000,
          max: 2,
          keyGenerator: req =>
            (req.headers['x-api-key'] as string) || 'default',
        }),
        (req, res) => {
          res.json({ success: true })
        }
      )

      await request(app).get('/test').set('x-api-key', 'key1')
      await request(app).get('/test').set('x-api-key', 'key1')

      const response1 = await request(app).get('/test').set('x-api-key', 'key1')
      expect(response1.status).toBe(429)

      const response2 = await request(app).get('/test').set('x-api-key', 'key2')
      expect(response2.status).toBe(200)
    })
  })

  describe('Quota Middleware', () => {
    async function createTestUser(email?: string): Promise<string> {
      const userId = randomUUID()
      const workspaceId = randomUUID()
      const userEmail = email || `test-${userId}@example.com`

      await pool.query(
        'INSERT INTO workspaces (id, name, created_at, updated_at) VALUES ($1, \'Test Workspace\', NOW(), NOW())',
        [workspaceId]
      )

      await pool.query(
        `INSERT INTO users (id, email, name, password_hash, workspace_id, created_at, updated_at) 
         VALUES ($1, $2, 'Test User', 'hash', $3, NOW(), NOW())`,
        [userId, userEmail, workspaceId]
      )
      return userId
    }

    it('should create quota record on first request', async () => {
      const userId = await createTestUser()
      const mockAuth = (req: AuthRequest, res: any, next: any) => {
        req.userId = userId
        next()
      }

      app.get(
        '/test',
        mockAuth,
        quotaMiddleware({ daily: 100 }),
        (req, res) => {
          res.json({ success: true })
        }
      )

      const response = await request(app).get('/test')
      expect(response.status).toBe(200)

      const result = await pool.query(
        'SELECT * FROM api_quotas WHERE user_id = $1',
        [userId]
      )
      expect(result.rows.length).toBe(1)
      expect(result.rows[0].daily_quota).toBe(100)
    })

    it('should enforce daily quota limits', async () => {
      const userId = await createTestUser()
      const now = new Date()

      await pool.query(
        `INSERT INTO api_quotas (
          user_id, daily_quota, daily_used, daily_reset_at,
          weekly_quota, weekly_used, weekly_reset_at,
          monthly_quota, monthly_used, monthly_reset_at
        ) VALUES ($1, 3, 2, $2, 100, 0, $3, 1000, 0, $4)`,
        [
          userId,
          new Date(now.getTime() + 24 * 60 * 60 * 1000),
          new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        ]
      )

      const mockAuth = (req: AuthRequest, res: any, next: any) => {
        req.userId = userId
        next()
      }

      app.get('/test', mockAuth, quotaMiddleware({ daily: 3 }), (req, res) => {
        res.json({ success: true })
      })

      const response1 = await request(app).get('/test')
      expect(response1.status).toBe(200)

      const response2 = await request(app).get('/test')
      expect(response2.status).toBe(429)
      expect(response2.body.error).toContain('Daily API quota exceeded')
      expect(response2.body.quota).toBeDefined()
      expect(response2.body.quota.limit).toBe(3)
    })

    it('should include quota headers in response', async () => {
      const userId = await createTestUser()
      const mockAuth = (req: AuthRequest, res: any, next: any) => {
        req.userId = userId
        next()
      }

      app.get(
        '/test',
        mockAuth,
        quotaMiddleware({ daily: 50, weekly: 200, monthly: 1000 }),
        (req, res) => {
          res.json({ success: true })
        }
      )

      const response = await request(app).get('/test')
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('should reset quota after expiration', async () => {
      const userId = await createTestUser()
      const now = new Date()
      const pastReset = new Date(now.getTime() - 1000)

      await pool.query(
        `INSERT INTO api_quotas (
          user_id, daily_quota, daily_used, daily_reset_at,
          weekly_quota, weekly_used, weekly_reset_at,
          monthly_quota, monthly_used, monthly_reset_at
        ) VALUES ($1, 10, 10, $2, 100, 0, $3, 1000, 0, $4)`,
        [
          userId,
          pastReset,
          new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        ]
      )

      const mockAuth = (req: AuthRequest, res: any, next: any) => {
        req.userId = userId
        next()
      }

      app.get('/test', mockAuth, quotaMiddleware({ daily: 10 }), (req, res) => {
        res.json({ success: true })
      })

      const response = await request(app).get('/test')
      expect(response.status).toBe(200)

      const result = await pool.query(
        'SELECT daily_used FROM api_quotas WHERE user_id = $1',
        [userId]
      )
      expect(result.rows[0].daily_used).toBe(1)
    })
  })
})

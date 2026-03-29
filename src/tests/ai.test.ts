import { describe, it, expect, vi } from 'vitest'
import supertest from 'supertest'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

vi.mock('../middleware/auth.js', () => ({
  authenticateToken: (
    req: express.Request,
    _res: express.Response,
    next: express.NextFunction
  ) => {
    ;(
      req as express.Request & { userId?: string; workspaceId?: string }
    ).userId = 'test-user'
    ;(
      req as express.Request & { userId?: string; workspaceId?: string }
    ).workspaceId = 'test-workspace'
    next()
  },
}))

vi.mock('../services/ai/client.js', () => ({
  createAIClient: () => ({
    analyzeTask: vi.fn(async () => ({
      priority: 'high',
      suggestedTags: ['bug', 'production'],
      estimatedDuration: '1h',
    })),
    chat: vi.fn(async () => 'Mocked AI response'),
  }),
}))

import aiRouter from '../routes/ai.js'

const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use('/api/ai', aiRouter)

const request = supertest(app)

describe('AI Integration Tests', () => {
  describe('AI Task Analysis', () => {
    it('should analyze task and return priority suggestions', async () => {
      const response = await request.post('/api/ai/analyze-task').send({
        title: 'Fix critical production bug',
        description: 'Database connection failing in production',
      })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('priority')
      expect(response.body).toHaveProperty('suggestedTags')
      expect(['low', 'medium', 'high', 'critical']).toContain(
        response.body.priority
      )
    })

    it('should reject request without title', async () => {
      const response = await request.post('/api/ai/analyze-task').send({})

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Task title is required')
    })
  })

  describe('AI Chat', () => {
    it('should respond to chat messages', async () => {
      const response = await request.post('/api/ai/chat').send({
        message: 'Hello',
      })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('response')
      expect(typeof response.body.response).toBe('string')
    })

    it('should reject request without message', async () => {
      const response = await request.post('/api/ai/chat').send({})

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Message is required')
    })
  })
})

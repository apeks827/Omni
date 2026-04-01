import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import classifierRouter from '../../routes/classifier.js'
import authRouter from '../../routes/auth.js'

vi.mock('../../domains/tasks/services/TaskService.js', () => ({
  default: {
    getTask: vi.fn(),
  },
}))

vi.mock('../../middleware/auth.js', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.userId = 'test-user'
    req.workspaceId = 'test-workspace'
    next()
  },
  AuthRequest: {},
}))

describe('Classifier API', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use('/api/classifier', classifierRouter)
    vi.clearAllMocks()
  })

  describe('POST /api/classifier/classify', () => {
    it('should classify a task by title and description', async () => {
      const response = await request(app)
        .post('/api/classifier/classify')
        .send({
          title: 'Implement authentication feature',
          description: 'Build OAuth2 integration',
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.classification).toBeDefined()
      expect(response.body.classification.load).toBeDefined()
      expect(['deep_work', 'medium', 'light', 'admin']).toContain(
        response.body.classification.load
      )
      expect(response.body.classification.confidence).toBeDefined()
    })

    it('should classify a short admin task', async () => {
      const response = await request(app)
        .post('/api/classifier/classify')
        .send({
          title: 'Reply to email',
          description: 'Quick email response',
          estimatedDuration: 5,
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.classification.load).toBe('admin')
    })

    it('should return error when no taskId or title provided', async () => {
      const response = await request(app)
        .post('/api/classifier/classify')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('taskId or title is required')
    })
  })

  describe('POST /api/classifier/classify-bulk', () => {
    it('should classify multiple tasks in bulk', async () => {
      const response = await request(app)
        .post('/api/classifier/classify-bulk')
        .send({
          tasks: [
            { title: 'Build new feature', description: 'Implement API' },
            { title: 'Reply to email', description: 'Quick response' },
            { title: 'Code review', description: 'Review PR #123' },
          ],
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.total).toBe(3)
      expect(response.body.successful).toBe(3)
      expect(response.body.failed).toBe(0)
      expect(response.body.results).toHaveLength(3)
    })

    it('should return error for empty tasks array', async () => {
      const response = await request(app)
        .post('/api/classifier/classify-bulk')
        .send({ tasks: [] })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    it('should enforce 100 task limit', async () => {
      const tasks = Array.from({ length: 101 }, (_, i) => ({
        title: `Task ${i}`,
      }))

      const response = await request(app)
        .post('/api/classifier/classify-bulk')
        .send({ tasks })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('Maximum 100 tasks')
    })
  })

  describe('GET /api/classifier/keywords', () => {
    it('should return keywords for title matching deep work', async () => {
      const response = await request(app)
        .get('/api/classifier/keywords')
        .query({ title: 'Design architecture' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.keywords.type).toBe('deep_work')
      expect(response.body.keywords.matchedKeywords).toContain('design')
    })

    it('should return keywords for meeting task', async () => {
      const response = await request(app)
        .get('/api/classifier/keywords')
        .query({ title: 'Team meeting' })

      expect(response.status).toBe(200)
      expect(response.body.keywords.type).toBe('medium')
      expect(response.body.keywords.matchedKeywords).toContain('meeting')
    })
  })

  describe('GET /api/classifier/cognitive-load-levels', () => {
    it('should return all cognitive load levels', async () => {
      const response = await request(app).get(
        '/api/classifier/cognitive-load-levels'
      )

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.levels).toHaveLength(4)
      expect(response.body.levels.map((l: any) => l.value)).toEqual([
        'deep_work',
        'medium',
        'light',
        'admin',
      ])
    })
  })

  describe('POST /api/classifier/classify-keywords', () => {
    it('should classify by keywords and return matched keywords', async () => {
      const response = await request(app)
        .post('/api/classifier/classify-keywords')
        .send({ keywords: ['design', 'architecture', 'research'] })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.classification.load).toBe('deep_work')
      expect(response.body.classification.matchedKeywords).toContain('design')
      expect(response.body.classification.matchedKeywords).toContain(
        'architecture'
      )
      expect(response.body.classification.matchedKeywords).toContain('research')
      expect(response.body.classification.confidence).toBeGreaterThan(0.6)
    })

    it('should classify meeting keywords as medium', async () => {
      const response = await request(app)
        .post('/api/classifier/classify-keywords')
        .send({ keywords: ['review', 'meeting'] })

      expect(response.status).toBe(200)
      expect(response.body.classification.load).toBe('medium')
      expect(response.body.classification.loadLabel).toBe('Medium')
    })

    it('should classify admin keywords correctly', async () => {
      const response = await request(app)
        .post('/api/classifier/classify-keywords')
        .send({ keywords: ['email', 'schedule'] })

      expect(response.status).toBe(200)
      expect(response.body.classification.load).toBe('admin')
      expect(response.body.classification.loadLabel).toBe('Admin')
    })

    it('should return error for empty keywords array', async () => {
      const response = await request(app)
        .post('/api/classifier/classify-keywords')
        .send({ keywords: [] })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('required')
    })

    it('should return error when keywords not provided', async () => {
      const response = await request(app)
        .post('/api/classifier/classify-keywords')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    it('should enforce 50 keyword limit', async () => {
      const keywords = Array.from({ length: 51 }, (_, i) => `keyword${i}`)

      const response = await request(app)
        .post('/api/classifier/classify-keywords')
        .send({ keywords })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('Maximum 50')
    })

    it('should be case-insensitive', async () => {
      const response = await request(app)
        .post('/api/classifier/classify-keywords')
        .send({ keywords: ['DESIGN', 'MeEtInG'] })

      expect(response.status).toBe(200)
      expect(response.body.classification.load).toBe('deep_work')
      expect(response.body.classification.matchedKeywords).toContain('design')
    })

    it('should deduplicate matched keywords', async () => {
      const response = await request(app)
        .post('/api/classifier/classify-keywords')
        .send({ keywords: ['design', 'Design', 'DESIGN'] })

      expect(response.status).toBe(200)
      const uniqueMatches = [
        ...new Set(response.body.classification.matchedKeywords),
      ]
      expect(response.body.classification.matchedKeywords).toHaveLength(
        uniqueMatches.length
      )
    })
  })

  describe('GET /api/classifier/available-keywords', () => {
    it('should return all available keywords', async () => {
      const response = await request(app).get(
        '/api/classifier/available-keywords'
      )

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.keywords.deep_work).toBeDefined()
      expect(response.body.keywords.medium).toBeDefined()
      expect(response.body.keywords.light).toBeDefined()
      expect(response.body.keywords.admin).toBeDefined()
      expect(response.body.keywords.deep_work).toContain('design')
      expect(response.body.keywords.medium).toContain('meeting')
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import suggestionRouter from '../../services/suggestions/routes.js'

const mockGetRules = vi.fn()
const mockGetAllRules = vi.fn()
const mockUpsertRule = vi.fn()
const mockInitializeDefaultRules = vi.fn()
const mockRecordFeedback = vi.fn()
const mockGetFeedbackStats = vi.fn()

vi.mock('../../services/suggestions/suggestion.repository.js', () => ({
  default: {
    getRules: (...args: any[]) => mockGetRules(...args),
    getAllRules: (...args: any[]) => mockGetAllRules(...args),
    upsertRule: (...args: any[]) => mockUpsertRule(...args),
    initializeDefaultRules: (...args: any[]) =>
      mockInitializeDefaultRules(...args),
    recordFeedback: (...args: any[]) => mockRecordFeedback(...args),
    getFeedbackStats: (...args: any[]) => mockGetFeedbackStats(...args),
  },
}))

vi.mock('../../middleware/auth.js', () => ({
  authenticateToken: (req: any, _res: any, next: any) => {
    req.userId = 'test-user'
    req.workspaceId = 'test-workspace'
    next()
  },
  AuthRequest: {},
}))

vi.mock('../../config/database.js', () => ({
  query: vi.fn(),
  pool: { on: vi.fn() },
}))

const baseRule = {
  enabled: true,
  created_at: new Date(),
  updated_at: new Date(),
}

describe('SuggestionService', () => {
  let app: express.Application
  let suggestionService: any

  beforeEach(async () => {
    app = express()
    app.use(express.json())
    app.use('/api/tasks/suggestions', suggestionRouter)
    vi.clearAllMocks()
    const serviceModule =
      await import('../../services/suggestions/suggestion.service.js')
    suggestionService = serviceModule.default
    suggestionService.invalidateCache('test-workspace')
  })

  describe('POST /api/tasks/suggestions', () => {
    it('should return suggestions for "urgent task"', async () => {
      mockGetRules.mockResolvedValue([
        {
          id: 'rule-1',
          field: 'priority',
          pattern: '\\b(urgent|critical|asap|emergency)\\b',
          value: 'critical',
          confidence: 0.9,
          ...baseRule,
        },
      ])

      const response = await request(app)
        .post('/api/tasks/suggestions')
        .send({ input: 'urgent task to fix' })

      expect(response.status).toBe(200)
      expect(response.body.hasSuggestions).toBe(true)
      expect(response.body.suggestions.length).toBeGreaterThan(0)
      expect(response.body.suggestions[0].field).toBe('priority')
      expect(response.body.suggestions[0].value).toBe('critical')
    })

    it('should return suggestions for "tomorrow meeting"', async () => {
      mockGetRules.mockResolvedValue([
        {
          id: 'rule-2',
          field: 'due_date',
          pattern: '\\btomorrow\\b',
          value: 'tomorrow',
          confidence: 0.95,
          ...baseRule,
        },
      ])

      const response = await request(app)
        .post('/api/tasks/suggestions')
        .send({ input: 'schedule meeting tomorrow' })

      expect(response.status).toBe(200)
      expect(response.body.hasSuggestions).toBe(true)
      const hasDueDate = response.body.suggestions.some(
        (s: any) => s.field === 'due_date'
      )
      expect(hasDueDate).toBe(true)
    })

    it('should return multiple suggestions for "urgent task due tomorrow"', async () => {
      mockGetRules.mockResolvedValue([
        {
          id: 'rule-3',
          field: 'priority',
          pattern: '\\b(urgent|critical|asap|emergency)\\b',
          value: 'critical',
          confidence: 0.9,
          ...baseRule,
        },
        {
          id: 'rule-4',
          field: 'due_date',
          pattern: '\\btomorrow\\b',
          value: 'tomorrow',
          confidence: 0.95,
          ...baseRule,
        },
      ])

      const response = await request(app)
        .post('/api/tasks/suggestions')
        .send({ input: 'urgent task due tomorrow' })

      expect(response.status).toBe(200)
      expect(response.body.suggestions.length).toBe(2)
      const fields = response.body.suggestions.map((s: any) => s.field)
      expect(fields).toContain('priority')
      expect(fields).toContain('due_date')
    })

    it('should return empty suggestions for plain text with no matches', async () => {
      mockGetRules.mockResolvedValue([
        {
          id: 'r1',
          field: 'priority',
          pattern: '\\burgent\\b',
          value: 'critical',
          confidence: 0.9,
          ...baseRule,
        },
      ])

      const response = await request(app)
        .post('/api/tasks/suggestions')
        .send({ input: 'simple task with no keywords' })

      expect(response.status).toBe(200)
      expect(response.body.hasSuggestions).toBe(false)
      expect(response.body.suggestions).toHaveLength(0)
    })

    it('should return 400 for empty input', async () => {
      const response = await request(app)
        .post('/api/tasks/suggestions')
        .send({ input: '' })

      expect(response.status).toBe(400)
    })

    it('should include processing time in response', async () => {
      mockGetRules.mockResolvedValue([])

      const response = await request(app)
        .post('/api/tasks/suggestions')
        .send({ input: 'task with no matches' })

      expect(response.status).toBe(200)
      expect(typeof response.body.processingTimeMs).toBe('number')
    })

    it('should initialize default rules when no rules exist', async () => {
      mockGetRules.mockResolvedValue([])
      mockInitializeDefaultRules.mockResolvedValue(undefined)
      mockGetRules.mockResolvedValueOnce([]).mockResolvedValueOnce([
        {
          id: 'r1',
          field: 'priority',
          pattern: '\\burgent\\b',
          value: 'critical',
          confidence: 0.9,
          ...baseRule,
        },
      ])

      const response = await request(app)
        .post('/api/tasks/suggestions')
        .send({ input: 'urgent task' })

      expect(response.status).toBe(200)
    })

    it('should resolve relative dates to ISO format', async () => {
      mockGetRules.mockResolvedValue([
        {
          id: 'r-tomorrow',
          field: 'due_date',
          pattern: '\\btomorrow\\b',
          value: 'tomorrow',
          confidence: 0.95,
          ...baseRule,
        },
      ])

      const response = await request(app)
        .post('/api/tasks/suggestions')
        .send({ input: 'meeting tomorrow' })

      expect(response.status).toBe(200)
      const dueDateSuggestion = response.body.suggestions.find(
        (s: any) => s.field === 'due_date'
      )
      expect(dueDateSuggestion).toBeDefined()
      expect(new Date(dueDateSuggestion.value).toString()).not.toBe(
        'Invalid Date'
      )
    })
  })

  describe('GET /api/tasks/suggestions/rules', () => {
    it('should return all rules for workspace', async () => {
      const mockRules = [
        {
          id: 'r1',
          field: 'priority',
          pattern: '\\burgent\\b',
          value: 'critical',
          confidence: 0.9,
          enabled: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'r2',
          field: 'due_date',
          pattern: '\\btomorrow\\b',
          value: 'tomorrow',
          confidence: 0.95,
          enabled: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]
      mockGetAllRules.mockResolvedValue(mockRules)

      const response = await request(app).get('/api/tasks/suggestions/rules')

      expect(response.status).toBe(200)
      expect(response.body.rules).toHaveLength(2)
    })
  })

  describe('PUT /api/tasks/suggestions/rules', () => {
    it('should update rules', async () => {
      mockUpsertRule.mockResolvedValue({
        id: 'new-rule',
        field: 'priority',
        pattern: '\\bcritical\\b',
        value: 'critical',
        confidence: 0.85,
        enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
      })

      const response = await request(app)
        .put('/api/tasks/suggestions/rules')
        .send({
          rules: [
            {
              field: 'priority',
              pattern: '\\bcritical\\b',
              value: 'critical',
              confidence: 0.85,
            },
          ],
        })

      expect(response.status).toBe(200)
      expect(response.body.rules).toHaveLength(1)
      expect(response.body.count).toBe(1)
    })

    it('should return 400 for invalid rule data', async () => {
      const response = await request(app)
        .put('/api/tasks/suggestions/rules')
        .send({
          rules: [{ field: 'invalid_field', pattern: '', value: '' }],
        })

      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/tasks/suggestions/feedback', () => {
    it('should record accepted feedback', async () => {
      mockRecordFeedback.mockResolvedValue(undefined)

      const response = await request(app)
        .post('/api/tasks/suggestions/feedback')
        .send({
          input: 'urgent task',
          accepted: true,
          field: 'priority',
          suggested_value: 'critical',
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(mockRecordFeedback).toHaveBeenCalledWith(
        'test-workspace',
        'test-user',
        'urgent task',
        'priority',
        'critical',
        null,
        true
      )
    })

    it('should record rejected feedback with actual value', async () => {
      mockRecordFeedback.mockResolvedValue(undefined)

      const response = await request(app)
        .post('/api/tasks/suggestions/feedback')
        .send({
          input: 'task urgent',
          accepted: false,
          field: 'priority',
          suggested_value: 'critical',
          actual_value: 'high',
        })

      expect(response.status).toBe(200)
      expect(mockRecordFeedback).toHaveBeenCalledWith(
        'test-workspace',
        'test-user',
        'task urgent',
        'priority',
        'critical',
        'high',
        false
      )
    })
  })

  describe('GET /api/tasks/suggestions/stats', () => {
    it('should return feedback statistics', async () => {
      mockGetFeedbackStats.mockResolvedValue([
        {
          field: 'priority',
          accepted: 80,
          rejected: 20,
          total: 100,
          acceptance_rate: 0.8,
        },
      ])

      const response = await request(app).get('/api/tasks/suggestions/stats')

      expect(response.status).toBe(200)
      expect(response.body.stats).toHaveLength(1)
      expect(response.body.stats[0].acceptance_rate).toBe(0.8)
    })

    it('should filter stats by field', async () => {
      mockGetFeedbackStats.mockResolvedValue([
        {
          field: 'due_date',
          accepted: 50,
          rejected: 10,
          total: 60,
          acceptance_rate: 0.83,
        },
      ])

      const response = await request(app).get(
        '/api/tasks/suggestions/stats?field=due_date'
      )

      expect(response.status).toBe(200)
      expect(mockGetFeedbackStats).toHaveBeenCalledWith(
        'test-workspace',
        'due_date'
      )
    })
  })
})

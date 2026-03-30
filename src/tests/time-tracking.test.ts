import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express, { Request, Response, NextFunction } from 'express'

const mockQuery = vi.fn()

vi.mock('../config/database.js', () => ({
  pool: {
    query: (...args: any[]) => mockQuery(...args),
    on: vi.fn(),
  },
}))

vi.mock('../middleware/auth.js', () => ({
  authenticateToken: (req: Request, _res: Response, next: NextFunction) => {
    ;(req as any).userId = 'user-123'
    ;(req as any).workspaceId = 'workspace-123'
    next()
  },
}))

import timeEntriesRouter from '../domains/time-tracking/routes/time-entries.js'
import timerRouter from '../domains/time-tracking/routes/timer.js'
import analyticsRouter from '../domains/time-tracking/routes/analytics.js'

describe('Time Tracking API', () => {
  let app: express.Express

  const mockUser = {
    id: 'user-123',
    workspace_id: 'workspace-123',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    app = express()
    app.use(express.json())
    app.use('/api/time-entries', timeEntriesRouter)
    app.use('/api/timer', timerRouter)
    app.use('/api/analytics', analyticsRouter)
  })

  describe('POST /api/time-entries', () => {
    it('should create a time entry', async () => {
      const mockEntry = {
        id: 'entry-123',
        task_id: 'task-123',
        workspace_id: mockUser.workspace_id,
        user_id: mockUser.id,
        start_time: new Date(),
        duration_seconds: 3600,
        type: 'manual',
        source: 'api',
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockQuery.mockResolvedValueOnce({ rows: [mockEntry] })

      const response = await request(app).post('/api/time-entries').send({
        task_id: 'task-123',
        start_time: new Date().toISOString(),
        duration_seconds: 3600,
        type: 'manual',
      })

      expect(response.status).toBe(201)
      expect(response.body.id).toBe('entry-123')
      expect(response.body.task_id).toBe('task-123')
    })
  })

  describe('GET /api/time-entries', () => {
    it('should list time entries', async () => {
      const mockEntries = [
        {
          id: 'entry-1',
          task_id: 'task-1',
          duration_seconds: 1800,
          type: 'timer',
        },
      ]

      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: mockEntries })

      const response = await request(app)
        .get('/api/time-entries')
        .query({ limit: '20', offset: '0' })

      expect(response.status).toBe(200)
      expect(response.body.entries).toHaveLength(1)
      expect(response.body.total).toBe(1)
    })
  })

  describe('POST /api/timer/start', () => {
    it('should start a timer', async () => {
      const mockTimer = {
        id: 'timer-123',
        task_id: 'task-123',
        user_id: mockUser.id,
        workspace_id: mockUser.workspace_id,
        status: 'running',
        start_time: new Date(),
        elapsed_seconds: 0,
        pomodoro_type: 'work',
        pomodoro_work_count: 0,
      }

      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [mockTimer] })

      const response = await request(app)
        .post('/api/timer/start')
        .send({ task_id: 'task-123' })

      expect(response.status).toBe(200)
      expect(response.body.session_id).toBe('timer-123')
      expect(response.body.status).toBe('running')
    })
  })

  describe('POST /api/timer/stop', () => {
    it('should stop timer and create time entry', async () => {
      const mockTimer = {
        id: 'timer-123',
        task_id: 'task-123',
        user_id: mockUser.id,
        workspace_id: mockUser.workspace_id,
        status: 'running',
        start_time: new Date(Date.now() - 3600000),
        elapsed_seconds: 0,
        pomodoro_type: 'work',
        pomodoro_work_count: 0,
      }

      const mockTimeEntry = {
        id: 'entry-123',
        task_id: 'task-123',
      }

      mockQuery
        .mockResolvedValueOnce({ rows: [mockTimer] })
        .mockResolvedValueOnce({ rows: [mockTimeEntry] })
        .mockResolvedValueOnce({ rows: [] })

      const response = await request(app)
        .post('/api/timer/stop')
        .send({ description: 'Completed work' })

      expect(response.status).toBe(200)
      expect(response.body.time_entry_id).toBe('entry-123')
      expect(response.body.duration_seconds).toBeGreaterThan(0)
    })
  })

  describe('GET /api/analytics', () => {
    it('should return analytics data', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ total_seconds: '3600', total_entries: '2' }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              work_sessions: '2',
              break_sessions: '2',
              total_work_seconds: '3000',
            },
          ],
        })

      const startDate = new Date(Date.now() - 86400000)
      const endDate = new Date()

      const response = await request(app)
        .get('/api/analytics/analytics')
        .query({
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          group_by: 'task',
        })

      expect(response.status).toBe(200)
      expect(response.body.total_seconds).toBe(3600)
      expect(response.body.pomodoro_stats).toBeDefined()
      expect(response.body.pomodoro_stats.work_sessions).toBe(2)
    })
  })
})

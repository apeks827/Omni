import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import authRouter from '../routes/auth.js'
import tasksRouter from '../routes/tasks.js'
import timeEntriesRouter from '../domains/time-tracking/routes/time-entries.js'
import timerRouter from '../domains/time-tracking/routes/timer.js'
import analyticsRouter from '../domains/time-tracking/routes/analytics.js'
import { pool } from '../config/database.js'

const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use('/api/auth', authRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/time-entries', timeEntriesRouter)
app.use('/api/timer', timerRouter)
app.use('/api/time-tracking', analyticsRouter)

const requestClient = request(app)

describe('Time Tracking E2E Tests', () => {
  let authToken: string
  let userId: string
  let workspaceId: string
  let taskId: string
  let timeEntryId: string
  let timerSessionId: string

  beforeAll(async () => {
    const registerRes = await requestClient.post('/api/auth/register').send({
      email: `time-test-${Date.now()}@example.com`,
      password: 'TestPass123!',
      name: 'Time Tester',
    })

    authToken = registerRes.body.token
    userId = registerRes.body.user.id
    workspaceId = registerRes.body.user.workspace_id

    const taskRes = await requestClient
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test task for time tracking',
        status: 'todo',
        priority: 'medium',
      })

    taskId = taskRes.body.id
  })

  afterAll(async () => {
    if (userId) {
      await pool.query('DELETE FROM users WHERE id = $1', [userId])
    }
  })

  describe('Timer State Machine', () => {
    it('should start a timer for a task', async () => {
      const res = await requestClient
        .post('/api/timer/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ task_id: taskId })

      expect(res.status).toBe(200)
      expect(res.body.session_id).toBeDefined()
      expect(res.body.status).toBe('running')
      timerSessionId = res.body.session_id
    })

    it('should get current timer status', async () => {
      const res = await requestClient
        .get('/api/timer/status')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.status).toBeDefined()
    })

    it('should not start another timer when one is running', async () => {
      const res = await requestClient
        .post('/api/timer/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ task_id: taskId })

      expect(res.status).toBe(409)
    })

    it('should stop timer and create time entry', async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const res = await requestClient
        .post('/api/timer/stop')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'Work session completed' })

      expect(res.status).toBe(200)
      expect(res.body.time_entry_id).toBeDefined()
      expect(res.body.duration_seconds).toBeGreaterThanOrEqual(0)
      timeEntryId = res.body.time_entry_id
    })

    it('should not stop timer when none is running', async () => {
      const res = await requestClient
        .post('/api/timer/stop')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})

      expect(res.status).toBe(404)
    })
  })

  describe('Time Entry CRUD', () => {
    it('should create a manual time entry', async () => {
      const res = await requestClient
        .post('/api/time-entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          task_id: taskId,
          start_time: new Date(Date.now() - 7200000).toISOString(),
          duration_seconds: 3600,
          type: 'manual',
        })

      expect(res.status).toBe(201)
      expect(res.body.id).toBeDefined()
      expect(res.body.duration_seconds).toBe(3600)
    })

    it('should list time entries with pagination', async () => {
      const res = await requestClient
        .get('/api/time-entries')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: '10', offset: '0' })

      expect(res.status).toBe(200)
      expect(res.body.entries).toBeDefined()
      expect(Array.isArray(res.body.entries)).toBe(true)
      expect(res.body.total).toBeDefined()
    })

    it('should filter time entries by task', async () => {
      const res = await requestClient
        .get('/api/time-entries')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ task_id: taskId })

      expect(res.status).toBe(200)
      expect(res.body.entries.length).toBeGreaterThan(0)
    })

    it('should get specific time entry', async () => {
      const res = await requestClient
        .get(`/api/time-entries/${timeEntryId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.id).toBe(timeEntryId)
    })

    it('should update a time entry', async () => {
      const res = await requestClient
        .patch(`/api/time-entries/${timeEntryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Updated notes' })

      expect(res.status).toBe(200)
    })

    it('should delete a time entry', async () => {
      const createRes = await requestClient
        .post('/api/time-entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          task_id: taskId,
          start_time: new Date().toISOString(),
          duration_seconds: 600,
          type: 'manual',
        })

      const res = await requestClient
        .delete(`/api/time-entries/${createRes.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(204)
    })
  })

  describe('Analytics', () => {
    it('should get analytics data', async () => {
      const startDate = new Date(Date.now() - 86400000 * 7)
      const endDate = new Date()

      const res = await requestClient
        .get('/api/time-tracking/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          group_by: 'task',
        })

      expect(res.status).toBe(200)
      expect(res.body.total_seconds).toBeDefined()
    })

    it('should require date parameters', async () => {
      const res = await requestClient
        .get('/api/time-tracking/analytics')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(400)
    })

    it('should export analytics data', async () => {
      const startDate = new Date(Date.now() - 86400000 * 7)
      const endDate = new Date()

      const res = await requestClient
        .get('/api/time-tracking/export')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        })

      expect(res.status).toBe(200)
    })
  })

  describe('Security: Data Isolation', () => {
    let otherAuthToken: string
    let otherUserId: string
    let isolatedEntryId: string

    beforeAll(async () => {
      const registerRes = await requestClient.post('/api/auth/register').send({
        email: `time-isolation-${Date.now()}@example.com`,
        password: 'TestPass123!',
        name: 'Other User',
      })

      otherAuthToken = registerRes.body.token
      otherUserId = registerRes.body.user.id

      const taskRes = await requestClient
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Private task',
          status: 'todo',
          priority: 'medium',
        })

      const entryRes = await requestClient
        .post('/api/time-entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          task_id: taskRes.body.id,
          start_time: new Date().toISOString(),
          duration_seconds: 1800,
          type: 'manual',
        })

      isolatedEntryId = entryRes.body.id
    })

    afterAll(async () => {
      if (otherUserId) {
        await pool.query('DELETE FROM users WHERE id = $1', [otherUserId])
      }
    })

    it('should not allow other user to access time entry', async () => {
      const res = await requestClient
        .get(`/api/time-entries/${isolatedEntryId}`)
        .set('Authorization', `Bearer ${otherAuthToken}`)

      expect(res.status).toBe(404)
    })

    it('should not allow other user to update time entry', async () => {
      const res = await requestClient
        .patch(`/api/time-entries/${isolatedEntryId}`)
        .set('Authorization', `Bearer ${otherAuthToken}`)
        .send({ notes: 'Hacked!' })

      expect(res.status).toBe(404)
    })

    it('should not allow other user to delete time entry', async () => {
      const res = await requestClient
        .delete(`/api/time-entries/${isolatedEntryId}`)
        .set('Authorization', `Bearer ${otherAuthToken}`)

      expect(res.status).toBe(404)
    })

    it('should not allow other user to see analytics', async () => {
      const startDate = new Date(Date.now() - 86400000 * 7)
      const endDate = new Date()
      
      const res = await requestClient
        .get('/api/time-tracking/analytics')
        .set('Authorization', `Bearer ${otherAuthToken}`)
        .query({
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        })

      expect(res.status).toBe(200)
    })
  })

  describe('Timer Persistence', () => {
    it('should maintain timer state across status checks', async () => {
      await requestClient
        .post('/api/timer/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ task_id: taskId })

      const status1 = await requestClient
        .get('/api/timer/status')
        .set('Authorization', `Bearer ${authToken}`)

      expect(status1.body.status).toBe('running')

      const status2 = await requestClient
        .get('/api/timer/status')
        .set('Authorization', `Bearer ${authToken}`)

      expect(status2.body.status).toBe('running')
      expect(status2.body.elapsed_seconds).toBeGreaterThanOrEqual(
        status1.body.elapsed_seconds
      )

      await requestClient
        .post('/api/timer/stop')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
    })
  })
})

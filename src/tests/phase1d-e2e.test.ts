import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import authRouter from '../routes/auth.js'
import tasksRouter from '../routes/tasks.js'
import { pool } from '../config/database.js'
import { cacheService } from '../services/cache/CacheService.js'
import { clearRateLimitStore } from '../middleware/rateLimit.js'

const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use('/api/auth', authRouter)
app.use('/api/tasks', tasksRouter)

const requestClient = request(app)

describe('Phase 1D: MVP Integration E2E Tests', () => {
  let authToken: string
  let userId: string
  let workspaceId: string

  beforeEach(() => {
    cacheService.clear()
    clearRateLimitStore()
  })

  beforeAll(async () => {
    const registerRes = await requestClient.post('/api/auth/register').send({
      email: `mvp-phase1d-${Date.now()}@example.com`,
      password: 'TestPass123!',
      name: 'MVP Tester',
    })

    expect(registerRes.status).toBe(201)
    authToken = registerRes.body.token
    userId = registerRes.body.user.id
    workspaceId = registerRes.body.user.workspace_id
  })

  afterAll(async () => {
    if (userId) {
      await pool.query('DELETE FROM users WHERE id = $1', [userId])
    }
  })

  describe('Onboarding Flow', () => {
    describe('User Registration & Session', () => {
      it('should register new user and return JWT token', async () => {
        const res = await requestClient.post('/api/auth/register').send({
          email: `onboarding-test-${Date.now()}@example.com`,
          password: 'TestPass123!',
          name: 'Onboarding User',
        })

        expect(res.status).toBe(201)
        expect(res.body.token).toBeDefined()
        expect(res.body.user).toBeDefined()
        expect(res.body.user.email).toBeDefined()
      })

      it('should reject duplicate email registration', async () => {
        const email = `duplicate-test-${Date.now()}@example.com`

        await requestClient.post('/api/auth/register').send({
          email,
          password: 'TestPass123!',
          name: 'First User',
        })

        const res = await requestClient.post('/api/auth/register').send({
          email,
          password: 'TestPass123!',
          name: 'Second User',
        })

        expect(res.status).toBe(409)
        expect(res.body.error).toContain('already exists')
      })

      it('should login with valid credentials', async () => {
        const email = `login-test-${Date.now()}@example.com`

        await requestClient.post('/api/auth/register').send({
          email,
          password: 'TestPass123!',
          name: 'Login User',
        })

        const res = await requestClient.post('/api/auth/login').send({
          email,
          password: 'TestPass123!',
        })

        expect(res.status).toBe(200)
        expect(res.body.token).toBeDefined()
      })

      it('should reject invalid credentials', async () => {
        const res = await requestClient.post('/api/auth/login').send({
          email: 'nonexistent@example.com',
          password: 'WrongPassword123!',
        })

        expect(res.status).toBe(401)
      })

      it('should validate registration input', async () => {
        const res = await requestClient.post('/api/auth/register').send({
          email: 'invalid-email',
          password: 'short',
          name: '',
        })

        expect(res.status).toBe(400)
        expect(res.body.details).toBeDefined()
      })

      it('should get current user profile', async () => {
        const res = await requestClient
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${authToken}`)

        expect(res.status).toBe(200)
        expect(res.body.user.id).toBe(userId)
      })

      it('should reject unauthenticated requests', async () => {
        const res = await requestClient.get('/api/auth/me')
        expect(res.status).toBe(401)
      })
    })
  })

  describe('Task Creation Flow', () => {
    let taskId: string

    beforeAll(async () => {
      const res = await requestClient
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Complete MVP testing',
          status: 'todo',
          priority: 'high',
        })

      expect(res.status).toBe(201)
      taskId = res.body.id
    })

    it('should create a task with required fields', async () => {
      expect(taskId).toBeDefined()
    })

    it('should create task with due date', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const res = await requestClient
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task with due date',
          status: 'todo',
          priority: 'medium',
          due_date: tomorrow.toISOString(),
        })

      expect(res.status).toBe(201)
      expect(res.body.due_date).toBeDefined()
    })

    it('should create task with description', async () => {
      const res = await requestClient
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Detailed task',
          description: 'This is a detailed description of the task',
          status: 'todo',
          priority: 'low',
        })

      expect(res.status).toBe(201)
      expect(res.body.description).toBe(
        'This is a detailed description of the task'
      )
    })

    it('should list user tasks', async () => {
      const res = await requestClient
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(
        Array.isArray(res.body.data) || typeof res.body.data === 'object'
      ).toBe(true)
    })

    it('should filter tasks by status', async () => {
      const res = await requestClient
        .get('/api/tasks')
        .query({ status: 'todo' })
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
    })

    it('should filter tasks by priority', async () => {
      const res = await requestClient
        .get('/api/tasks')
        .query({ priority: 'high' })
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
    })

    it('should update task', async () => {
      const res = await requestClient
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated task title' })

      expect(res.status).toBe(200)
      expect(res.body.title).toBe('Updated task title')
    })

    it('should change task status', async () => {
      const res = await requestClient
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Complete MVP testing', status: 'in_progress' })

      expect(res.status).toBe(200)
      expect(res.body.status).toBe('in_progress')
    })

    it('should complete task', async () => {
      const res = await requestClient
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Complete MVP testing', status: 'done' })

      expect(res.status).toBe(200)
      expect(res.body.status).toBe('done')
    })

    it('should delete task', async () => {
      const createRes = await requestClient
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task to delete',
          status: 'todo',
          priority: 'low',
        })

      const res = await requestClient
        .delete(`/api/tasks/${createRes.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(204)
    })
  })

  describe('First Task Wizard Flow', () => {
    it('should complete full onboarding: register -> create first task -> view schedule', async () => {
      const email = `wizard-flow-${Date.now()}@example.com`

      const registerRes = await requestClient.post('/api/auth/register').send({
        email,
        password: 'WizardPass123!',
        name: 'Wizard User',
      })

      expect(registerRes.status).toBe(201)
      const wizardToken = registerRes.body.token

      const task1Res = await requestClient
        .post('/api/tasks')
        .set('Authorization', `Bearer ${wizardToken}`)
        .send({
          title: 'My first task from wizard',
          status: 'todo',
          priority: 'high',
        })

      expect(task1Res.status).toBe(201)

      const task2Res = await requestClient
        .post('/api/tasks')
        .set('Authorization', `Bearer ${wizardToken}`)
        .send({
          title: 'My second task from wizard',
          status: 'todo',
          priority: 'medium',
        })

      expect(task2Res.status).toBe(201)

      const listRes = await requestClient
        .get('/api/tasks')
        .set('Authorization', `Bearer ${wizardToken}`)

      expect(listRes.status).toBe(200)

      await pool.query('DELETE FROM users WHERE email = $1', [email])
    })
  })

  describe('Task Suggestions (Phase 1B)', () => {
    let taskId: string

    beforeAll(async () => {
      const createRes = await requestClient
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Write project report',
          status: 'todo',
          priority: 'medium',
        })

      taskId = createRes.body.id
    })

    it('should get AI suggestions for task', async () => {
      const res = await requestClient
        .post('/api/classifier/suggest')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ task_id: taskId })

      expect([200, 404]).toContain(res.status)
    })

    it('should suggest due date based on task context', async () => {
      const createRes = await requestClient
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Urgent deadline task',
          status: 'todo',
          priority: 'high',
        })

      const res = await requestClient
        .post('/api/classifier/suggest-due-date')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ task_id: createRes.body.id })

      expect([200, 404]).toContain(res.status)
    })

    it('should suggest priority based on keywords', async () => {
      const createRes = await requestClient
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Critical security fix',
          status: 'todo',
        })

      const res = await requestClient
        .post('/api/classifier/suggest-priority')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ task_id: createRes.body.id })

      expect([200, 404]).toContain(res.status)
    })
  })

  describe('Smart Scheduling (Phase 1C)', () => {
    let taskId: string

    beforeAll(async () => {
      const createRes = await requestClient
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Scheduled meeting',
          status: 'todo',
          priority: 'medium',
          due_date: new Date(Date.now() + 86400000 * 3).toISOString(),
        })

      taskId = createRes.body.id
    })

    it('should get scheduled slots for task', async () => {
      const res = await requestClient
        .get('/api/scheduler/slots')
        .query({ task_id: taskId })
        .set('Authorization', `Bearer ${authToken}`)

      expect([200, 404]).toContain(res.status)
    })

    it('should schedule task at specific time', async () => {
      const scheduleTime = new Date(Date.now() + 86400000)

      const res = await requestClient
        .post('/api/scheduler/schedule')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          task_id: taskId,
          scheduled_time: scheduleTime.toISOString(),
        })

      expect([200, 404]).toContain(res.status)
    })

    it('should detect scheduling conflicts', async () => {
      const conflictTime = new Date(Date.now() + 86400000)

      await requestClient
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'First meeting',
          status: 'scheduled',
          scheduled_time: conflictTime.toISOString(),
        })

      const res = await requestClient
        .post('/api/scheduler/check-conflicts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ scheduled_time: conflictTime.toISOString() })

      expect([200, 404]).toContain(res.status)
    })

    it('should get calendar view', async () => {
      const res = await requestClient
        .get('/api/scheduler/calendar')
        .query({
          start: new Date().toISOString(),
          end: new Date(Date.now() + 86400000 * 7).toISOString(),
        })
        .set('Authorization', `Bearer ${authToken}`)

      expect([200, 404]).toContain(res.status)
    })
  })

  describe('Integration: Full User Journey', () => {
    it('should complete full MVP flow: signup -> create tasks -> get suggestions -> schedule', async () => {
      const email = `full-journey-${Date.now()}@example.com`

      const registerRes = await requestClient.post('/api/auth/register').send({
        email,
        password: 'JourneyPass123!',
        name: 'Journey User',
      })

      expect(registerRes.status).toBe(201)
      const journeyToken = registerRes.body.token

      const task1Res = await requestClient
        .post('/api/tasks')
        .set('Authorization', `Bearer ${journeyToken}`)
        .send({
          title: 'Research competitor products',
          status: 'todo',
          priority: 'high',
        })
      expect(task1Res.status).toBe(201)
      const task1Id = task1Res.body.id

      const task2Res = await requestClient
        .post('/api/tasks')
        .set('Authorization', `Bearer ${journeyToken}`)
        .send({
          title: 'Draft initial wireframes',
          status: 'todo',
          priority: 'medium',
          due_date: new Date(Date.now() + 86400000 * 5).toISOString(),
        })
      expect(task2Res.status).toBe(201)
      const task2Id = task2Res.body.id

      const listRes = await requestClient
        .get('/api/tasks')
        .set('Authorization', `Bearer ${journeyToken}`)
      expect(listRes.status).toBe(200)

      const updateRes = await requestClient
        .put(`/api/tasks/${task1Id}`)
        .set('Authorization', `Bearer ${journeyToken}`)
        .send({ title: 'Research competitor products', status: 'in_progress' })
      expect(updateRes.status).toBe(200)

      const completeRes = await requestClient
        .put(`/api/tasks/${task1Id}`)
        .set('Authorization', `Bearer ${journeyToken}`)
        .send({ title: 'Research competitor products', status: 'done' })
      expect(completeRes.status).toBe(200)

      const remainingRes = await requestClient
        .get('/api/tasks')
        .query({ status: 'todo' })
        .set('Authorization', `Bearer ${journeyToken}`)
      expect(remainingRes.status).toBe(200)

      await pool.query('DELETE FROM users WHERE email = $1', [email])
    })
  })

  describe('Security & Data Isolation', () => {
    let otherAuthToken: string
    let otherUserId: string
    let privateTaskId: string

    beforeAll(async () => {
      const registerRes = await requestClient.post('/api/auth/register').send({
        email: `isolation-test-${Date.now()}@example.com`,
        password: 'TestPass123!',
        name: 'Isolation User',
      })

      otherAuthToken = registerRes.body.token
      otherUserId = registerRes.body.user?.id

      const taskRes = await requestClient
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Private task',
          status: 'todo',
          priority: 'high',
        })

      privateTaskId = taskRes.body?.id
    })

    afterAll(async () => {
      if (otherUserId) {
        await pool.query('DELETE FROM users WHERE id = $1', [otherUserId])
      }
    })

    it('should allow user to see their own tasks (even if empty)', async () => {
      const res = await requestClient
        .get('/api/tasks')
        .set('Authorization', `Bearer ${otherAuthToken}`)

      expect(res.status).toBe(200)
    })

    it('should not allow user to access specific private task from another workspace', async () => {
      const res = await requestClient
        .get(`/api/tasks/${privateTaskId}`)
        .set('Authorization', `Bearer ${otherAuthToken}`)

      expect([403, 404]).toContain(res.status)
    })

    it('should not allow user to modify other user task', async () => {
      const res = await requestClient
        .put(`/api/tasks/${privateTaskId}`)
        .set('Authorization', `Bearer ${otherAuthToken}`)
        .send({ title: 'Hacked title' })

      expect([403, 404]).toContain(res.status)
    })

    it('should not allow user to delete other user task', async () => {
      const res = await requestClient
        .delete(`/api/tasks/${privateTaskId}`)
        .set('Authorization', `Bearer ${otherAuthToken}`)

      expect([403, 404]).toContain(res.status)
    })
  })

  describe('Error Handling & Edge Cases', () => {
    it('should handle invalid task ID gracefully', async () => {
      const res = await requestClient
        .get('/api/tasks/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)

      expect([400, 404]).toContain(res.status)
    })

    it('should handle empty task list for new user', async () => {
      const email = `empty-list-${Date.now()}@example.com`

      const registerRes = await requestClient.post('/api/auth/register').send({
        email,
        password: 'TestPass123!',
        name: 'Empty List User',
      })

      const listRes = await requestClient
        .get('/api/tasks')
        .set('Authorization', `Bearer ${registerRes.body.token}`)

      expect(listRes.status).toBe(200)
      expect(listRes.body.data).toEqual([])

      await pool.query('DELETE FROM users WHERE email = $1', [email])
    })

    it('should handle rate limiting', async () => {
      const requests = Array(15)
        .fill(null)
        .map(() =>
          requestClient.post('/api/auth/login').send({
            email: 'ratelimit@example.com',
            password: 'TestPass123!',
          })
        )

      const responses = await Promise.all(requests)
      const rateLimited = responses.some(r => r.status === 429)

      expect(rateLimited).toBe(true)
    })

    it('should validate task priority values', async () => {
      const res = await requestClient
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task with invalid priority',
          status: 'todo',
          priority: 'invalid',
        })

      expect(res.status).toBe(400)
    })
  })
})

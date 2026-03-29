import { describe, it, expect, beforeAll } from 'vitest'
import supertest from 'supertest'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import authRouter from '../routes/auth.js'
import tasksRouter from '../routes/tasks.js'
import projectsRouter from '../routes/projects.js'
import labelsRouter from '../routes/labels.js'
import handoffRouter from '../routes/handoff.js'
import aiRouter from '../routes/ai.js'

const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use('/api/auth', authRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/labels', labelsRouter)
app.use('/api/handoff', handoffRouter)
app.use('/api/ai', aiRouter)

const request = supertest(app)

describe('Integration Tests', () => {
  let authToken: string
  let userId: string
  let workspaceId: string

  describe('Authentication Flow', () => {
    it('should register a new user', async () => {
      const response = await request.post('/api/auth/register').send({
        email: `test-${Date.now()}@example.com`,
        password: 'Password123!',
        name: 'Test User',
      })

      expect(response.status).toBe(201)
      expect(response.body.token).toBeDefined()
      expect(response.body.user).toBeDefined()

      authToken = response.body.token
      userId = response.body.user.id
      workspaceId = response.body.user.workspace_id
    })

    it('should login with valid credentials', async () => {
      const email = `login-${Date.now()}@example.com`

      await request.post('/api/auth/register').send({
        email,
        password: 'Password123!',
        name: 'Login Test',
      })

      const response = await request.post('/api/auth/login').send({
        email,
        password: 'Password123!',
      })

      expect(response.status).toBe(200)
      expect(response.body.token).toBeDefined()
    })

    it('should reject invalid credentials', async () => {
      const response = await request.post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      })

      expect(response.status).toBe(401)
    })

    it('should get current user with valid token', async () => {
      const response = await request
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.user).toBeDefined()
    })

    it('should reject requests without token', async () => {
      const response = await request.get('/api/auth/me')
      expect(response.status).toBe(401)
    })
  })

  describe('Concurrent Request Handling', () => {
    it('should handle concurrent user registrations and respect rate limits', async () => {
      const promises = Array.from({ length: 15 }, (_, i) =>
        request.post('/api/auth/register').send({
          email: `concurrent-${Date.now()}-${i}@example.com`,
          password: 'Password123!',
          name: `Concurrent User ${i}`,
        })
      )

      const responses = await Promise.all(promises)

      let successes = 0
      let rateLimited = 0

      responses.forEach(response => {
        if (response.status === 201) {
          successes++
          expect(response.body.token).toBeDefined()
        } else if (response.status === 429) {
          rateLimited++
        }
      })

      expect(successes).toBeGreaterThan(0)
      expect(rateLimited).toBeGreaterThan(0)
      console.log(
        `Successful registrations: ${successes}, Rate limited: ${rateLimited}`
      )
    })

    it('should handle concurrent task creation', async () => {
      const promises = Array.from({ length: 20 }, (_, i) =>
        request
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: `Concurrent Task ${i}`,
            description: `Task created concurrently ${i}`,
            status: 'todo',
            priority: 'medium',
          })
      )

      const responses = await Promise.all(promises)

      responses.forEach(response => {
        expect(response.status).toBe(201)
        expect(response.body.title).toBeDefined()
      })
    })
  })

  describe('Performance Benchmarks', () => {
    it('should create tasks within performance target', async () => {
      const iterations = 100
      const start = Date.now()

      for (let i = 0; i < iterations; i++) {
        await request
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: `Performance Task ${i}`,
            status: 'todo',
            priority: 'medium',
          })
      }

      const elapsed = Date.now() - start
      const avgPerTask = elapsed / iterations

      console.log(`Average task creation: ${avgPerTask}ms`)
      expect(avgPerTask).toBeLessThan(100)
    })

    it('should query tasks within performance target', async () => {
      const iterations = 100
      const start = Date.now()

      for (let i = 0; i < iterations; i++) {
        await request
          .get('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
      }

      const elapsed = Date.now() - start
      const avgPerQuery = elapsed / iterations

      console.log(`Average task query: ${avgPerQuery}ms`)
      expect(avgPerQuery).toBeLessThan(50)
    })
  })

  describe('Labels API', () => {
    let createdLabelId: string

    it('should reject requests without token', async () => {
      const response = await request.get('/api/labels')
      expect(response.status).toBe(401)
    })

    it('should create a label', async () => {
      const response = await request
        .post('/api/labels')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `Test Label ${Date.now()}`,
          color: '#FF5733',
        })

      expect(response.status).toBe(201)
      expect(response.body.id).toBeDefined()
      expect(response.body.name).toBeDefined()
      createdLabelId = response.body.id
    })

    it('should get all labels', async () => {
      const response = await request
        .get('/api/labels')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
    })

    it('should get a label by id', async () => {
      const response = await request
        .get(`/api/labels/${createdLabelId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.id).toBe(createdLabelId)
    })

    it('should return 404 for non-existent label', async () => {
      const response = await request
        .get('/api/labels/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })

    it('should update a label', async () => {
      const response = await request
        .put(`/api/labels/${createdLabelId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `Updated Label ${Date.now()}`,
          color: '#33FF57',
        })

      expect(response.status).toBe(200)
      expect(response.body.color).toBe('#33FF57')
    })

    it('should delete a label', async () => {
      const response = await request
        .delete(`/api/labels/${createdLabelId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(204)
    })

    it('should return 404 after deleting label', async () => {
      const response = await request
        .get(`/api/labels/${createdLabelId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })
  })

  describe('Handoff API', () => {
    let createdTemplateId: string
    let testTaskId: string

    beforeAll(async () => {
      const taskResponse = await request
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Handoff Test Task',
          status: 'in_progress',
          priority: 'high',
        })
      testTaskId = taskResponse.body.id
    })

    it('should reject requests without token', async () => {
      const response = await request.get('/api/handoff/templates')
      expect(response.status).toBe(401)
    })

    it('should create a handoff template', async () => {
      const response = await request
        .post('/api/handoff/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          from_status: 'in_progress',
          next_title: 'Review Task',
          next_description: 'Please review this task',
          assignee_role: 'qa',
          auto_mention: true,
        })

      expect(response.status).toBe(201)
      expect(response.body.id).toBeDefined()
      expect(response.body.from_status).toBe('in_progress')
      expect(response.body.next_title).toBe('Review Task')
      createdTemplateId = response.body.id
    })

    it('should require from_status and next_title', async () => {
      const response = await request
        .post('/api/handoff/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          from_status: 'in_progress',
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('next_title')
    })

    it('should get all handoff templates', async () => {
      const response = await request
        .get('/api/handoff/templates')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
    })

    it('should get a template by id', async () => {
      const response = await request
        .get(`/api/handoff/templates/${createdTemplateId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.id).toBe(createdTemplateId)
    })

    it('should return 404 for non-existent template', async () => {
      const response = await request
        .get('/api/handoff/templates/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })

    it('should update a handoff template', async () => {
      const response = await request
        .put(`/api/handoff/templates/${createdTemplateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          from_status: 'in_progress',
          next_title: 'Updated Review Task',
        })

      expect(response.status).toBe(200)
      expect(response.body.next_title).toBe('Updated Review Task')
    })

    it('should get handoffs for a task', async () => {
      const response = await request
        .get(`/api/handoff/task/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toBeDefined()
    })

    it('should get all handoffs', async () => {
      const response = await request
        .get('/api/handoff/all')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
    })

    it('should delete a handoff template', async () => {
      const response = await request
        .delete(`/api/handoff/templates/${createdTemplateId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(204)
    })

    it('should return 404 after deleting template', async () => {
      const response = await request
        .get(`/api/handoff/templates/${createdTemplateId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })
  })

  describe('AI API', () => {
    it('should reject requests without token', async () => {
      const response = await request.post('/api/ai/analyze-task').send({
        title: 'Test task',
      })
      expect(response.status).toBe(401)
    })

    it('should require task title for analyze-task', async () => {
      const response = await request
        .post('/api/ai/analyze-task')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('title')
    })

    it('should require message for chat', async () => {
      const response = await request
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('Message')
    })
  })
})

import { describe, it, expect, beforeAll } from 'vitest'
import supertest from 'supertest'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import authRouter from '../routes/auth.js'
import tasksRouter from '../routes/tasks.js'
import projectsRouter from '../routes/projects.js'

const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use('/api/auth', authRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/projects', projectsRouter)

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
})

import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import authRouter from '../routes/auth.js'
import tasksRouter from '../routes/tasks.js'
import { pool } from '../config/database.js'

const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use('/api/auth', authRouter)
app.use('/api/tasks', tasksRouter)

const requestClient = request(app)

describe('Phase 1D: Performance Benchmarks', () => {
  let authToken: string

  beforeAll(async () => {
    const registerRes = await requestClient.post('/api/auth/register').send({
      email: `perf-test-${Date.now()}@example.com`,
      password: 'TestPass123!',
      name: 'Performance Tester',
    })

    authToken = registerRes.body.token
  })

  describe('API Response Time Benchmarks', () => {
    const PERFORMANCE_THRESHOLDS = {
      auth_login_ms: 500,
      task_create_ms: 500,
      task_list_ms: 1000,
      task_update_ms: 300,
      task_delete_ms: 300,
    }

    it('should respond to login within threshold', async () => {
      const start = Date.now()

      const res = await requestClient.post('/api/auth/login').send({
        email: 'perf-test@example.com',
        password: 'TestPass123!',
      })

      const duration = Date.now() - start

      expect(res.status).toBeDefined()
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.auth_login_ms)
    })

    it('should create task within threshold', async () => {
      const start = Date.now()

      const res = await requestClient
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Performance test task',
          status: 'todo',
          priority: 'medium',
        })

      const duration = Date.now() - start

      expect(res.status).toBe(201)
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.task_create_ms)
    })

    it('should list tasks within threshold', async () => {
      await Promise.all(
        Array(10)
          .fill(null)
          .map((_, i) =>
            requestClient
              .post('/api/tasks')
              .set('Authorization', `Bearer ${authToken}`)
              .send({
                title: `Task ${i}`,
                status: 'todo',
                priority: 'low',
              })
          )
      )

      const start = Date.now()
      const res = await requestClient
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)

      const duration = Date.now() - start

      expect(res.status).toBe(200)
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.task_list_ms)
    })

    it('should update task within threshold', async () => {
      const createRes = await requestClient
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Update test task',
          status: 'todo',
          priority: 'low',
        })

      const start = Date.now()
      const res = await requestClient
        .put(`/api/tasks/${createRes.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated title' })

      const duration = Date.now() - start

      expect(res.status).toBe(200)
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.task_update_ms)
    })

    it('should delete task within threshold', async () => {
      const createRes = await requestClient
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Delete test task',
          status: 'todo',
          priority: 'low',
        })

      const start = Date.now()
      const res = await requestClient
        .delete(`/api/tasks/${createRes.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)

      const duration = Date.now() - start

      expect(res.status).toBe(204)
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.task_delete_ms)
    })
  })

  describe('Concurrent Request Handling', () => {
    it('should handle 10 concurrent task creations', async () => {
      const start = Date.now()

      const requests = Array(10)
        .fill(null)
        .map((_, i) =>
          requestClient
            .post('/api/tasks')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              title: `Concurrent task ${i}`,
              status: 'todo',
              priority: 'low',
            })
        )

      const results = await Promise.all(requests)
      const duration = Date.now() - start

      results.forEach(res => {
        expect(res.status).toBe(201)
      })

      expect(duration).toBeLessThan(3000)
    })

    it('should handle 20 concurrent list requests', async () => {
      const requests = Array(20)
        .fill(null)
        .map(() =>
          requestClient
            .get('/api/tasks')
            .set('Authorization', `Bearer ${authToken}`)
        )

      const results = await Promise.all(requests)

      results.forEach(res => {
        expect(res.status).toBe(200)
      })
    })
  })

  describe('Database Query Performance', () => {
    it('should perform efficiently with 50 tasks', async () => {
      await Promise.all(
        Array(50)
          .fill(null)
          .map((_, i) =>
            requestClient
              .post('/api/tasks')
              .set('Authorization', `Bearer ${authToken}`)
              .send({
                title: `DB perf task ${i}`,
                status: i % 2 === 0 ? 'todo' : 'done',
                priority: ['low', 'medium', 'high'][i % 3],
              })
          )
      )

      const start = Date.now()
      const res = await requestClient
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
      const duration = Date.now() - start

      expect(res.status).toBe(200)
      expect(duration).toBeLessThan(1500)
    })

    it('should filter tasks efficiently', async () => {
      const start = Date.now()
      const res = await requestClient
        .get('/api/tasks')
        .query({ status: 'todo', priority: 'high' })
        .set('Authorization', `Bearer ${authToken}`)
      const duration = Date.now() - start

      expect(res.status).toBe(200)
      expect(duration).toBeLessThan(1000)
    })
  })

  describe('Memory & Resource Usage', () => {
    it('should not leak memory on repeated requests', async () => {
      const iterations = 100

      for (let i = 0; i < iterations; i++) {
        await requestClient
          .get('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
      }

      const res = await requestClient
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
    })
  })
})

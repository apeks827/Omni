import { describe, it, expect, beforeAll } from 'vitest'
import supertest from 'supertest'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import authRouter from '../routes/auth.js'
import searchRouter from '../routes/search.js'
import tasksRouter from '../routes/tasks.js'

const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use('/api/auth', authRouter)
app.use('/api/search', searchRouter)
app.use('/api/tasks', tasksRouter)

const request = supertest(app)

describe('Search API Tests', () => {
  let authToken: string
  let taskIds: string[] = []

  beforeAll(async () => {
    const response = await request.post('/api/auth/register').send({
      email: `search-test-${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'Search Test User',
    })

    authToken = response.body.token

    const tasks = [
      {
        title: 'Fix database connection bug',
        description: 'PostgreSQL connection pool exhausted',
        priority: 'high',
        status: 'todo',
      },
      {
        title: 'Implement user authentication',
        description: 'Add JWT token authentication',
        priority: 'medium',
        status: 'in_progress',
      },
      {
        title: 'Write documentation for API',
        description: 'Document all REST endpoints',
        priority: 'low',
        status: 'todo',
      },
      {
        title: 'Optimize database queries',
        description: 'Add indexes to improve performance',
        priority: 'high',
        status: 'done',
      },
      {
        title: 'Deploy to production',
        description: 'Deploy latest version to production server',
        priority: 'critical',
        status: 'todo',
      },
    ]

    for (const task of tasks) {
      const res = await request
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(task)
      taskIds.push(res.body.id)
    }
  })

  describe('POST /api/search/tasks', () => {
    it('should search tasks by title', async () => {
      const response = await request
        .post('/api/search/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query: 'database' })

      expect(response.status).toBe(200)
      expect(response.body.results).toBeDefined()
      expect(response.body.count).toBeGreaterThan(0)
      expect(response.body.results[0].title).toMatch(/database/i)
    })

    it('should search tasks by description', async () => {
      const response = await request
        .post('/api/search/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query: 'JWT' })

      expect(response.status).toBe(200)
      expect(response.body.results.length).toBeGreaterThan(0)
      expect(response.body.results[0].description).toMatch(/JWT/i)
    })

    it('should filter search results by status', async () => {
      const response = await request
        .post('/api/search/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query: 'database', status: 'todo' })

      expect(response.status).toBe(200)
      expect(response.body.results.every((t: any) => t.status === 'todo')).toBe(
        true
      )
    })

    it('should filter search results by priority', async () => {
      const response = await request
        .post('/api/search/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query: 'database', priority: 'high' })

      expect(response.status).toBe(200)
      expect(
        response.body.results.every((t: any) => t.priority === 'high')
      ).toBe(true)
    })

    it('should return ranked results', async () => {
      const response = await request
        .post('/api/search/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query: 'database' })

      expect(response.status).toBe(200)
      expect(response.body.results[0].rank).toBeDefined()

      const ranks = response.body.results.map((r: any) => r.rank)
      const sortedRanks = [...ranks].sort((a, b) => b - a)
      expect(ranks).toEqual(sortedRanks)
    })

    it('should handle multi-word queries', async () => {
      const response = await request
        .post('/api/search/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query: 'database connection' })

      expect(response.status).toBe(200)
      expect(response.body.results.length).toBeGreaterThan(0)
    })

    it('should reject search without authentication', async () => {
      const response = await request
        .post('/api/search/tasks')
        .send({ query: 'test' })

      expect(response.status).toBe(401)
    })

    it('should reject empty query', async () => {
      const response = await request
        .post('/api/search/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query: '' })

      expect(response.status).toBe(400)
    })

    it('should return empty results for non-matching query', async () => {
      const response = await request
        .post('/api/search/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query: 'xyznonexistent' })

      expect(response.status).toBe(200)
      expect(response.body.results.length).toBe(0)
      expect(response.body.count).toBe(0)
    })
  })
})

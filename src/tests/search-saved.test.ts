import { describe, it, expect, beforeAll } from 'vitest'
import supertest from 'supertest'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import authRouter from '../routes/auth.js'
import searchRouter from '../routes/search.js'

const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use('/api/auth', authRouter)
app.use('/api/search', searchRouter)

const request = supertest(app)

describe('Saved Searches and History API Tests', () => {
  let authToken: string
  let savedSearchId: string

  beforeAll(async () => {
    const response = await request.post('/api/auth/register').send({
      email: `saved-search-test-${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'Saved Search Test User',
    })

    authToken = response.body.token
  })

  describe('POST /api/search/saved', () => {
    it('should create a saved search', async () => {
      const response = await request
        .post('/api/search/saved')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'High Priority Tasks',
          query: 'urgent',
          filters: { priority: 'high', status: 'todo' },
        })

      expect(response.status).toBe(201)
      expect(response.body.id).toBeDefined()
      expect(response.body.name).toBe('High Priority Tasks')
      expect(response.body.query).toBe('urgent')
      expect(response.body.filters.priority).toBe('high')
      savedSearchId = response.body.id
    })

    it('should reject saved search without authentication', async () => {
      const response = await request.post('/api/search/saved').send({
        name: 'Test',
        query: 'test',
      })

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/search/saved', () => {
    it('should get all saved searches', async () => {
      const response = await request
        .get('/api/search/saved')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
    })
  })

  describe('GET /api/search/saved/:id', () => {
    it('should get a specific saved search', async () => {
      const response = await request
        .get(`/api/search/saved/${savedSearchId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.id).toBe(savedSearchId)
      expect(response.body.name).toBe('High Priority Tasks')
    })

    it('should return 404 for non-existent saved search', async () => {
      const response = await request
        .get('/api/search/saved/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })
  })

  describe('PATCH /api/search/saved/:id', () => {
    it('should update a saved search', async () => {
      const response = await request
        .patch(`/api/search/saved/${savedSearchId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Critical Priority Tasks',
          filters: { priority: 'critical' },
        })

      expect(response.status).toBe(200)
      expect(response.body.name).toBe('Critical Priority Tasks')
      expect(response.body.filters.priority).toBe('critical')
    })
  })

  describe('DELETE /api/search/saved/:id', () => {
    it('should delete a saved search', async () => {
      const response = await request
        .delete(`/api/search/saved/${savedSearchId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(204)
    })

    it('should return 404 when deleting non-existent saved search', async () => {
      const response = await request
        .delete(`/api/search/saved/${savedSearchId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/search/history', () => {
    it('should get search history', async () => {
      await request
        .post('/api/search/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query: 'test query 1' })

      await request
        .post('/api/search/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query: 'test query 2' })

      const response = await request
        .get('/api/search/history')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
      expect(response.body[0].query).toBeDefined()
      expect(response.body[0].result_count).toBeDefined()
    })

    it('should limit history to specified limit', async () => {
      const response = await request
        .get('/api/search/history?limit=1')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.length).toBeLessThanOrEqual(1)
    })
  })
})

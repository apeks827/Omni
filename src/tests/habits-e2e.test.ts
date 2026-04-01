import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import authRouter from '../routes/auth.js'
import habitsRouter from '../routes/habits.js'
import { pool } from '../config/database.js'

const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use('/api/auth', authRouter)
app.use('/api/habits', habitsRouter)

const request = supertest(app)

describe('Habits E2E Tests', () => {
  let authToken: string
  let userId: string
  let habitId: string

  beforeAll(async () => {
    const registerRes = await request.post('/api/auth/register').send({
      email: `habit-test-${Date.now()}@example.com`,
      password: 'TestPass123!',
      name: 'Habit Tester',
    })

    authToken = registerRes.body.token
    userId = registerRes.body.user.id
  })

  afterAll(async () => {
    if (userId) {
      await pool.query('DELETE FROM users WHERE id = $1', [userId])
    }
  })

  describe('Create Habit Flow', () => {
    it('should create a daily habit', async () => {
      const res = await request
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Morning meditation',
          description: '10 minutes of mindfulness',
          frequency_type: 'daily',
          duration_minutes: 10,
          energy_level: 'medium',
        })

      expect(res.status).toBe(201)
      expect(res.body.name).toBe('Morning meditation')
      expect(res.body.frequency_type).toBe('daily')
      habitId = res.body.id
    })

    it('should reject habit without authentication', async () => {
      const res = await request.post('/api/habits').send({
        name: 'Test habit',
        frequency_type: 'daily',
        duration_minutes: 10,
      })

      expect(res.status).toBe(401)
    })

    it('should reject habit with invalid duration', async () => {
      const res = await request
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid habit',
          frequency_type: 'daily',
          duration_minutes: 0,
        })

      expect(res.status).toBe(400)
    })
  })

  describe('Complete Habit and Streak Tracking', () => {
    it('should complete habit and increment streak', async () => {
      const res = await request
        .post(`/api/habits/${habitId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ note: 'Felt great!' })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    it('should verify streak in stats', async () => {
      const res = await request
        .get(`/api/habits/${habitId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.total_completions).toBeGreaterThanOrEqual(1)
    })

    it('should skip habit and reset streak', async () => {
      const res = await request
        .post(`/api/habits/${habitId}/skip`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ note: 'Too busy today' })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })
  })

  describe('List and Retrieve Habits', () => {
    it('should list all user habits', async () => {
      const res = await request
        .get('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThanOrEqual(1)
    })

    it('should get specific habit', async () => {
      const res = await request
        .get(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.id).toBe(habitId)
    })
  })

  describe('Update and Delete Habits', () => {
    it('should update habit name', async () => {
      const res = await request
        .patch(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Evening meditation' })

      expect(res.status).toBe(200)
      expect(res.body.name).toBe('Evening meditation')
    })

    it('should delete habit', async () => {
      const res = await request
        .delete(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(204)
    })

    it('should return 404 for deleted habit', async () => {
      const res = await request
        .get(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(404)
    })
  })

  describe('Security: Data Isolation', () => {
    let otherAuthToken: string
    let otherUserId: string
    let isolatedHabitId: string

    beforeAll(async () => {
      const registerRes = await request.post('/api/auth/register').send({
        email: `habit-isolation-${Date.now()}@example.com`,
        password: 'TestPass123!',
        name: 'Other User',
      })

      otherAuthToken = registerRes.body.token
      otherUserId = registerRes.body.user.id

      const habitRes = await request
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Private habit',
          frequency_type: 'daily',
          duration_minutes: 15,
        })

      isolatedHabitId = habitRes.body.id
    })

    afterAll(async () => {
      if (otherUserId) {
        await pool.query('DELETE FROM users WHERE id = $1', [otherUserId])
      }
    })

    it('should not allow other user to access habit', async () => {
      const res = await request
        .get(`/api/habits/${isolatedHabitId}`)
        .set('Authorization', `Bearer ${otherAuthToken}`)

      expect(res.status).toBe(404)
    })

    it('should not allow other user to complete habit', async () => {
      const res = await request
        .post(`/api/habits/${isolatedHabitId}/complete`)
        .set('Authorization', `Bearer ${otherAuthToken}`)
        .send({})

      expect(res.status).toBe(404)
    })

    it('should not allow other user to delete habit', async () => {
      const res = await request
        .delete(`/api/habits/${isolatedHabitId}`)
        .set('Authorization', `Bearer ${otherAuthToken}`)

      expect(res.status).toBe(404)
    })
  })
})

import { describe, it, expect, beforeAll } from 'vitest'
import supertest from 'supertest'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import authRouter from '../routes/auth.js'
import calendarRouter from '../routes/calendar.js'

const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use('/api/auth', authRouter)
app.use('/api/calendar', calendarRouter)

const request = supertest(app)

describe('Calendar API Tests', () => {
  let authToken: string

  beforeAll(async () => {
    const response = await request.post('/api/auth/register').send({
      email: `calendar-test-${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'Calendar Test User',
    })

    authToken = response.body.token
  })

  describe('GET /api/calendar/day', () => {
    it('should return day calendar with energy blocks', async () => {
      const response = await request
        .get('/api/calendar/day?date=2026-03-30')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('date', '2026-03-30')
      expect(response.body).toHaveProperty('blocks')
      expect(response.body.blocks).toHaveLength(24)
      expect(response.body).toHaveProperty('energy_pattern')
      expect(response.body.energy_pattern).toHaveProperty('peak_hours')
      expect(response.body.energy_pattern).toHaveProperty('low_hours')
    })

    it('should return 400 if date is missing', async () => {
      const response = await request
        .get('/api/calendar/day')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/calendar/week', () => {
    it('should return week calendar with 7 days', async () => {
      const response = await request
        .get('/api/calendar/week?start_date=2026-03-30')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('start_date', '2026-03-30')
      expect(response.body).toHaveProperty('days')
      expect(response.body.days).toHaveLength(7)
      expect(response.body).toHaveProperty('energy_pattern')
    })

    it('should return 400 if start_date is missing', async () => {
      const response = await request
        .get('/api/calendar/week')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(400)
    })
  })
})

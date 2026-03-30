import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import authRouter from '../routes/auth.js'
import routinesRouter from '../routes/routines.js'
import { pool } from '../config/database.js'

const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use('/api/auth', authRouter)
app.use('/api/routines', routinesRouter)

const request = supertest(app)

describe('Routines E2E Tests', () => {
  let authToken: string
  let userId: string
  let routineId: string
  let stepId: string

  beforeAll(async () => {
    const registerRes = await request.post('/api/auth/register').send({
      email: `routine-test-${Date.now()}@example.com`,
      password: 'TestPass123!',
      name: 'Routine Tester',
    })

    authToken = registerRes.body.token
    userId = registerRes.body.user.id
  })

  afterAll(async () => {
    if (userId) {
      await pool.query('DELETE FROM users WHERE id = $1', [userId])
    }
  })

  describe('Create Routine Flow', () => {
    it('should create a morning routine', async () => {
      const res = await request
        .post('/api/routines')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Morning routine',
          time_window: 'morning',
        })

      expect(res.status).toBe(201)
      expect(res.body.name).toBe('Morning routine')
      expect(res.body.time_window).toBe('morning')
      routineId = res.body.id
    })

    it('should create routine without time_window', async () => {
      const res = await request
        .post('/api/routines')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Flexible routine',
        })

      expect(res.status).toBe(201)
      expect(res.body.name).toBe('Flexible routine')
    })

    it('should reject routine without authentication', async () => {
      const res = await request.post('/api/routines').send({
        name: 'Test routine',
      })

      expect(res.status).toBe(401)
    })

    it('should reject routine with invalid time_window', async () => {
      const res = await request
        .post('/api/routines')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid routine',
          time_window: 'midnight',
        })

      expect(res.status).toBe(400)
    })
  })

  describe('Routine Steps Management', () => {
    it('should add steps to a routine', async () => {
      const res = await request
        .post(`/api/routines/${routineId}/steps`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_index: 0,
          name: 'Meditate',
          duration_minutes: 10,
        })

      expect(res.status).toBe(201)
      expect(res.body.name).toBe('Meditate')
      stepId = res.body.id
    })

    it('should add multiple steps', async () => {
      const step2Res = await request
        .post(`/api/routines/${routineId}/steps`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_index: 1,
          name: 'Exercise',
          duration_minutes: 30,
        })

      expect(step2Res.status).toBe(201)

      const step3Res = await request
        .post(`/api/routines/${routineId}/steps`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_index: 2,
          name: 'Breakfast',
          duration_minutes: 20,
        })

      expect(step3Res.status).toBe(201)
    })

    it('should update a step', async () => {
      const res = await request
        .patch(`/api/routines/${routineId}/steps/${stepId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Guided meditation',
          duration_minutes: 15,
        })

      expect(res.status).toBe(200)
      expect(res.body.name).toBe('Guided meditation')
      expect(res.body.duration_minutes).toBe(15)
    })

    it('should remove a step', async () => {
      const stepRes = await request
        .post(`/api/routines/${routineId}/steps`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          order_index: 3,
          name: 'Temp step',
          duration_minutes: 5,
        })

      const tempStepId = stepRes.body.id

      const res = await request
        .delete(`/api/routines/${routineId}/steps/${tempStepId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(204)
    })
  })

  describe('List and Retrieve Routines', () => {
    it('should list all user routines', async () => {
      const res = await request
        .get('/api/routines')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThanOrEqual(1)
    })

    it('should get routine with steps', async () => {
      const res = await request
        .get(`/api/routines/${routineId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.id).toBe(routineId)
      expect(res.body.steps).toBeDefined()
      expect(Array.isArray(res.body.steps)).toBe(true)
    })
  })

  describe('Routine Progress Tracking', () => {
    it('should start a routine', async () => {
      const res = await request
        .post(`/api/routines/${routineId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          scheduled_date: '2024-01-15',
        })

      expect(res.status).toBe(200)
      expect(res.body.routine_id).toBe(routineId)
    })

    it('should get routine progress', async () => {
      const res = await request
        .get(`/api/routines/${routineId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ scheduled_date: '2024-01-15' })

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('completed_steps')
      expect(res.body).toHaveProperty('total_steps')
    })

    it('should get routine stats', async () => {
      const res = await request
        .get(`/api/routines/${routineId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('total_scheduled')
      expect(res.body).toHaveProperty('total_completed')
    })
  })

  describe('Update and Delete Routines', () => {
    it('should update routine name', async () => {
      const res = await request
        .patch(`/api/routines/${routineId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Evening routine', time_window: 'evening' })

      expect(res.status).toBe(200)
      expect(res.body.name).toBe('Evening routine')
      expect(res.body.time_window).toBe('evening')
    })

    it('should delete routine', async () => {
      const createRes = await request
        .post('/api/routines')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'To delete' })

      const tempRoutineId = createRes.body.id

      const res = await request
        .delete(`/api/routines/${tempRoutineId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(204)
    })

    it('should return 404 for deleted routine', async () => {
      const createRes = await request
        .post('/api/routines')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Temp routine' })

      const tempRoutineId = createRes.body.id

      await request
        .delete(`/api/routines/${tempRoutineId}`)
        .set('Authorization', `Bearer ${authToken}`)

      const res = await request
        .get(`/api/routines/${tempRoutineId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(404)
    })
  })

  describe('Security: Data Isolation', () => {
    let otherAuthToken: string
    let otherUserId: string
    let isolatedRoutineId: string

    beforeAll(async () => {
      const registerRes = await request.post('/api/auth/register').send({
        email: `routine-isolation-${Date.now()}@example.com`,
        password: 'TestPass123!',
        name: 'Other User',
      })

      otherAuthToken = registerRes.body.token
      otherUserId = registerRes.body.user.id

      const routineRes = await request
        .post('/api/routines')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Private routine',
          time_window: 'morning',
        })

      isolatedRoutineId = routineRes.body.id
    })

    afterAll(async () => {
      if (otherUserId) {
        await pool.query('DELETE FROM users WHERE id = $1', [otherUserId])
      }
    })

    it('should not allow other user to access routine', async () => {
      const res = await request
        .get(`/api/routines/${isolatedRoutineId}`)
        .set('Authorization', `Bearer ${otherAuthToken}`)

      expect(res.status).toBe(404)
    })

    it('should not allow other user to update routine', async () => {
      const res = await request
        .patch(`/api/routines/${isolatedRoutineId}`)
        .set('Authorization', `Bearer ${otherAuthToken}`)
        .send({ name: 'Hacked' })

      expect(res.status).toBe(404)
    })

    it('should not allow other user to delete routine', async () => {
      const res = await request
        .delete(`/api/routines/${isolatedRoutineId}`)
        .set('Authorization', `Bearer ${otherAuthToken}`)

      expect(res.status).toBe(404)
    })
  })
})

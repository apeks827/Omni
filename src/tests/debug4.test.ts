import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import express from 'express'
import authRouter from '../routes/auth.js'
import tasksRouter from '../routes/tasks.js'
import { pool } from '../config/database.js'

const app = express()
app.use(express.json())
app.use('/api/auth', authRouter)
app.use('/api/tasks', tasksRouter)

const requestClient = request(app)

describe('Debug test - exact copy of phase1d-e2e', () => {
  let authToken: string
  let userId: string
  let workspaceId: string

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

    it('should not allow user to see other user tasks', async () => {
      const res = await requestClient
        .get('/api/tasks')
        .set('Authorization', `Bearer ${otherAuthToken}`)

      console.log('Isolation GET /api/tasks status:', res.status, 'body:', JSON.stringify(res.body))
      expect(res.status).toBe(403)
    })
  })

  describe('Error Handling & Edge Cases', () => {
    it('should handle empty task list', async () => {
      const email = `empty-list-${Date.now()}@example.com`

      const registerRes = await requestClient.post('/api/auth/register').send({
        email,
        password: 'TestPass123!',
        name: 'Empty List User',
      })

      console.log('Empty list register status:', registerRes.status, 'token:', registerRes.body.token ? 'yes' : 'no')

      const listRes = await requestClient
        .get('/api/tasks')
        .set('Authorization', `Bearer ${registerRes.body.token}`)

      console.log('Empty list GET /api/tasks status:', listRes.status, 'body:', JSON.stringify(listRes.body))

      await pool.query('DELETE FROM users WHERE email = $1', [email])
      expect(listRes.status).toBe(403)
    })
  })
})

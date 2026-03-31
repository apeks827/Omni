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

describe('Debug test', () => {
  let mainUserId: string
  let mainToken: string

  beforeAll(async () => {
    const registerRes = await requestClient.post('/api/auth/register').send({
      email: `main-${Date.now()}@example.com`,
      password: 'TestPass123!',
      name: 'Main User',
    })
    mainToken = registerRes.body.token
    mainUserId = registerRes.body.user?.id
  })

  afterAll(async () => {
    if (mainUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [mainUserId])
    }
  })

  describe('Security & Data Isolation', () => {
    let otherToken: string
    let otherUserId: string

    beforeAll(async () => {
      const registerRes = await requestClient.post('/api/auth/register').send({
        email: `isolation-${Date.now()}@example.com`,
        password: 'TestPass123!',
        name: 'Isolation User',
      })
      otherToken = registerRes.body.token
      otherUserId = registerRes.body.user?.id
    })

    afterAll(async () => {
      if (otherUserId) {
        await pool.query('DELETE FROM users WHERE id = $1', [otherUserId])
      }
    })

    it('should not allow user to see other user tasks', async () => {
      const res = await requestClient
        .get('/api/tasks')
        .set('Authorization', `Bearer ${otherToken}`)

      console.log('Isolation user GET /api/tasks status:', res.status)
      console.log(
        'Isolation user GET /api/tasks body:',
        JSON.stringify(res.body)
      )

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

      console.log('Empty list user register status:', registerRes.status)
      console.log(
        'Empty list user token:',
        registerRes.body.token ? 'present' : 'missing'
      )

      const newToken = registerRes.body.token

      const listRes = await requestClient
        .get('/api/tasks')
        .set('Authorization', `Bearer ${newToken}`)

      console.log('Empty list user GET /api/tasks status:', listRes.status)
      console.log(
        'Empty list user GET /api/tasks body:',
        JSON.stringify(listRes.body)
      )

      await pool.query('DELETE FROM users WHERE email = $1', [email])
      expect(listRes.status).toBe(403)
    })
  })
})

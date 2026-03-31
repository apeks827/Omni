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
  let userId: string
  let authToken: string

  beforeAll(async () => {
    const registerRes = await requestClient.post('/api/auth/register').send({
      email: `main-${Date.now()}@example.com`,
      password: 'TestPass123!',
      name: 'Main User',
    })
    authToken = registerRes.body.token
    userId = registerRes.body.user?.id
  })

  afterAll(async () => {
    if (userId) {
      await pool.query('DELETE FROM users WHERE id = $1', [userId])
    }
  })

  it('should handle empty task list', async () => {
    const email = `empty-list-${Date.now()}@example.com`

    const registerRes = await requestClient.post('/api/auth/register').send({
      email,
      password: 'TestPass123!',
      name: 'Empty List User',
    })

    console.log('Register status:', registerRes.status)
    console.log('Register body:', JSON.stringify(registerRes.body, null, 2))

    const newToken = registerRes.body.token
    const newUserId = registerRes.body.user?.id

    const listRes = await requestClient
      .get('/api/tasks')
      .set('Authorization', `Bearer ${newToken}`)

    console.log('List status:', listRes.status)
    console.log('List body:', JSON.stringify(listRes.body, null, 2))

    if (newUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [newUserId])
    }

    expect(listRes.status).toBe(403)
  })
})

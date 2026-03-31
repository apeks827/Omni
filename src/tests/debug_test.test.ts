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

  afterAll(async () => {
    if (userId) {
      await pool.query('DELETE FROM users WHERE id = $1', [userId])
    }
  })

  it('debug new user task list', async () => {
    const email = `debug-${Date.now()}@example.com`

    const registerRes = await requestClient.post('/api/auth/register').send({
      email,
      password: 'TestPass123!',
      name: 'Debug User',
    })

    console.log('Register status:', registerRes.status)
    console.log('Register body:', JSON.stringify(registerRes.body, null, 2))

    userId = registerRes.body.user?.id
    const token = registerRes.body.token

    const listRes = await requestClient
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`)

    console.log('List status:', listRes.status)
    console.log('List body:', JSON.stringify(listRes.body, null, 2))

    expect(listRes.status).toBe(403)
  })
})

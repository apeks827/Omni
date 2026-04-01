import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import supertest from 'supertest'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import authRouter from '../routes/auth.js'
import tasksRouter from '../routes/tasks.js'
import { cacheService } from '../services/cache/CacheService.js'

const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use('/api/auth', authRouter)
app.use('/api/tasks', tasksRouter)

const request = supertest(app)

describe('Bulk Task Operations Tests', () => {
  let authToken: string
  let taskIds: string[] = []

  afterEach(() => {
    cacheService.clear()
  })

  beforeAll(async () => {
    const response = await request.post('/api/auth/register').send({
      email: `bulk-test-${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'Bulk Test User',
    })

    authToken = response.body.token

    const taskPromises = Array.from({ length: 5 }, (_, i) =>
      request
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: `Bulk Test Task ${i + 1}`,
          description: 'Task for bulk operations testing',
          status: 'todo',
          priority: 'medium',
        })
    )

    const taskResponses = await Promise.all(taskPromises)
    taskIds = taskResponses.map(res => res.body.id)
  })

  describe('Bulk Status Change', () => {
    it('should update status for multiple tasks', async () => {
      const response = await request
        .patch('/api/tasks/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          task_ids: taskIds.slice(0, 3),
          updates: { status: 'in_progress' },
        })

      expect(response.status).toBe(200)
      expect(response.body.updated_count).toBe(3)
      expect(response.body.failed_count).toBe(0)

      const verifyResponse = await request
        .get(`/api/tasks/${taskIds[0]}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(verifyResponse.body.status).toBe('in_progress')
    })

    it('should reject bulk update without authentication', async () => {
      const response = await request.patch('/api/tasks/bulk').send({
        task_ids: taskIds.slice(0, 2),
        updates: { status: 'done' },
      })

      expect(response.status).toBe(401)
    })

    it('should reject bulk update with empty task_ids', async () => {
      const response = await request
        .patch('/api/tasks/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          task_ids: [],
          updates: { status: 'done' },
        })

      expect(response.status).toBe(400)
    })

    it('should handle partial failures gracefully', async () => {
      const response = await request
        .patch('/api/tasks/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          task_ids: [
            ...taskIds.slice(0, 2),
            '00000000-0000-0000-0000-000000000000',
          ],
          updates: { status: 'done' },
        })

      expect(response.status).toBe(200)
      expect(response.body.updated_count).toBe(2)
      expect(response.body.failed_count).toBe(1)
      expect(response.body.errors).toBeDefined()
      expect(response.body.errors.length).toBe(1)
    })
  })

  describe('Bulk Priority Change', () => {
    it('should update priority for multiple tasks', async () => {
      const response = await request
        .patch('/api/tasks/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          task_ids: taskIds.slice(0, 3),
          updates: { priority: 'high' },
        })

      expect(response.status).toBe(200)
      expect(response.body.updated_count).toBe(3)

      const verifyResponse = await request
        .get(`/api/tasks/${taskIds[0]}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(verifyResponse.body.priority).toBe('high')
    })
  })

  describe('Bulk Delete', () => {
    it('should delete multiple tasks', async () => {
      const newTaskResponses = await Promise.all([
        request
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Delete Test Task 1',
            description: 'Task for delete testing',
            status: 'todo',
            priority: 'medium',
          }),
        request
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Delete Test Task 2',
            description: 'Task for delete testing',
            status: 'todo',
            priority: 'medium',
          }),
      ])

      const deleteTaskIds = newTaskResponses.map(res => res.body.id)

      const response = await request
        .delete('/api/tasks/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          task_ids: deleteTaskIds,
        })

      if (response.status !== 200) {
        console.log('Delete response:', response.status, response.body)
      }

      expect(response.status).toBe(200)
      expect(response.body.deleted_count).toBe(2)
      expect(response.body.failed_count).toBe(0)

      const verifyResponse = await request
        .get(`/api/tasks/${deleteTaskIds[0]}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(verifyResponse.status).toBe(404)
    })

    it('should reject bulk delete without authentication', async () => {
      const response = await request.delete('/api/tasks/bulk').send({
        task_ids: taskIds.slice(2, 4),
      })

      expect(response.status).toBe(401)
    })

    it('should reject bulk delete with empty task_ids', async () => {
      const response = await request
        .delete('/api/tasks/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          task_ids: [],
        })

      expect(response.status).toBe(400)
    })
  })

  describe('Performance', () => {
    it('should handle 100 tasks bulk operation under 500ms', async () => {
      const largeBatchPromises = Array.from({ length: 100 }, (_, i) =>
        request
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: `Performance Test Task ${i + 1}`,
            status: 'todo',
            priority: 'low',
          })
      )

      const largeBatchResponses = await Promise.all(largeBatchPromises)
      const largeBatchIds = largeBatchResponses.map(res => res.body.id)

      const startTime = Date.now()

      const response = await request
        .patch('/api/tasks/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          task_ids: largeBatchIds,
          updates: { status: 'done' },
        })

      const duration = Date.now() - startTime

      expect(response.status).toBe(200)
      expect(response.body.updated_count).toBe(100)
      expect(duration).toBeLessThan(500)

      await request
        .delete('/api/tasks/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          task_ids: largeBatchIds,
        })
    })
  })

  describe('Error Handling', () => {
    it('should return detailed error information for invalid task IDs', async () => {
      const response = await request
        .patch('/api/tasks/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          task_ids: ['invalid-id', taskIds[2]],
          updates: { status: 'done' },
        })

      expect(response.status).toBe(200)
      expect(response.body.failed_count).toBeGreaterThan(0)
      expect(response.body.errors).toBeDefined()
      expect(Array.isArray(response.body.errors)).toBe(true)
    })

    it('should validate update fields', async () => {
      const response = await request
        .patch('/api/tasks/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          task_ids: taskIds.slice(2, 4),
          updates: { status: 'invalid_status' },
        })

      expect(response.status).toBe(400)
    })
  })
})

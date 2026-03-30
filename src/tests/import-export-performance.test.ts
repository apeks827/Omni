import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import supertest from 'supertest'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import authRouter from '../routes/auth.js'
import importExportRouter from '../routes/import-export.js'
import tasksRouter from '../routes/tasks.js'
import { pool } from '../config/database.js'
import { clearRateLimitStore } from '../middleware/rateLimit.js'

const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use('/api/auth', authRouter)
app.use('/api', importExportRouter)
app.use('/api/tasks', tasksRouter)

const request = supertest(app)

describe('Import/Export Performance Tests', () => {
  let authToken: string
  let workspaceId: string

  beforeEach(() => {
    clearRateLimitStore()
  })

  beforeAll(async () => {
    const response = await request.post('/api/auth/register').send({
      email: `perf-test-${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'Performance Test User',
    })

    authToken = response.body.token
    workspaceId = response.body.workspace_id
  })

  afterAll(async () => {
    await pool.end()
  })

  describe('Large Dataset Tests', () => {
    it('should export 1000+ tasks within 5 seconds', async () => {
      const tasks: any[] = []
      for (let i = 1; i <= 1000; i++) {
        tasks.push({
          title: `Bulk Task ${i}`,
          description: `Description for task ${i}`,
          status: i % 3 === 0 ? 'done' : 'todo',
          priority: i % 4 === 0 ? 'high' : 'medium',
        })
      }

      for (let i = 0; i < tasks.length; i += 100) {
        const batch = tasks.slice(i, i + 100)
        await Promise.all(
          batch.map((task: any) =>
            request
              .post('/api/tasks')
              .set('Authorization', `Bearer ${authToken}`)
              .send(task)
          )
        )
      }

      const startTime = Date.now()
      const response = await request
        .post('/api/export')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ format: 'json' })
      const duration = Date.now() - startTime

      expect(response.status).toBe(200)
      const exportedTasks = JSON.parse(response.text)
      expect(exportedTasks.length).toBeGreaterThanOrEqual(1000)
      expect(duration).toBeLessThan(5000)
    }, 30000)

    it('should import 1000 tasks within 60 seconds', async () => {
      const tasks: any[] = []
      for (let i = 1; i <= 1000; i++) {
        tasks.push({
          title: `Import Bulk Task ${i}`,
          priority: i % 2 === 0 ? 'high' : 'low',
          status: 'todo',
        })
      }

      const startTime = Date.now()
      const response = await request
        .post('/api/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: JSON.stringify(tasks),
          format: 'json',
        })
      const duration = Date.now() - startTime

      expect(response.status).toBe(200)
      expect(response.body.imported_count).toBe(1000)
      expect(duration).toBeLessThan(60000)
    }, 90000)

    it('should handle CSV export of 1000+ tasks', async () => {
      const response = await request
        .post('/api/export')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ format: 'csv' })

      expect(response.status).toBe(200)
      const lines = response.text.split('\n')
      expect(lines.length).toBeGreaterThan(1000)
    })

    it('should handle Markdown export of 1000+ tasks', async () => {
      const response = await request
        .post('/api/export')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ format: 'markdown' })

      expect(response.status).toBe(200)
      expect(response.text).toContain('# Tasks Export')
      const taskCount = (response.text.match(/^- \[/gm) || []).length
      expect(taskCount).toBeGreaterThan(1000)
    })
  })

  describe('Conflict Resolution at Scale', () => {
    it('should detect conflicts in large import', async () => {
      const tasks: any[] = []
      for (let i = 1; i <= 500; i++) {
        tasks.push({
          title: `Bulk Task ${i}`,
          priority: 'high',
        })
      }

      const response = await request
        .post('/api/import/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: JSON.stringify(tasks),
          format: 'json',
        })

      expect(response.status).toBe(200)
      expect(response.body.total_tasks).toBe(500)
      expect(response.body.duplicate_tasks).toBeGreaterThan(0)
      expect(response.body.conflicts.length).toBeGreaterThan(0)
    })

    it('should skip duplicates efficiently in large import', async () => {
      const tasks: any[] = []
      for (let i = 1; i <= 500; i++) {
        tasks.push({
          title: `Bulk Task ${i}`,
          priority: 'critical',
        })
      }

      const startTime = Date.now()
      const response = await request
        .post('/api/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: JSON.stringify(tasks),
          format: 'json',
          options: { skip_duplicates: true },
        })
      const duration = Date.now() - startTime

      expect(response.status).toBe(200)
      expect(response.body.skipped_count).toBeGreaterThan(0)
      expect(duration).toBeLessThan(30000)
    }, 45000)
  })

  describe('Memory Efficiency', () => {
    it('should handle large CSV without memory issues', async () => {
      let csvData = 'title,priority,status\n'
      for (let i = 1; i <= 5000; i++) {
        csvData += `Task ${i},medium,todo\n`
      }

      const response = await request
        .post('/api/import/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: csvData,
          format: 'csv',
        })

      expect(response.status).toBe(200)
      expect(response.body.total_tasks).toBe(5000)
    }, 30000)
  })
})

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import authRouter from '../routes/auth.js'
import importExportRouter from '../routes/import-export.js'
import tasksRouter from '../routes/tasks.js'
import projectsRouter from '../routes/projects.js'
import { pool } from '../config/database.js'

const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use('/api/auth', authRouter)
app.use('/api', importExportRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/projects', projectsRouter)

const request = supertest(app)

describe('Import/Export Integration Tests', () => {
  let authToken: string
  let workspaceId: string
  let projectId: string
  let taskIds: string[] = []

  beforeAll(async () => {
    const response = await request.post('/api/auth/register').send({
      email: `import-export-test-${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'Import Export Test User',
    })

    authToken = response.body.token
    workspaceId = response.body.workspace_id

    const projectResponse = await request
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Project for Import/Export',
        description: 'Project for testing import/export',
      })

    projectId = projectResponse.body.id

    for (let i = 1; i <= 5; i++) {
      const taskResponse = await request
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: `Test Task ${i}`,
          description: `Description for task ${i}`,
          status: i % 2 === 0 ? 'done' : 'todo',
          priority: i <= 2 ? 'high' : 'medium',
          project_id: projectId,
        })
      taskIds.push(taskResponse.body.id)
    }
  })

  afterAll(async () => {
    await pool.end()
  })

  describe('Export Endpoints', () => {
    it('should export tasks as JSON', async () => {
      const response = await request
        .post('/api/export')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ format: 'json' })

      expect(response.status).toBe(200)
      expect(response.headers['content-type']).toContain('application/json')
      expect(response.headers['content-disposition']).toContain('attachment')

      const tasks = JSON.parse(response.text)
      expect(Array.isArray(tasks)).toBe(true)
      expect(tasks.length).toBeGreaterThanOrEqual(5)
    })

    it('should export tasks as CSV', async () => {
      const response = await request
        .post('/api/export')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ format: 'csv' })

      expect(response.status).toBe(200)
      expect(response.headers['content-type']).toContain('text/csv')
      expect(response.text).toContain('title')
      expect(response.text).toContain('Test Task')
    })

    it('should export tasks as Markdown', async () => {
      const response = await request
        .post('/api/export')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ format: 'markdown' })

      expect(response.status).toBe(200)
      expect(response.headers['content-type']).toContain('text/markdown')
      expect(response.text).toContain('# Tasks Export')
      expect(response.text).toContain('Test Task')
    })

    it('should export tasks as iCal', async () => {
      const response = await request
        .post('/api/export')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ format: 'ical' })

      expect(response.status).toBe(200)
      expect(response.headers['content-type']).toContain('text/calendar')
      expect(response.text).toContain('BEGIN:VCALENDAR')
      expect(response.text).toContain('BEGIN:VTODO')
    })

    it('should filter export by status', async () => {
      const response = await request
        .post('/api/export')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'json',
          filters: { status: 'done' },
        })

      expect(response.status).toBe(200)
      const tasks = JSON.parse(response.text)
      expect(tasks.every((t: any) => t.status === 'done')).toBe(true)
    })

    it('should filter export by priority', async () => {
      const response = await request
        .post('/api/export')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'json',
          filters: { priority: 'high' },
        })

      expect(response.status).toBe(200)
      const tasks = JSON.parse(response.text)
      expect(tasks.every((t: any) => t.priority === 'high')).toBe(true)
    })

    it('should filter export by project', async () => {
      const response = await request
        .post('/api/export')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'json',
          filters: { project_id: projectId },
        })

      expect(response.status).toBe(200)
      const tasks = JSON.parse(response.text)
      expect(tasks.every((t: any) => t.project_id === projectId)).toBe(true)
    })
  })

  describe('Import Preview', () => {
    it('should preview JSON import', async () => {
      const importData = JSON.stringify([
        { title: 'New Task 1', priority: 'high' },
        { title: 'New Task 2', priority: 'medium' },
      ])

      const response = await request
        .post('/api/import/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: importData,
          format: 'json',
        })

      expect(response.status).toBe(200)
      expect(response.body.total_tasks).toBe(2)
      expect(response.body.new_tasks).toBeGreaterThanOrEqual(0)
      expect(response.body.sample_tasks).toHaveLength(2)
    })

    it('should detect duplicate tasks in preview', async () => {
      const importData = JSON.stringify([
        { title: 'Test Task 1', priority: 'high' },
      ])

      const response = await request
        .post('/api/import/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: importData,
          format: 'json',
        })

      expect(response.status).toBe(200)
      expect(response.body.duplicate_tasks).toBeGreaterThan(0)
      expect(response.body.conflicts.length).toBeGreaterThan(0)
    })

    it('should preview CSV import', async () => {
      const importData = `title,priority,status
Import Task 1,high,todo
Import Task 2,medium,in_progress`

      const response = await request
        .post('/api/import/preview')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: importData,
          format: 'csv',
        })

      expect(response.status).toBe(200)
      expect(response.body.total_tasks).toBe(2)
    })
  })

  describe('Import Tasks', () => {
    it('should import JSON tasks', async () => {
      const importData = JSON.stringify([
        { title: 'Imported Task 1', priority: 'high', status: 'todo' },
        { title: 'Imported Task 2', priority: 'medium', status: 'todo' },
      ])

      const response = await request
        .post('/api/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: importData,
          format: 'json',
        })

      expect(response.status).toBe(200)
      expect(response.body.imported_count).toBe(2)
      expect(response.body.failed_count).toBe(0)
    })

    it('should skip duplicates when option enabled', async () => {
      const importData = JSON.stringify([
        { title: 'Test Task 1', priority: 'high' },
      ])

      const response = await request
        .post('/api/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: importData,
          format: 'json',
          options: { skip_duplicates: true },
        })

      expect(response.status).toBe(200)
      expect(response.body.skipped_count).toBeGreaterThan(0)
    })

    it('should update existing tasks when option enabled', async () => {
      const importData = JSON.stringify([
        { title: 'Test Task 1', priority: 'critical', description: 'Updated' },
      ])

      const response = await request
        .post('/api/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: importData,
          format: 'json',
          options: { update_existing: true },
        })

      expect(response.status).toBe(200)
      expect(response.body.updated_count).toBeGreaterThan(0)
    })

    it('should import CSV tasks', async () => {
      const importData = `title,priority,status
CSV Import Task 1,high,todo
CSV Import Task 2,low,done`

      const response = await request
        .post('/api/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: importData,
          format: 'csv',
        })

      expect(response.status).toBe(200)
      expect(response.body.imported_count).toBe(2)
    })

    it('should apply field mapping during import', async () => {
      const importData = JSON.stringify([
        { name: 'Mapped Task', level: 'high' },
      ])

      const response = await request
        .post('/api/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: importData,
          format: 'json',
          mapping: { name: 'title', level: 'priority' },
        })

      expect(response.status).toBe(200)
      expect(response.body.imported_count).toBe(1)
    })

    it('should import Markdown tasks', async () => {
      const importData = `- [ ] Markdown Task 1
- [x] Markdown Task 2`

      const response = await request
        .post('/api/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: importData,
          format: 'markdown',
        })

      expect(response.status).toBe(200)
      expect(response.body.imported_count).toBe(2)
    })
  })

  describe('E2E: Export → Import → Verify', () => {
    it('should export and re-import JSON without data loss', async () => {
      const exportResponse = await request
        .post('/api/export')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          format: 'json',
          filters: { project_id: projectId },
        })

      expect(exportResponse.status).toBe(200)
      const exportedTasks = JSON.parse(exportResponse.text)
      const originalCount = exportedTasks.length

      const modifiedTasks = exportedTasks.map((t: any) => ({
        title: `Reimported ${t.title}`,
        description: t.description,
        priority: t.priority,
        status: t.status,
      }))

      const importResponse = await request
        .post('/api/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: JSON.stringify(modifiedTasks),
          format: 'json',
        })

      expect(importResponse.status).toBe(200)
      expect(importResponse.body.imported_count).toBe(originalCount)

      const verifyResponse = await request
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)

      const reimportedTasks = verifyResponse.body.filter((t: any) =>
        t.title.startsWith('Reimported')
      )
      expect(reimportedTasks.length).toBe(originalCount)
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce export rate limit', async () => {
      const requests: Promise<any>[] = []
      for (let i = 0; i < 6; i++) {
        requests.push(
          request
            .post('/api/export')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ format: 'json' })
        )
      }

      const responses = await Promise.all(requests)
      const rateLimited = responses.some((r: any) => r.status === 429)
      expect(rateLimited).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should reject invalid export format', async () => {
      const response = await request
        .post('/api/export')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ format: 'invalid' })

      expect(response.status).toBe(400)
    })

    it('should reject invalid import format', async () => {
      const response = await request
        .post('/api/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: 'test',
          format: 'invalid',
        })

      expect(response.status).toBe(400)
    })

    it('should handle malformed JSON import', async () => {
      const response = await request
        .post('/api/import')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: '{invalid json',
          format: 'json',
        })

      expect(response.status).toBe(500)
    })
  })
})

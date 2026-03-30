import { describe, it, expect, beforeAll } from 'vitest'
import supertest from 'supertest'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import authRouter from '../routes/auth.js'
import tasksRouter from '../routes/tasks.js'
import projectsRouter from '../routes/projects.js'

const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use('/api/auth', authRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/projects', projectsRouter)

const request = supertest(app)

interface TaskResponse {
  status: string
  [key: string]: unknown
}

describe('Tasks API Tests', () => {
  let authToken: string
  let createdTaskId: string
  let projectId: string

  beforeAll(async () => {
    const response = await request.post('/api/auth/register').send({
      email: `task-test-${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'Task Test User',
    })

    authToken = response.body.token

    const projectResponse = await request
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Project for Tasks',
        description: 'Project for task testing',
      })

    projectId = projectResponse.body.id
  })

  describe('Create Task', () => {
    it('should create a new task', async () => {
      const response = await request
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task',
          description: 'A test task',
          status: 'todo',
          priority: 'medium',
        })

      expect(response.status).toBe(201)
      expect(response.body.id).toBeDefined()
      expect(response.body.title).toBe('Test Task')
      expect(response.body.status).toBe('todo')
      expect(response.body.priority).toBe('medium')
      createdTaskId = response.body.id
    })

    it('should create a task with project assignment', async () => {
      const response = await request
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Project Task',
          status: 'todo',
          priority: 'high',
          project_id: projectId,
        })

      expect(response.status).toBe(201)
      expect(response.body.project_id).toBe(projectId)
    })

    it('should reject task creation without authentication', async () => {
      const response = await request.post('/api/tasks').send({
        title: 'Unauthorized Task',
        status: 'todo',
        priority: 'low',
      })

      expect(response.status).toBe(401)
    })

    it('should reject task creation without title', async () => {
      const response = await request
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'todo',
          priority: 'low',
        })

      expect(response.status).toBe(400)
    })
  })

  describe('Get Tasks', () => {
    it('should get all tasks for workspace', async () => {
      const response = await request
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body).toHaveProperty('total')
      expect(response.body).toHaveProperty('page')
      expect(response.body).toHaveProperty('limit')
      expect(response.body).toHaveProperty('totalPages')
      expect(response.body.data.length).toBeGreaterThan(0)
    })

    it('should filter tasks by status', async () => {
      const response = await request
        .get('/api/tasks?status=todo')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      response.body.data.forEach((task: TaskResponse) => {
        expect(task.status).toBe('todo')
      })
    })

    it('should filter tasks by priority', async () => {
      const response = await request
        .get('/api/tasks?priority=high')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      response.body.data.forEach((task: TaskResponse) => {
        expect(task.priority).toBe('high')
      })
    })

    it('should filter tasks by project', async () => {
      const response = await request
        .get(`/api/tasks?project_id=${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      response.body.data.forEach((task: TaskResponse) => {
        expect(task.project_id).toBe(projectId)
      })
    })

    it('should support pagination', async () => {
      const response = await request
        .get('/api/tasks?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.page).toBe(1)
      expect(response.body.limit).toBe(5)
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('should get a specific task by id', async () => {
      const response = await request
        .get(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.id).toBe(createdTaskId)
      expect(response.body.title).toBe('Test Task')
    })

    it('should return 404 for non-existent task', async () => {
      const response = await request
        .get('/api/tasks/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })

    it('should reject requests without authentication', async () => {
      const response = await request.get('/api/tasks')
      expect(response.status).toBe(401)
    })
  })

  describe('Update Task', () => {
    it('should update a task', async () => {
      const response = await request
        .put(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Task Title',
          description: 'Updated description',
          status: 'in_progress',
          priority: 'high',
        })

      expect(response.status).toBe(200)
      expect(response.body.title).toBe('Updated Task Title')
      expect(response.body.status).toBe('in_progress')
      expect(response.body.priority).toBe('high')
    })

    it('should return 404 when updating non-existent task', async () => {
      const response = await request
        .put('/api/tasks/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Non-existent',
        })

      expect(response.status).toBe(404)
    })

    it('should reject update without authentication', async () => {
      const response = await request.put(`/api/tasks/${createdTaskId}`).send({
        title: 'Unauthorized Update',
      })

      expect(response.status).toBe(401)
    })
  })

  describe('Schedule Task', () => {
    it('should schedule a task and return time slot', async () => {
      const createResponse = await request
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task to Schedule',
          priority: 'high',
          due_date: new Date(Date.now() + 86400000).toISOString(),
        })

      const taskId = createResponse.body.id

      const response = await request
        .post(`/api/tasks/${taskId}/schedule`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.task_id).toBe(taskId)
      expect(response.body.suggested_slot).toBeDefined()
      expect(response.body.suggested_slot.start_time).toBeDefined()
      expect(response.body.suggested_slot.end_time).toBeDefined()
      expect(response.body.suggested_slot.confidence).toBeGreaterThan(0)
      expect(response.body.reasoning).toBeDefined()
      expect(Array.isArray(response.body.alternative_slots)).toBe(true)
    })

    it('should return 404 for non-existent task', async () => {
      const response = await request
        .post('/api/tasks/00000000-0000-0000-0000-000000000000/schedule')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })

    it('should reject scheduling without authentication', async () => {
      const response = await request.post(
        '/api/tasks/00000000-0000-0000-0000-000000000000/schedule'
      )

      expect(response.status).toBe(401)
    })
  })

  describe('Delete Task', () => {
    it('should delete a task', async () => {
      const response = await request
        .delete(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(204)
    })

    it('should return 404 after deleting task', async () => {
      const response = await request
        .get(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })

    it('should return 404 when deleting non-existent task', async () => {
      const response = await request
        .delete('/api/tasks/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })

    it('should reject delete without authentication', async () => {
      const response = await request.delete(
        '/api/tasks/00000000-0000-0000-0000-000000000000'
      )

      expect(response.status).toBe(401)
    })
  })
})

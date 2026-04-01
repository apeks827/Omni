import { describe, it, expect, beforeAll } from 'vitest'
import supertest from 'supertest'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import authRouter from '../routes/auth.js'
import tasksRouter from '../routes/tasks.js'
import commentsRouter from '../routes/comments.js'

const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use('/api/auth', authRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/tasks', commentsRouter)

const request = supertest(app)

describe('Task Comments API', () => {
  let authToken: string
  let userId: string
  let workspaceId: string
  let taskId: string
  let commentId: string

  beforeAll(async () => {
    const authResponse = await request.post('/api/auth/register').send({
      email: `comments-test-${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'Comments Test User',
    })

    authToken = authResponse.body.token
    userId = authResponse.body.user.id
    workspaceId = authResponse.body.user.workspace_id

    const taskResponse = await request
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Task for Comments',
        status: 'todo',
        priority: 'medium',
      })

    taskId = taskResponse.body.id
  })

  describe('POST /api/tasks/:taskId/comments', () => {
    it('should create a comment', async () => {
      const response = await request
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'This is a test comment',
        })

      expect(response.status).toBe(201)
      expect(response.body.id).toBeDefined()
      expect(response.body.content).toBe('This is a test comment')
      expect(response.body.user_id).toBe(userId)
      expect(response.body.task_id).toBe(taskId)
      commentId = response.body.id
    })

    it('should reject empty comment', async () => {
      const response = await request
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '',
        })

      expect(response.status).toBe(400)
    })

    it('should reject comment without auth', async () => {
      const response = await request
        .post(`/api/tasks/${taskId}/comments`)
        .send({
          content: 'Unauthorized comment',
        })

      expect(response.status).toBe(401)
    })

    it('should create threaded comment', async () => {
      const response = await request
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'This is a reply',
          parent_comment_id: commentId,
        })

      expect(response.status).toBe(201)
      expect(response.body.parent_comment_id).toBe(commentId)
    })
  })

  describe('GET /api/tasks/:taskId/comments', () => {
    it('should get all comments for a task', async () => {
      const response = await request
        .get(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
    })

    it('should reject without auth', async () => {
      const response = await request.get(`/api/tasks/${taskId}/comments`)

      expect(response.status).toBe(401)
    })
  })

  describe('PUT /api/tasks/:taskId/comments/:id', () => {
    it('should update a comment', async () => {
      const response = await request
        .put(`/api/tasks/${taskId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Updated comment content',
        })

      expect(response.status).toBe(200)
      expect(response.body.content).toBe('Updated comment content')
    })

    it('should reject empty update', async () => {
      const response = await request
        .put(`/api/tasks/${taskId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '',
        })

      expect(response.status).toBe(400)
    })

    it('should reject unauthorized update', async () => {
      const otherUserResponse = await request.post('/api/auth/register').send({
        email: `other-${Date.now()}@example.com`,
        password: 'Password123!',
        name: 'Other User',
      })

      const response = await request
        .put(`/api/tasks/${taskId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${otherUserResponse.body.token}`)
        .send({
          content: 'Trying to update someone elses comment',
        })

      expect(response.status).toBe(403)
    })
  })

  describe('DELETE /api/tasks/:taskId/comments/:id', () => {
    it('should soft delete a comment', async () => {
      const createResponse = await request
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Comment to be deleted',
        })

      const deleteResponse = await request
        .delete(`/api/tasks/${taskId}/comments/${createResponse.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(deleteResponse.status).toBe(204)

      const getResponse = await request
        .get(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)

      const deletedComment = getResponse.body.find(
        (c: any) => c.id === createResponse.body.id
      )
      expect(deletedComment).toBeUndefined()
    })

    it('should reject unauthorized delete', async () => {
      const otherUserResponse = await request.post('/api/auth/register').send({
        email: `delete-other-${Date.now()}@example.com`,
        password: 'Password123!',
        name: 'Delete Other User',
      })

      const response = await request
        .delete(`/api/tasks/${taskId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${otherUserResponse.body.token}`)

      expect(response.status).toBe(403)
    })
  })

  describe('XSS Protection', () => {
    it('should sanitize malicious content', async () => {
      const response = await request
        .post(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '<script>alert("XSS")</script>Normal text',
        })

      expect(response.status).toBe(201)
      expect(response.body.content).not.toContain('<script>')
    })
  })

  describe('Performance', () => {
    it('should handle large comment threads', async () => {
      const promises = Array.from({ length: 50 }, (_, i) =>
        request
          .post(`/api/tasks/${taskId}/comments`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            content: `Performance test comment ${i}`,
          })
      )

      const start = Date.now()
      await Promise.all(promises)
      const elapsed = Date.now() - start

      expect(elapsed).toBeLessThan(5000)

      const getResponse = await request
        .get(`/api/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(getResponse.status).toBe(200)
      expect(getResponse.body.length).toBeGreaterThanOrEqual(50)
    })
  })
})

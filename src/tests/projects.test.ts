import { describe, it, expect, beforeAll } from 'vitest'
import supertest from 'supertest'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import authRouter from '../routes/auth.js'
import projectsRouter from '../routes/projects.js'

const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use('/api/auth', authRouter)
app.use('/api/projects', projectsRouter)

const request = supertest(app)

describe('Projects API Tests', () => {
  let authToken: string
  let createdProjectId: string

  beforeAll(async () => {
    const response = await request.post('/api/auth/register').send({
      email: `project-test-${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'Project Test User',
    })

    authToken = response.body.token
  })

  describe('Create Project', () => {
    it('should create a new project', async () => {
      const response = await request
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Project',
          description: 'A test project',
        })

      expect(response.status).toBe(201)
      expect(response.body.id).toBeDefined()
      expect(response.body.name).toBe('Test Project')
      expect(response.body.description).toBe('A test project')
      createdProjectId = response.body.id
    })

    it('should reject project creation without authentication', async () => {
      const response = await request.post('/api/projects').send({
        name: 'Unauthorized Project',
      })

      expect(response.status).toBe(401)
    })

    it('should reject project creation without name', async () => {
      const response = await request
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Missing name',
        })

      expect(response.status).toBe(400)
    })
  })

  describe('Get Projects', () => {
    it('should get all projects for workspace', async () => {
      const response = await request
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
    })

    it('should get a specific project by id', async () => {
      const response = await request
        .get(`/api/projects/${createdProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.id).toBe(createdProjectId)
      expect(response.body.name).toBe('Test Project')
    })

    it('should return 404 for non-existent project', async () => {
      const response = await request
        .get('/api/projects/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })

    it('should reject requests without authentication', async () => {
      const response = await request.get('/api/projects')
      expect(response.status).toBe(401)
    })
  })

  describe('Update Project', () => {
    it('should update a project', async () => {
      const response = await request
        .put(`/api/projects/${createdProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Project Name',
          description: 'Updated description',
        })

      expect(response.status).toBe(200)
      expect(response.body.name).toBe('Updated Project Name')
      expect(response.body.description).toBe('Updated description')
    })

    it('should return 404 when updating non-existent project', async () => {
      const response = await request
        .put('/api/projects/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Non-existent',
        })

      expect(response.status).toBe(404)
    })

    it('should reject update without authentication', async () => {
      const response = await request
        .put(`/api/projects/${createdProjectId}`)
        .send({
          name: 'Unauthorized Update',
        })

      expect(response.status).toBe(401)
    })
  })

  describe('Delete Project', () => {
    it('should delete a project', async () => {
      const response = await request
        .delete(`/api/projects/${createdProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(204)
    })

    it('should return 404 after deleting project', async () => {
      const response = await request
        .get(`/api/projects/${createdProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })

    it('should return 404 when deleting non-existent project', async () => {
      const response = await request
        .delete('/api/projects/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })

    it('should reject delete without authentication', async () => {
      const response = await request.delete(
        '/api/projects/00000000-0000-0000-0000-000000000000'
      )

      expect(response.status).toBe(401)
    })
  })
})

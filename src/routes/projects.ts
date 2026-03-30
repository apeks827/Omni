import { Router } from 'express'
import { Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { validate, validateParams } from '../middleware/validation.js'
import {
  createProjectSchema,
  updateProjectSchema,
  uuidParamSchema,
} from '../validation/schemas.js'
import { handleError } from '../utils/errors.js'
import projectService from '../domains/projects/services/project.service.js'

const router = Router()

router.use(authenticateToken)

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId
    if (!workspaceId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const projects = await projectService.listProjects(workspaceId)
    res.json(projects)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to fetch projects')
    res.status(status).json(body)
  }
})

router.get(
  '/:id',
  validateParams(uuidParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string
      const workspaceId = req.workspaceId
      if (!workspaceId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      const project = await projectService.getProjectById(id, workspaceId)
      res.json(project)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to fetch project')
      res.status(status).json(body)
    }
  }
)

router.post(
  '/',
  validate(createProjectSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, description } = req.body
      const userId = req.userId
      const workspaceId = req.workspaceId
      if (!userId || !workspaceId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      const project = await projectService.createProject(
        name,
        description,
        userId,
        workspaceId
      )
      res.status(201).json(project)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to create project')
      res.status(status).json(body)
    }
  }
)

router.put(
  '/:id',
  validateParams(uuidParamSchema),
  validate(updateProjectSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string
      const { name, description } = req.body
      const workspaceId = req.workspaceId
      if (!workspaceId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      const project = await projectService.updateProject(
        id,
        name,
        description,
        workspaceId
      )
      res.json(project)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to update project')
      res.status(status).json(body)
    }
  }
)

router.delete(
  '/:id',
  validateParams(uuidParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string
      const workspaceId = req.workspaceId
      if (!workspaceId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      await projectService.deleteProject(id, workspaceId)
      res.status(204).send()
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to delete project')
      res.status(status).json(body)
    }
  }
)

export default router

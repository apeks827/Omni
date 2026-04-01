import { Router, Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { validate } from '../middleware/validation.js'
import { handleError } from '../utils/errors.js'
import templateService from '../services/templates/template.service.js'
import { z } from 'zod'

const router = Router()
router.use(authenticateToken)

const createTemplateSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  estimated_duration: z.number().int().min(1).max(10080).optional(),
  checklist: z.array(z.string().max(500)).optional(),
  variables: z.record(z.string(), z.string()).optional(),
})

const updateTemplateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  estimated_duration: z.number().int().min(1).max(10080).optional(),
  checklist: z.array(z.string().max(500)).optional(),
  variables: z.record(z.string(), z.string()).optional(),
})

const instantiateTemplateSchema = z.object({
  project_id: z.string().uuid().optional(),
  variables: z.record(z.string(), z.string()).optional(),
})

router.post(
  '/',
  validate(createTemplateSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId as string
      const workspaceId = req.workspaceId as string
      const template = await templateService.createTemplate({
        ...req.body,
        user_id: userId,
        workspace_id: workspaceId,
      })
      res.status(201).json(template)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to create template')
      res.status(status).json(body)
    }
  }
)

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId as string
    const workspaceId = req.workspaceId as string
    const templates = await templateService.listTemplates(userId, workspaceId)
    res.json(templates)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to list templates')
    res.status(status).json(body)
  }
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const userId = req.userId as string
    const workspaceId = req.workspaceId as string
    const template = await templateService.getTemplate(id, userId, workspaceId)
    res.json(template)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to get template')
    res.status(status).json(body)
  }
})

router.patch(
  '/:id',
  validate(updateTemplateSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string
      const userId = req.userId as string
      const workspaceId = req.workspaceId as string
      const template = await templateService.updateTemplate(
        id,
        userId,
        workspaceId,
        req.body
      )
      res.json(template)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to update template')
      res.status(status).json(body)
    }
  }
)

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const userId = req.userId as string
    const workspaceId = req.workspaceId as string
    await templateService.deleteTemplate(id, userId, workspaceId)
    res.status(204).send()
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to delete template')
    res.status(status).json(body)
  }
})

router.post(
  '/:id/instantiate',
  validate(instantiateTemplateSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string
      const userId = req.userId as string
      const workspaceId = req.workspaceId as string
      const task = await templateService.instantiateTemplate(
        id,
        userId,
        workspaceId,
        req.body
      )
      res.status(201).json(task)
    } catch (error) {
      const { status, body } = handleError(
        error,
        'Failed to instantiate template'
      )
      res.status(status).json(body)
    }
  }
)

export default router

import { Router } from 'express'
import { Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { validate, validateParams } from '../middleware/validation.js'
import {
  createLabelSchema,
  updateLabelSchema,
  uuidParamSchema,
} from '../validation/schemas.js'
import { handleError } from '../utils/errors.js'
import labelService from '../domains/labels/services/label.service.js'

const router = Router()

router.use(authenticateToken)

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId
    if (!workspaceId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const labels = await labelService.listLabels(workspaceId)
    res.json(labels)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to fetch labels')
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
      const label = await labelService.getLabelById(id, workspaceId)
      res.json(label)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to fetch label')
      res.status(status).json(body)
    }
  }
)

router.post(
  '/',
  validate(createLabelSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, color, project_id } = req.body
      const workspaceId = req.workspaceId
      if (!workspaceId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      const label = await labelService.createLabel(
        name,
        color,
        project_id,
        workspaceId
      )
      res.status(201).json(label)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to create label')
      res.status(status).json(body)
    }
  }
)

router.put(
  '/:id',
  validateParams(uuidParamSchema),
  validate(updateLabelSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string
      const { name, color, project_id } = req.body
      const workspaceId = req.workspaceId
      if (!workspaceId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      const label = await labelService.updateLabel(
        id,
        name,
        color,
        project_id,
        workspaceId
      )
      res.json(label)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to update label')
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
      await labelService.deleteLabel(id, workspaceId)
      res.status(204).send()
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to delete label')
      res.status(status).json(body)
    }
  }
)

export default router

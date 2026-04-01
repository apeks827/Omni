import { Router } from 'express'
import { Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { validate, validateParams } from '../middleware/validation.js'
import {
  createKeyResultSchema,
  updateKeyResultSchema,
  uuidParamSchema,
} from '../validation/schemas.js'
import { handleError } from '../utils/errors.js'
import goalService from '../domains/goals/services/goal.service.js'

const router = Router({ mergeParams: true })

router.use(authenticateToken)

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const goalId = req.params.goalId as string
    const keyResults = await goalService.listKeyResults(goalId)
    res.json(keyResults)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to fetch key results')
    res.status(status).json(body)
  }
})

router.post(
  '/',
  validate(createKeyResultSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const goalId = req.params.goalId as string
      const kr = await goalService.createKeyResult(goalId, req.body)
      res.status(201).json(kr)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to create key result')
      res.status(status).json(body)
    }
  }
)

router.get(
  '/:id',
  validateParams(uuidParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const kr = await goalService.getKeyResultById(id as string)
      res.json(kr)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to fetch key result')
      res.status(status).json(body)
    }
  }
)

router.patch(
  '/:id',
  validateParams(uuidParamSchema),
  validate(updateKeyResultSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const kr = await goalService.updateKeyResult(id as string, req.body)
      res.json(kr)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to update key result')
      res.status(status).json(body)
    }
  }
)

router.patch(
  '/:id/progress',
  validateParams(uuidParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const { current_value } = req.body

      if (current_value === undefined) {
        return res.status(400).json({ error: 'current_value is required' })
      }

      const kr = await goalService.updateKeyResultProgress(
        id as string,
        current_value
      )
      res.json(kr)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to update progress')
      res.status(status).json(body)
    }
  }
)

router.delete(
  '/:id',
  validateParams(uuidParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      await goalService.deleteKeyResult(id as string)
      res.json({ message: 'Key result deleted successfully', id })
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to delete key result')
      res.status(status).json(body)
    }
  }
)

export default router

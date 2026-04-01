import { Router } from 'express'
import { Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { validate, validateParams } from '../middleware/validation.js'
import {
  createGoalSchema,
  updateGoalSchema,
  uuidParamSchema,
} from '../validation/schemas.js'
import { handleError } from '../utils/errors.js'
import goalService from '../domains/goals/services/goal.service.js'

const router = Router()

router.use(authenticateToken)

router.get('/:id/tasks', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const tasks = await goalService.getGoalTasks(id as string)
    res.json(tasks)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to fetch goal tasks')
    res.status(status).json(body)
  }
})

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query
    const statusFilter = typeof status === 'string' ? status : undefined
    const goals = await goalService.listGoals(statusFilter)
    res.json(goals)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to fetch goals')
    res.status(status).json(body)
  }
})

router.get(
  '/:id',
  validateParams(uuidParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const goal = await goalService.getGoalById(id as string)
      res.json(goal)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to fetch goal')
      res.status(status).json(body)
    }
  }
)

router.post(
  '/',
  validate(createGoalSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const goal = await goalService.createGoal(req.body)
      res.status(201).json(goal)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to create goal')
      res.status(status).json(body)
    }
  }
)

router.patch(
  '/:id',
  validateParams(uuidParamSchema),
  validate(updateGoalSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const goal = await goalService.updateGoal(id as string, req.body)
      res.json(goal)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to update goal')
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
      await goalService.deleteGoal(id as string)
      res.json({ message: 'Goal deleted successfully', id })
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to delete goal')
      res.status(status).json(body)
    }
  }
)

export default router

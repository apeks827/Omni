import { Router, Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { validate } from '../middleware/validation.js'
import { handleError } from '../utils/errors.js'
import routineService from '../services/habits/routine.service.js'
import { z } from 'zod'

const router = Router()
router.use(authenticateToken)

const createRoutineSchema = z.object({
  name: z.string().min(1).max(255),
  time_window: z.enum(['morning', 'afternoon', 'evening']).optional(),
})

const updateRoutineSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  time_window: z.enum(['morning', 'afternoon', 'evening']).optional(),
})

const createStepSchema = z.object({
  order_index: z.number().int().min(0),
  name: z.string().min(1).max(255),
  duration_minutes: z.number().int().min(1).max(480),
})

const updateStepSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  duration_minutes: z.number().int().min(1).max(480).optional(),
  order_index: z.number().int().min(0).optional(),
})

const startRoutineSchema = z.object({
  scheduled_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
})

router.post(
  '/',
  validate(createRoutineSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId as string
      const routine = await routineService.createRoutine({
        ...req.body,
        user_id: userId,
      })
      res.status(201).json(routine)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to create routine')
      res.status(status).json(body)
    }
  }
)

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId as string
    const routines = await routineService.listRoutines(userId)
    res.json(routines)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to list routines')
    res.status(status).json(body)
  }
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const userId = req.userId as string
    const routine = await routineService.getRoutineWithSteps(id, userId)
    res.json(routine)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to get routine')
    res.status(status).json(body)
  }
})

router.patch(
  '/:id',
  validate(updateRoutineSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string
      const userId = req.userId as string
      const routine = await routineService.updateRoutine(id, userId, req.body)
      res.json(routine)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to update routine')
      res.status(status).json(body)
    }
  }
)

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const userId = req.userId as string
    await routineService.deleteRoutine(id, userId)
    res.status(204).send()
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to delete routine')
    res.status(status).json(body)
  }
})

router.post(
  '/:id/steps',
  validate(createStepSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const routineId = req.params.id as string
      const userId = req.userId as string
      const step = await routineService.addStep(routineId, userId, req.body)
      res.status(201).json(step)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to add step')
      res.status(status).json(body)
    }
  }
)

router.patch(
  '/:id/steps/:stepId',
  validate(updateStepSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const routineId = req.params.id as string
      const stepId = req.params.stepId as string
      const userId = req.userId as string
      const step = await routineService.updateStep(
        routineId,
        stepId,
        userId,
        req.body
      )
      res.json(step)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to update step')
      res.status(status).json(body)
    }
  }
)

router.delete('/:id/steps/:stepId', async (req: AuthRequest, res: Response) => {
  try {
    const routineId = req.params.id as string
    const stepId = req.params.stepId as string
    const userId = req.userId as string
    await routineService.removeStep(routineId, stepId, userId)
    res.status(204).send()
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to remove step')
    res.status(status).json(body)
  }
})

router.post(
  '/:id/start',
  validate(startRoutineSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const routineId = req.params.id as string
      const userId = req.userId as string
      const { scheduled_date } = req.body
      const result = await routineService.startRoutine(
        routineId,
        userId,
        scheduled_date
      )
      res.json(result)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to start routine')
      res.status(status).json(body)
    }
  }
)

router.post(
  '/:id/steps/:stepId/complete',
  async (req: AuthRequest, res: Response) => {
    try {
      const routineId = req.params.id as string
      const stepId = req.params.stepId as string
      const userId = req.userId as string
      const { scheduled_date } = req.body || {}
      const result = await routineService.completeStep(
        routineId,
        stepId,
        userId,
        scheduled_date
      )
      res.json(result)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to complete step')
      res.status(status).json(body)
    }
  }
)

router.get('/:id/progress', async (req: AuthRequest, res: Response) => {
  try {
    const routineId = req.params.id as string
    const userId = req.userId as string
    const { scheduled_date } = req.query
    const progress = await routineService.getRoutineProgress(
      routineId,
      userId,
      typeof scheduled_date === 'string' ? scheduled_date : undefined
    )
    res.json(progress)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to get progress')
    res.status(status).json(body)
  }
})

router.get('/:id/stats', async (req: AuthRequest, res: Response) => {
  try {
    const routineId = req.params.id as string
    const userId = req.userId as string
    const stats = await routineService.getRoutineStats(routineId, userId)
    res.json(stats)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to get routine stats')
    res.status(status).json(body)
  }
})

export default router

import { Router, Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { validate } from '../middleware/validation.js'
import { handleError } from '../utils/errors.js'
import habitService from '../services/habits/habit.service.js'
import { z } from 'zod'

const router = Router()
router.use(authenticateToken)

const createHabitSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  frequency_type: z.enum(['daily', 'weekly', 'custom']),
  frequency_value: z.string().max(100).optional(),
  preferred_time_start: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  preferred_time_end: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  duration_minutes: z.number().int().min(1).max(1440),
  energy_level: z.enum(['low', 'medium', 'high']).optional(),
})

const updateHabitSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  frequency_type: z.enum(['daily', 'weekly', 'custom']).optional(),
  frequency_value: z.string().max(100).optional(),
  preferred_time_start: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  preferred_time_end: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  duration_minutes: z.number().int().min(1).max(1440).optional(),
  energy_level: z.enum(['low', 'medium', 'high']).optional(),
})

const completeHabitSchema = z.object({
  note: z.string().max(500).optional(),
})

const skipHabitSchema = z.object({
  note: z.string().max(500).optional(),
})

router.post(
  '/',
  validate(createHabitSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId as string
      const habit = await habitService.createHabit({
        ...req.body,
        user_id: userId,
      })
      res.status(201).json(habit)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to create habit')
      res.status(status).json(body)
    }
  }
)

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId as string
    const habits = await habitService.listHabits(userId)
    res.json(habits)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to list habits')
    res.status(status).json(body)
  }
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const userId = req.userId as string
    const habit = await habitService.getHabit(id, userId)
    res.json(habit)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to get habit')
    res.status(status).json(body)
  }
})

router.patch(
  '/:id',
  validate(updateHabitSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string
      const userId = req.userId as string
      const habit = await habitService.updateHabit(id, userId, req.body)
      res.json(habit)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to update habit')
      res.status(status).json(body)
    }
  }
)

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const userId = req.userId as string
    await habitService.deleteHabit(id, userId)
    res.status(204).send()
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to delete habit')
    res.status(status).json(body)
  }
})

router.post(
  '/:id/complete',
  validate(completeHabitSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string
      const userId = req.userId as string
      const { note } = req.body
      const result = await habitService.completeHabit(id, userId, note)
      res.json(result)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to complete habit')
      res.status(status).json(body)
    }
  }
)

router.post(
  '/:id/skip',
  validate(skipHabitSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string
      const userId = req.userId as string
      const { note } = req.body
      const result = await habitService.skipHabit(id, userId, note)
      res.json(result)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to skip habit')
      res.status(status).json(body)
    }
  }
)

router.get('/:id/stats', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const userId = req.userId as string
    const stats = await habitService.getHabitStats(id, userId)
    res.json(stats)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to get habit stats')
    res.status(status).json(body)
  }
})

const scheduleQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

router.get('/schedule', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId as string
    const workspaceId = req.workspaceId as string

    if (!userId || !workspaceId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const parseResult = scheduleQuerySchema.safeParse(req.query)
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: parseResult.error.issues,
      })
    }

    const { date } = parseResult.data
    const schedulerService =
      await import('../services/habits/scheduler.service.js')
    const result = await schedulerService.default.scheduleHabitsAndRoutines(
      userId,
      workspaceId,
      date
    )

    res.json({
      date,
      ...result,
    })
  } catch (error) {
    const { status, body } = handleError(
      error,
      'Failed to schedule habits/routines'
    )
    res.status(status).json(body)
  }
})

export default router

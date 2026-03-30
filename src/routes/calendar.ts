import { Router, Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import calendarService from '../domains/calendar/services/CalendarService.js'
import { handleError } from '../utils/errors.js'

const router = Router()

router.use(authenticateToken)

router.get('/day', async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.query
    const userId = req.userId as string
    const workspaceId = req.workspaceId as string

    if (!date || typeof date !== 'string') {
      return res
        .status(400)
        .json({ error: 'date parameter required (YYYY-MM-DD)' })
    }

    if (!userId || !workspaceId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const schedule = await calendarService.getDaySchedule(
      userId,
      workspaceId,
      date
    )

    res.json(schedule)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to fetch day calendar')
    res.status(status).json(body)
  }
})

router.get('/week', async (req: AuthRequest, res: Response) => {
  try {
    const { start_date } = req.query
    const userId = req.userId as string
    const workspaceId = req.workspaceId as string

    if (!start_date || typeof start_date !== 'string') {
      return res
        .status(400)
        .json({ error: 'start_date parameter required (YYYY-MM-DD)' })
    }

    const schedule = await calendarService.getWeekSchedule(
      userId,
      workspaceId,
      start_date
    )

    res.json(schedule)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to fetch week calendar')
    res.status(status).json(body)
  }
})

router.patch('/slots/:slotId', async (req: AuthRequest, res: Response) => {
  try {
    const slotId = req.params.slotId as string
    const { task_id, new_start_time } = req.body
    const userId = req.userId as string
    const workspaceId = req.workspaceId as string

    const result = await calendarService.updateSlot(
      userId,
      workspaceId,
      slotId,
      task_id as string | undefined,
      new_start_time as string | undefined
    )

    res.json(result)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to update slot')
    res.status(status).json(body)
  }
})

router.patch(
  '/users/me/preferences',
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId as string
      const workspaceId = req.workspaceId as string
      const { low_energy_mode, energy_pattern } = req.body

      const result = await calendarService.updateUserPreferences(
        userId,
        workspaceId,
        { low_energy_mode, energy_pattern }
      )

      res.json(result)
    } catch (error) {
      const { status, body } = handleError(
        error,
        'Failed to update preferences'
      )
      res.status(status).json(body)
    }
  }
)

export default router

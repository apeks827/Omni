import { Router, Response } from 'express'
import { authenticateToken, AuthRequest } from '../../../middleware/auth.js'
import { handleError } from '../../../utils/errors.js'
import analyticsService from '../services/AnalyticsService.js'

const router = Router()

router.use(authenticateToken)

router.get('/analytics', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const userId = req.userId as string
    const start_date = req.query.start_date as string
    const end_date = req.query.end_date as string
    const group_by = req.query.group_by as string | undefined

    if (!start_date || !end_date) {
      res.status(400).json({
        code: 'validation_error',
        message: 'start_date and end_date are required',
        details: {},
      })
      return
    }

    const analytics = await analyticsService.getAnalytics(
      workspaceId,
      userId,
      new Date(start_date),
      new Date(end_date),
      (group_by as 'task' | 'day' | 'week' | 'project') || 'task'
    )

    res.json(analytics)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to fetch analytics')
    res.status(status).json(body)
  }
})

router.get('/daily', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const userId = req.userId as string
    const date = req.query.date as string | undefined

    const targetDate = date ? new Date(date) : new Date()
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    const analytics = await analyticsService.getAnalytics(
      workspaceId,
      userId,
      startOfDay,
      endOfDay,
      'day'
    )

    res.json({
      success: true,
      date: targetDate.toISOString().split('T')[0],
      ...analytics,
    })
  } catch (error) {
    const { status, body } = handleError(
      error,
      'Failed to fetch daily analytics'
    )
    res.status(status).json(body)
  }
})

router.get('/by-task', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const userId = req.userId as string
    const task_id = req.query.task_id as string | undefined
    const start_date = req.query.start_date as string
    const end_date = req.query.end_date as string

    if (!start_date || !end_date) {
      res.status(400).json({
        code: 'validation_error',
        message: 'start_date and end_date are required',
        details: {},
      })
      return
    }

    const analytics = await analyticsService.getByTask(
      workspaceId,
      userId,
      task_id,
      new Date(start_date),
      new Date(end_date)
    )

    res.json({
      success: true,
      ...analytics,
    })
  } catch (error) {
    const { status, body } = handleError(
      error,
      'Failed to fetch analytics by task'
    )
    res.status(status).json(body)
  }
})

router.get('/export', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const userId = req.userId as string
    const start_date = req.query.start_date as string
    const end_date = req.query.end_date as string
    const format = (req.query.format as string) || 'json'

    if (!start_date || !end_date) {
      res.status(400).json({
        code: 'validation_error',
        message: 'start_date and end_date are required',
        details: {},
      })
      return
    }

    const data = await analyticsService.exportData(
      workspaceId,
      userId,
      new Date(start_date),
      new Date(end_date),
      format as 'csv' | 'json'
    )

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="time-entries.csv"'
      )
      res.send(data)
      return
    }

    res.json(data)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to export data')
    res.status(status).json(body)
  }
})

export default router

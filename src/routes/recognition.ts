import { Router, Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { handleError } from '../utils/errors.js'
import recognitionService from '../services/recognition/recognition.service.js'

const router = Router()

router.use(authenticateToken)

router.get('/leaderboard', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const weekParam = String(req.query.week || '')
    const yearParam = String(req.query.year || '')
    const week = weekParam ? parseInt(weekParam) : undefined
    const year = yearParam ? parseInt(yearParam) : undefined

    const leaderboard = await recognitionService.getWeeklyLeaderboard(
      workspaceId,
      week,
      year
    )
    res.json(leaderboard)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to fetch leaderboard')
    res.status(status).json(body)
  }
})

router.get('/agent/:agentId/stats', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const { agentId } = req.params
    const weeksParam = String(req.query.weeks || '4')
    const weeks = parseInt(weeksParam) || 4

    const stats = await recognitionService.getAgentStats(
      agentId,
      workspaceId,
      weeks
    )
    res.json(stats)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to fetch agent stats')
    res.status(status).json(body)
  }
})

router.get('/recent', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const limitParam = String(req.query.limit || '10')
    const limit = parseInt(limitParam) || 10

    const recognitions = await recognitionService.getRecentRecognitions(
      workspaceId,
      limit
    )
    res.json(recognitions)
  } catch (error) {
    const { status, body } = handleError(
      error,
      'Failed to fetch recent recognitions'
    )
    res.status(status).json(body)
  }
})

router.post('/track/velocity', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const { agentId, taskId, completionTimeHours } = req.body

    if (!agentId || completionTimeHours === undefined) {
      res
        .status(400)
        .json({ error: 'agentId and completionTimeHours are required' })
      return
    }

    const recognition = await recognitionService.trackVelocityBonus(
      agentId,
      workspaceId,
      taskId,
      completionTimeHours
    )
    res.json(recognition)
  } catch (error) {
    const { status, body } = handleError(
      error,
      'Failed to track velocity bonus'
    )
    res.status(status).json(body)
  }
})

router.post('/track/quality', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const { agentId, approvedWithoutRevise } = req.body

    if (!agentId || approvedWithoutRevise === undefined) {
      res
        .status(400)
        .json({ error: 'agentId and approvedWithoutRevise are required' })
      return
    }

    const recognition = await recognitionService.trackQualityChampion(
      agentId,
      workspaceId,
      approvedWithoutRevise
    )
    res.json(recognition)
  } catch (error) {
    const { status, body } = handleError(
      error,
      'Failed to track quality champion'
    )
    res.status(status).json(body)
  }
})

router.post('/track/impact', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const { agentId, taskId, bugFixesCount } = req.body

    if (!agentId || bugFixesCount === undefined) {
      res.status(400).json({ error: 'agentId and bugFixesCount are required' })
      return
    }

    const recognition = await recognitionService.trackImpactMultiplier(
      agentId,
      workspaceId,
      taskId,
      bugFixesCount
    )
    res.json(recognition)
  } catch (error) {
    const { status, body } = handleError(
      error,
      'Failed to track impact multiplier'
    )
    res.status(status).json(body)
  }
})

router.post('/weekly', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string

    const result = await recognitionService.runWeeklyRecognition(workspaceId)
    res.json(result)
  } catch (error) {
    const { status, body } = handleError(
      error,
      'Failed to run weekly recognition'
    )
    res.status(status).json(body)
  }
})

export default router

import { Router } from 'express'
import { Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { handleError } from '../utils/errors.js'
import metricsService from '../services/metrics/MetricsService.js'

const router = Router()

router.use(authenticateToken)

router.get('/kpi', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const { period } = req.query
    const periodStr = typeof period === 'string' ? period : '7d'

    const kpis = await metricsService.calculateKPIs(workspaceId, periodStr)
    res.json(kpis)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to fetch KPIs')
    res.status(status).json(body)
  }
})

router.get('/trends', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const { period } = req.query
    const periodStr = typeof period === 'string' ? period : '30d'

    const trends = await metricsService.getTrends(workspaceId, periodStr)
    res.json(trends)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to fetch trends')
    res.status(status).json(body)
  }
})

router.get('/breakdown', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const { by, period } = req.query
    const byStr = typeof by === 'string' ? by : 'agent'
    const periodStr = typeof period === 'string' ? period : '7d'

    const breakdown = await metricsService.getBreakdown(
      workspaceId,
      byStr,
      periodStr
    )
    res.json(breakdown)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to fetch breakdown')
    res.status(status).json(body)
  }
})

export default router

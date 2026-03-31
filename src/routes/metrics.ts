import { Router } from 'express'
import { Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { handleError } from '../utils/errors.js'
import metricsService from '../services/metrics/MetricsService.js'
import {
  getResponseTimeStats,
  getEndpointBreakdown,
} from '../middleware/responseTime.js'
import { cacheService } from '../services/cache/CacheService.js'

const router = Router()

router.use(authenticateToken)

router.get('/cache', async (req: AuthRequest, res: Response) => {
  try {
    const stats = cacheService.getStats()
    res.json(stats)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to fetch cache stats')
    res.status(status).json(body)
  }
})

router.post('/cache/clear', async (req: AuthRequest, res: Response) => {
  try {
    cacheService.clear()
    res.json({ success: true, message: 'Cache cleared' })
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to clear cache')
    res.status(status).json(body)
  }
})

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

router.get('/response-time', async (req: AuthRequest, res: Response) => {
  try {
    const { endpoint, period } = req.query
    const endpointStr = typeof endpoint === 'string' ? endpoint : undefined

    const periodMatch =
      typeof period === 'string' ? period.match(/^(\d+)([hd])$/) : null
    let since: Date | undefined
    if (periodMatch) {
      const num = parseInt(periodMatch[1])
      const unit = periodMatch[2]
      const ms = unit === 'h' ? num * 60 * 60 * 1000 : num * 24 * 60 * 60 * 1000
      since = new Date(Date.now() - ms)
    }

    const stats = await getResponseTimeStats(endpointStr, since)
    res.json(stats)
  } catch (error) {
    const { status, body } = handleError(
      error,
      'Failed to fetch response time stats'
    )
    res.status(status).json(body)
  }
})

router.get(
  '/response-time/breakdown',
  async (req: AuthRequest, res: Response) => {
    try {
      const { period } = req.query

      const periodMatch =
        typeof period === 'string' ? period.match(/^(\d+)([hd])$/) : null
      let since: Date | undefined
      if (periodMatch) {
        const num = parseInt(periodMatch[1])
        const unit = periodMatch[2]
        const ms =
          unit === 'h' ? num * 60 * 60 * 1000 : num * 24 * 60 * 60 * 1000
        since = new Date(Date.now() - ms)
      }

      const breakdown = await getEndpointBreakdown(since)
      res.json(breakdown)
    } catch (error) {
      const { status, body } = handleError(
        error,
        'Failed to fetch endpoint breakdown'
      )
      res.status(status).json(body)
    }
  }
)

export default router

import { Router, Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { quotaMiddleware } from '../middleware/rateLimitAdvanced.js'
import { handleError } from '../utils/errors.js'
import quotaService from '../domains/quota/services/quota.service.js'

const router = Router()

router.get(
  '/usage',
  authenticateToken,
  quotaMiddleware({ daily: 1000, weekly: 5000, monthly: 20000 }),
  async (req: AuthRequest, res: Response) => {
    try {
      const usage = await quotaService.getUsage(req.userId as string)
      res.json(usage)
    } catch (error) {
      console.error('Error fetching usage:', error)
      res.status(500).json({ error: 'Failed to fetch usage data' })
    }
  }
)

router.get(
  '/limits',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const limits = await quotaService.getLimits(req.userId as string)
      res.json(limits)
    } catch (error) {
      console.error('Error fetching limits:', error)
      res.status(500).json({ error: 'Failed to fetch limits' })
    }
  }
)

router.put(
  '/limits',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const { daily, weekly, monthly } = req.body

      if (!daily && !weekly && !monthly) {
        return res
          .status(400)
          .json({ error: 'At least one quota limit is required' })
      }

      if (daily && (typeof daily !== 'number' || daily < 1 || daily > 100000)) {
        return res
          .status(400)
          .json({ error: 'Daily quota must be between 1 and 100000' })
      }
      if (
        weekly &&
        (typeof weekly !== 'number' || weekly < 1 || weekly > 500000)
      ) {
        return res
          .status(400)
          .json({ error: 'Weekly quota must be between 1 and 500000' })
      }
      if (
        monthly &&
        (typeof monthly !== 'number' || monthly < 1 || monthly > 2000000)
      ) {
        return res
          .status(400)
          .json({ error: 'Monthly quota must be between 1 and 2000000' })
      }

      const result = await quotaService.updateLimits(req.userId as string, {
        daily,
        weekly,
        monthly,
      })

      res.json({
        message: 'Quotas updated successfully',
        limits: result.limits,
      })
    } catch (error) {
      console.error('Error updating limits:', error)
      res.status(500).json({ error: 'Failed to update limits' })
    }
  }
)

export default router

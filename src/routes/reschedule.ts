import { Router } from 'express'
import { z } from 'zod'
import rescheduleService from '../services/scheduling/reschedule.service.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'

const router = Router()

const rescheduleResponseSchema = z.object({
  reschedule_id: z.string().uuid(),
  response: z.enum(['accepted', 'rejected', 'manual']),
})

router.post(
  '/reschedule-response',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const parsed = rescheduleResponseSchema.safeParse(req.body)
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Invalid request body',
          details: parsed.error.issues,
        })
      }

      const { reschedule_id, response } = parsed.data
      const userId = req.userId!

      const success = await rescheduleService.handleUserResponse(
        reschedule_id,
        userId,
        response
      )

      if (!success) {
        return res.status(404).json({
          error: 'Reschedule record not found',
        })
      }

      return res.json({
        success: true,
        response,
        message:
          response === 'accepted'
            ? 'Reschedule confirmed'
            : response === 'rejected'
              ? 'Task returned to pending'
              : 'Opening manual scheduling',
      })
    } catch (error) {
      console.error('Error handling reschedule response:', error)
      return res.status(500).json({
        error: 'Internal server error',
      })
    }
  }
)

router.get(
  '/reschedule-history',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!
      const days = parseInt(req.query.days as string) || 30
      const limit = parseInt(req.query.limit as string) || 50

      const history = await rescheduleService.getHistory(userId, days, limit)
      const acceptanceRate = await rescheduleService.getAcceptanceRate(
        userId,
        days
      )

      return res.json({
        history,
        acceptance_rate: acceptanceRate,
      })
    } catch (error) {
      console.error('Error fetching reschedule history:', error)
      return res.status(500).json({
        error: 'Internal server error',
      })
    }
  }
)

router.get(
  '/pending-reschedules',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!

      const pending_reschedules =
        await rescheduleService.getPendingReschedules(userId)

      return res.json({
        pending_reschedules,
      })
    } catch (error) {
      console.error('Error fetching pending reschedules:', error)
      return res.status(500).json({
        error: 'Internal server error',
      })
    }
  }
)

export default router

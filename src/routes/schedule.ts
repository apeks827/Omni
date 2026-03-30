import { Router, Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { handleError, AppError, ErrorCodes } from '../utils/errors.js'
import scheduleService from '../domains/schedule/services/schedule.service.js'

const router = Router()

router.use(authenticateToken)

router.post('/generate', async (req: AuthRequest, res: Response) => {
  try {
    const { task_id } = req.body
    const userId = req.userId as string
    const workspaceId = req.workspaceId as string

    if (!task_id) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'task_id is required',
        {},
        400
      )
    }

    const result = await scheduleService.scheduleTask({
      taskId: task_id,
      userId,
      workspaceId,
    })

    res.json(result)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to generate schedule')
    res.status(status).json(body)
  }
})

router.get('/explain/:taskId', async (req: AuthRequest, res: Response) => {
  try {
    const taskId = req.params.taskId as string
    const userId = req.userId as string
    const workspaceId = req.workspaceId as string

    const scheduleResult = await scheduleService.scheduleTask({
      taskId,
      userId,
      workspaceId,
    })

    const explanation = {
      task_id: taskId,
      task_title: scheduleResult.suggested_slot,
      suggested_slot: scheduleResult.suggested_slot,
      reasoning: scheduleResult.reasoning,
      factors: {
        priority: scheduleResult.suggested_slot.confidence,
        energy_alignment: scheduleResult.suggested_slot.energy_score,
        confidence: scheduleResult.suggested_slot.confidence,
      },
      alternative_slots: scheduleResult.alternative_slots,
    }

    res.json(explanation)
  } catch (error) {
    const { status, body } = handleError(
      error,
      'Failed to explain scheduling decision'
    )
    res.status(status).json(body)
  }
})

export default router

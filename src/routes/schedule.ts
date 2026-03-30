import { Router, Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { scheduleTask } from '../services/scheduling/scheduler.js'
import { handleError, AppError, ErrorCodes } from '../utils/errors.js'
import { query } from '../config/database.js'

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

    const result = await scheduleTask({
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

    const taskResult = await query(
      'SELECT id, title, priority, due_date, estimated_duration FROM tasks WHERE id = $1 AND workspace_id = $2',
      [taskId, workspaceId]
    )

    if (taskResult.rows.length === 0) {
      throw new AppError(
        ErrorCodes.TASK_NOT_FOUND,
        'Task not found',
        { task_id: taskId },
        404
      )
    }

    const task = taskResult.rows[0]

    const scheduleResult = await scheduleTask({
      taskId,
      userId,
      workspaceId,
    })

    const explanation = {
      task_id: taskId,
      task_title: task.title,
      suggested_slot: scheduleResult.suggested_slot,
      reasoning: scheduleResult.reasoning,
      factors: {
        priority: task.priority,
        due_date: task.due_date,
        estimated_duration: task.estimated_duration,
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

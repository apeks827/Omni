import { Router, Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { handleError, AppError, ErrorCodes } from '../utils/errors.js'
import scheduleService from '../domains/schedule/services/schedule.service.js'
import { queueProcessor } from '../services/scheduling/queue-processor.js'

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

router.post('/queue/add', async (req: AuthRequest, res: Response) => {
  try {
    const { task_id, priority, due_date, estimated_duration } = req.body
    const userId = req.userId as string
    const workspaceId = req.workspaceId as string

    if (!task_id || !priority) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'task_id and priority are required',
        {},
        400
      )
    }

    const validPriorities = ['low', 'medium', 'high', 'critical']
    if (!validPriorities.includes(priority)) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'priority must be one of: low, medium, high, critical',
        {},
        400
      )
    }

    const result = await queueProcessor.addToQueue(
      task_id,
      userId,
      workspaceId,
      priority,
      due_date,
      estimated_duration
    )

    if (!result.success) {
      res.status(400).json({ error: result.message })
      return
    }

    res.json({
      success: true,
      position: result.position,
      message: `Task added to scheduling queue at position ${result.position}`,
    })
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to add to queue')
    res.status(status).json(body)
  }
})

router.delete('/queue/:taskId', async (req: AuthRequest, res: Response) => {
  try {
    const taskId = req.params.taskId as string
    const userId = req.userId as string

    const result = await queueProcessor.removeFromQueue(taskId, userId)

    if (!result.success) {
      res.status(404).json({ error: result.message })
      return
    }

    res.json({ success: true, message: 'Task removed from queue' })
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to remove from queue')
    res.status(status).json(body)
  }
})

router.patch('/queue/:taskId', async (req: AuthRequest, res: Response) => {
  try {
    const taskId = req.params.taskId as string
    const { priority } = req.body
    const userId = req.userId as string

    if (!priority) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'priority is required',
        {},
        400
      )
    }

    const validPriorities = ['low', 'medium', 'high', 'critical']
    if (!validPriorities.includes(priority)) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'priority must be one of: low, medium, high, critical',
        {},
        400
      )
    }

    const result = await queueProcessor.reprioritize(taskId, userId, priority)

    if (!result.success) {
      res.status(404).json({ error: result.message })
      return
    }

    res.json({ success: true, message: `Task priority updated to ${priority}` })
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to update priority')
    res.status(status).json(body)
  }
})

router.get('/queue', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId as string
    const status = queueProcessor.getQueueStatus(userId)

    res.json({
      queue: status.queue.map(task => ({
        task_id: task.taskId,
        priority: task.priority,
        due_date: task.dueDate,
        estimated_duration: task.estimatedDuration,
        score: task.score,
        added_at: task.addedAt,
      })),
      stats: status.stats,
      is_processing: status.isProcessing,
    })
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to get queue status')
    res.status(status).json(body)
  }
})

router.post('/queue/process', async (req: AuthRequest, res: Response) => {
  try {
    const { limit } = req.body
    const userId = req.userId as string

    const result = await queueProcessor.processQueue(userId, limit || 10)

    res.json({
      results: result.results,
      stats: result.stats,
    })
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to process queue')
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

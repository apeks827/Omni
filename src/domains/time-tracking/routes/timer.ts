import { Router, Response } from 'express'
import { authenticateToken, AuthRequest } from '../../../middleware/auth.js'
import { handleError } from '../../../utils/errors.js'
import timerService from '../services/TimerService.js'

const router = Router()

router.use(authenticateToken)

router.post('/start', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const userId = req.userId as string
    const { task_id, pomodoro_type } = req.body

    if (!task_id) {
      res.status(400).json({
        code: 'validation_error',
        message: 'task_id is required',
        details: {},
      })
      return
    }

    const timer = await timerService.startTimer({
      task_id,
      workspace_id: workspaceId,
      user_id: userId,
      pomodoro_type,
    })

    res.json({
      session_id: timer.id,
      task_id: timer.task_id,
      status: timer.status,
      start_time: timer.start_time,
      elapsed_seconds: timer.elapsed_seconds,
    })
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to start timer')
    res.status(status).json(body)
  }
})

router.post('/pause', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const userId = req.userId as string

    const timer = await timerService.pauseTimer(userId, workspaceId)

    res.json({
      session_id: timer.id,
      task_id: timer.task_id,
      status: timer.status,
      elapsed_seconds: timer.elapsed_seconds,
    })
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to pause timer')
    res.status(status).json(body)
  }
})

router.post('/resume', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const userId = req.userId as string

    const timer = await timerService.resumeTimer(userId, workspaceId)

    res.json({
      session_id: timer.id,
      task_id: timer.task_id,
      status: timer.status,
      start_time: timer.start_time,
      elapsed_seconds: timer.elapsed_seconds,
    })
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to resume timer')
    res.status(status).json(body)
  }
})

router.post('/stop', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const userId = req.userId as string
    const { description } = req.body

    const result = await timerService.stopTimer(
      userId,
      workspaceId,
      description
    )

    res.json({
      time_entry_id: result.time_entry_id,
      duration_seconds: result.duration_seconds,
    })
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to stop timer')
    res.status(status).json(body)
  }
})

router.get('/status', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const userId = req.userId as string

    const timer = await timerService.getTimerStatus(userId, workspaceId)

    if (!timer) {
      res.json({
        status: 'idle',
        task_id: null,
        session_id: null,
        elapsed_seconds: 0,
      })
      return
    }

    let elapsedSeconds = timer.elapsed_seconds
    if (timer.status === 'running') {
      const elapsedSinceStart = Math.floor(
        (Date.now() - new Date(timer.start_time).getTime()) / 1000
      )
      elapsedSeconds += elapsedSinceStart
    }

    res.json({
      session_id: timer.id,
      task_id: timer.task_id,
      status: timer.status,
      start_time: timer.start_time,
      elapsed_seconds: elapsedSeconds,
      pomodoro_type: timer.pomodoro_type,
      pomodoro_work_count: timer.pomodoro_work_count,
    })
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to get timer status')
    res.status(status).json(body)
  }
})

export default router

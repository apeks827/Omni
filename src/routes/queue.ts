import { Router, Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import queueService from '../services/queue/queue.service.js'

const router = Router()

router.use(authenticateToken)

router.get('/next', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId
    const userId = req.userId
    const { role, capabilities } = req.query

    const nextTask = await queueService.getNextTask({
      workspace_id: workspaceId as string,
      agent_id: userId,
      role: role as string,
      capabilities: capabilities
        ? (capabilities as string).split(',')
        : undefined,
    })

    if (!nextTask) {
      return res.status(404).json({ message: 'No tasks available in queue' })
    }

    res.json(nextTask)
  } catch (error) {
    console.error('Error fetching next task:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/claim/:taskId', async (req: AuthRequest, res: Response) => {
  try {
    const taskId = req.params.taskId as string
    const workspaceId = req.workspaceId
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const claimedTask = await queueService.claimTask(
      taskId,
      userId,
      workspaceId as string
    )

    res.json(claimedTask)
  } catch (error: any) {
    if (error.message === 'Task not available for claiming') {
      return res.status(409).json({ error: error.message })
    }
    console.error('Error claiming task:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/auto-assign', async (req: AuthRequest, res: Response) => {
  try {
    const { completedTaskId } = req.body
    const workspaceId = req.workspaceId
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const nextTask = await queueService.autoAssignNext(
      completedTaskId as string,
      userId,
      workspaceId as string
    )

    if (!nextTask) {
      return res
        .status(404)
        .json({ message: 'No tasks available for auto-assignment' })
    }

    res.json(nextTask)
  } catch (error) {
    console.error('Error auto-assigning task:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId

    const stats = await queueService.getQueueStats(workspaceId as string)

    res.json(stats)
  } catch (error) {
    console.error('Error fetching queue stats:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

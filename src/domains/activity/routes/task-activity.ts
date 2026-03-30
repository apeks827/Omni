import { Router, Response } from 'express'
import { authenticateToken, AuthRequest } from '../../../middleware/auth.js'
import { handleError } from '../../../utils/errors.js'
import activityService from '../services/ActivityService.js'

const router = Router()

router.use(authenticateToken)

router.get('/:taskId/activity', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const taskId = req.params.taskId
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50

    const result = await activityService.getTaskActivity(
      taskId as string,
      workspaceId,
      limit
    )
    res.json(result)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to fetch task activity')
    res.status(status).json(body)
  }
})

export default router

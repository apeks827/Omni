import { Router } from 'express'
import { Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { handleError } from '../utils/errors.js'
import taskActivityService from '../domains/activity/services/TaskActivityService.js'

const router = Router()

router.use(authenticateToken)

router.get(
  '/workspaces/:workspaceId/activities',
  async (req: AuthRequest, res: Response) => {
    try {
      const workspaceId = req.params.workspaceId as string
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 100)
      const offset = parseInt(req.query.offset as string) || 0
      const actionType = req.query.action_type as string | undefined

      const result = await taskActivityService.getWorkspaceActivities(
        workspaceId,
        limit,
        offset,
        actionType
      )

      res.json(result)
    } catch (error) {
      const { status, body } = handleError(
        error,
        'Failed to fetch workspace activities'
      )
      res.status(status).json(body)
    }
  }
)

router.get(
  '/tasks/:taskId/activities',
  async (req: AuthRequest, res: Response) => {
    try {
      const taskId = req.params.taskId as string
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100)
      const offset = parseInt(req.query.offset as string) || 0

      const result = await taskActivityService.getTaskActivities(
        taskId,
        limit,
        offset
      )

      res.json(result)
    } catch (error) {
      const { status, body } = handleError(
        error,
        'Failed to fetch task activities'
      )
      res.status(status).json(body)
    }
  }
)

router.get(
  '/users/:userId/activities',
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.params.userId as string
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100)
      const offset = parseInt(req.query.offset as string) || 0

      const result = await taskActivityService.getUserActivities(
        userId,
        limit,
        offset
      )

      res.json(result)
    } catch (error) {
      const { status, body } = handleError(
        error,
        'Failed to fetch user activities'
      )
      res.status(status).json(body)
    }
  }
)

export default router

import { Router } from 'express'
import { Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { validate, validateParams } from '../middleware/validation.js'
import { uuidParamSchema, linkTaskToGoalSchema } from '../validation/schemas.js'
import { handleError } from '../utils/errors.js'
import goalService from '../domains/goals/services/goal.service.js'

const router = Router({ mergeParams: true })

router.use(authenticateToken)

router.post(
  '/:taskId/link-goal',
  validateParams(uuidParamSchema),
  validate(linkTaskToGoalSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { taskId } = req.params
      const { goal_id, key_result_id } = req.body

      const link = await goalService.linkTaskToGoal(
        taskId as string,
        goal_id,
        key_result_id
      )

      res.status(201).json({
        message: 'Task linked to goal',
        ...link,
      })
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to link task to goal')
      res.status(status).json(body)
    }
  }
)

router.delete(
  '/:taskId/link-goal',
  validateParams(uuidParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { taskId } = req.params
      const { goal_id } = req.query

      if (!goal_id || typeof goal_id !== 'string') {
        return res.status(400).json({ error: 'goal_id is required' })
      }

      await goalService.unlinkTaskFromGoal(taskId as string, goal_id)

      res.json({ message: 'Task unlinked from goal', task_id: taskId, goal_id })
    } catch (error) {
      const { status, body } = handleError(
        error,
        'Failed to unlink task from goal'
      )
      res.status(status).json(body)
    }
  }
)

router.get(
  '/:taskId/goals',
  validateParams(uuidParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { taskId } = req.params
      const links = await goalService.getTaskGoalLinks(taskId as string)
      res.json(links)
    } catch (error) {
      const { status, body } = handleError(
        error,
        'Failed to fetch task goal links'
      )
      res.status(status).json(body)
    }
  }
)

export default router

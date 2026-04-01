import { Router, Response } from 'express'
import { authenticateToken, AuthRequest } from '../../../middleware/auth.js'
import { handleError } from '../../../utils/errors.js'
import activityService from '../services/ActivityService.js'
import {
  ActivityFeedFilters,
  EntityType,
  ActivityEventType,
  ActionType,
} from '../../../../shared/types/activity.js'

const router = Router()

router.use(authenticateToken)

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const {
      entity_type,
      entity_id,
      event_type,
      user_id,
      action,
      start_date,
      end_date,
      limit,
      cursor,
      include_metadata,
    } = req.query

    const filters: ActivityFeedFilters = {
      entity_type: entity_type
        ? ((entity_type as string).split(',') as EntityType[])
        : undefined,
      entity_id: entity_id as string | undefined,
      event_type: event_type
        ? ((event_type as string).split(',') as ActivityEventType[])
        : undefined,
      user_id: user_id ? (user_id as string).split(',') : undefined,
      action: action
        ? ((action as string).split(',') as ActionType[])
        : undefined,
      start_date: start_date ? new Date(start_date as string) : undefined,
      end_date: end_date ? new Date(end_date as string) : undefined,
      limit: limit ? parseInt(limit as string) : 50,
      cursor: cursor as string | undefined,
      include_metadata: include_metadata === 'false' ? false : true,
    }

    const result = await activityService.getFeed(workspaceId, filters)
    res.json(result)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to fetch activity feed')
    res.status(status).json(body)
  }
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const id = req.params.id

    const event = await activityService.getEventById(id as string, workspaceId)
    if (!event) {
      return res.status(404).json({ error: 'Activity event not found' })
    }

    res.json(event)
  } catch (error) {
    const { status, body } = handleError(
      error,
      'Failed to fetch activity event'
    )
    res.status(status).json(body)
  }
})

export default router

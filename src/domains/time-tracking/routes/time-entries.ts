import { Router, Response } from 'express'
import { authenticateToken, AuthRequest } from '../../../middleware/auth.js'
import { handleError } from '../../../utils/errors.js'
import timeEntryService from '../services/TimeEntryService.js'

const router = Router()

router.use(authenticateToken)

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const userId = req.userId as string
    const {
      task_id,
      start_time,
      end_time,
      duration_seconds,
      type,
      description,
    } = req.body

    const entry = await timeEntryService.createEntry({
      task_id,
      workspace_id: workspaceId,
      user_id: userId,
      start_time: new Date(start_time),
      end_time: end_time ? new Date(end_time) : undefined,
      duration_seconds,
      type: type || 'manual',
      description,
      source: 'api',
    })

    res.status(201).json(entry)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to create time entry')
    res.status(status).json(body)
  }
})

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const userId = req.userId as string
    const task_id = req.query.task_id as string | undefined
    const start_date = req.query.start_date as string | undefined
    const end_date = req.query.end_date as string | undefined
    const type = req.query.type as string | undefined
    const limit = req.query.limit as string | undefined
    const offset = req.query.offset as string | undefined

    const result = await timeEntryService.listEntries(workspaceId, userId, {
      task_id,
      start_date: start_date ? new Date(start_date) : undefined,
      end_date: end_date ? new Date(end_date) : undefined,
      type,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    })

    res.json(result)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to fetch time entries')
    res.status(status).json(body)
  }
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const userId = req.userId as string
    const id = req.params.id as string

    const entry = await timeEntryService.getEntry(id, workspaceId, userId)
    res.json(entry)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to fetch time entry')
    res.status(status).json(body)
  }
})

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const userId = req.userId as string
    const id = req.params.id as string
    const { start_time, end_time, duration_seconds, description, notes } = req.body

    const entry = await timeEntryService.updateEntry(id, workspaceId, userId, {
      start_time: start_time ? new Date(start_time) : undefined,
      end_time: end_time ? new Date(end_time) : undefined,
      duration_seconds,
      description: notes || description,
    })

    res.json(entry)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to update time entry')
    res.status(status).json(body)
  }
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const userId = req.userId as string
    const id = req.params.id as string

    await timeEntryService.deleteEntry(id, workspaceId, userId)
    res.status(204).send()
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to delete time entry')
    res.status(status).json(body)
  }
})

export default router

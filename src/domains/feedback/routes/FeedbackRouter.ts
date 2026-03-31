import { Router, Response } from 'express'
import { authenticateToken, AuthRequest } from '../../../middleware/auth.js'
import { handleError, AppError, ErrorCodes } from '../../../utils/errors.js'
import feedbackService from '../services/FeedbackService.js'

const router = Router()

router.use(authenticateToken)

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const userId = req.userId as string

    const {
      category,
      description,
      severity,
      repro_steps,
      page,
      session_id,
      app_version,
      environment,
      contact_permission,
    } = req.body as {
      category?: string
      description?: string
      severity?: string
      repro_steps?: string
      page?: string
      session_id?: string
      app_version?: string
      environment?: Record<string, string>
      contact_permission?: boolean
    }

    if (!category) {
      const err = new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Category is required (bug, confusion, or feature_request)',
        {},
        400
      )
      const { status, body } = handleError(err)
      return res.status(status).json(body)
    }

    if (!description) {
      const err = new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Description is required',
        {},
        400
      )
      const { status, body } = handleError(err)
      return res.status(status).json(body)
    }

    const result = await feedbackService.submitFeedback({
      workspace_id: workspaceId,
      user_id: userId,
      category: category as 'bug' | 'confusion' | 'feature_request',
      description,
      severity: severity as 'low' | 'medium' | 'high' | undefined,
      repro_steps,
      page,
      session_id,
      app_version,
      environment,
      contact_permission,
    })

    res.status(201).json(result)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to submit feedback')
    res.status(status).json(body)
  }
})

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string

    const category = req.query.category as string | undefined
    const severity = req.query.severity as string | undefined
    const status = req.query.status as string | undefined
    const start_date = req.query.start_date as string | undefined
    const end_date = req.query.end_date as string | undefined
    const limit = req.query.limit as string | undefined
    const offset = req.query.offset as string | undefined

    const result = await feedbackService.listFeedback(workspaceId, {
      category,
      severity,
      status,
      start_date: start_date ? new Date(start_date) : undefined,
      end_date: end_date ? new Date(end_date) : undefined,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    })

    res.json(result)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to fetch feedback')
    res.status(status).json(body)
  }
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const id = req.params.id as string

    const feedback = await feedbackService.getFeedback(id, workspaceId)
    res.json(feedback)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to fetch feedback')
    res.status(status).json(body)
  }
})

router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const userId = req.userId as string
    const id = req.params.id as string
    const body = req.body as { status?: string; reviewer_notes?: string }
    const { status, reviewer_notes } = body

    if (!status) {
      const err = new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Status is required',
        {},
        400
      )
      const { status: errStatus, body: errBody } = handleError(err)
      return res.status(errStatus).json(errBody)
    }

    const feedback = await feedbackService.updateFeedbackStatus(
      id,
      workspaceId,
      userId,
      status,
      reviewer_notes
    )

    res.json(feedback)
  } catch (error) {
    const { status, body } = handleError(
      error,
      'Failed to update feedback status'
    )
    res.status(status).json(body)
  }
})

export default router

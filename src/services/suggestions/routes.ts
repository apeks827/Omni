import { Router } from 'express'
import { Response } from 'express'
import { authenticateToken, AuthRequest } from '../../middleware/auth.js'
import { handleError, AppError, ErrorCodes } from '../../utils/errors.js'
import suggestionService from './suggestion.service.js'
import {
  suggestionInputSchema,
  suggestionFeedbackSchema,
  updateRulesSchema,
} from './types.js'

const router = Router()
router.use(authenticateToken)

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const parsed = suggestionInputSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid input',
        { errors: parsed.error.issues },
        400
      )
    }

    const { input } = parsed.data
    const workspaceId = req.workspaceId as string

    const result = await suggestionService.getSuggestions(input, workspaceId)
    res.json(result)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to get suggestions')
    res.status(status).json(body)
  }
})

router.get('/rules', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const rules = await suggestionService.getAllRules(workspaceId)
    res.json({ rules })
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to get rules')
    res.status(status).json(body)
  }
})

router.put('/rules', async (req: AuthRequest, res: Response) => {
  try {
    const parsed = updateRulesSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid rules',
        { errors: parsed.error.issues },
        400
      )
    }

    const workspaceId = req.workspaceId as string
    const rules = await suggestionService.updateRules(
      workspaceId,
      parsed.data.rules
    )
    res.json({ rules, count: rules.length })
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to update rules')
    res.status(status).json(body)
  }
})

router.post('/feedback', async (req: AuthRequest, res: Response) => {
  try {
    const parsed = suggestionFeedbackSchema.safeParse(req.body)
    if (!parsed.success) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid feedback data',
        { errors: parsed.error.issues },
        400
      )
    }

    const { input, accepted, field, suggested_value, actual_value } =
      parsed.data
    const workspaceId = req.workspaceId as string
    const userId = req.userId as string

    await suggestionService.recordFeedback(
      workspaceId,
      userId,
      input,
      field,
      suggested_value || null,
      actual_value || null,
      accepted
    )

    res.json({ success: true, input, accepted, field })
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to record feedback')
    res.status(status).json(body)
  }
})

router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const { field } = req.query
    const stats = await suggestionService.getFeedbackStats(
      workspaceId,
      typeof field === 'string' ? field : undefined
    )
    res.json({ stats })
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to get feedback stats')
    res.status(status).json(body)
  }
})

export default router

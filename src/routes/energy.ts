import { Router, Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { validateParams } from '../middleware/validation.js'
import { uuidParamSchema } from '../validation/schemas.js'
import { energyLearningService } from '../services/ml/energy-learning.service.js'
import { taskClassifier } from '../services/ml/task-classifier.service.js'
import { handleError } from '../utils/errors.js'
import { query } from '../config/database.js'

const router = Router()

router.use(authenticateToken)

router.get('/me/energy-patterns', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId as string
    const pattern = await energyLearningService.getPattern(userId)

    if (!pattern) {
      return res.json({
        active: false,
        message:
          'No energy patterns available yet. Complete more tasks to build your pattern.',
      })
    }

    res.json({
      active: pattern.confidenceScore >= 0.7,
      pattern: {
        peakHours: pattern.peakHours,
        lowEnergyPeriods: pattern.lowEnergyPeriods,
        confidenceScore: pattern.confidenceScore,
        dataPoints: pattern.dataPoints,
      },
    })
  } catch (error) {
    const { status, body } = handleError(
      error,
      'Failed to fetch energy patterns'
    )
    res.status(status).json(body)
  }
})

router.post(
  '/me/energy-patterns/refresh',
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId as string

      await energyLearningService.updateUserPatterns(userId)

      const pattern = await energyLearningService.getPattern(userId)

      res.json({
        success: true,
        pattern: pattern
          ? {
              peakHours: pattern.peakHours,
              lowEnergyPeriods: pattern.lowEnergyPeriods,
              confidenceScore: pattern.confidenceScore,
              dataPoints: pattern.dataPoints,
            }
          : null,
      })
    } catch (error) {
      const { status, body } = handleError(
        error,
        'Failed to refresh energy patterns'
      )
      res.status(status).json(body)
    }
  }
)

router.get(
  '/me/energy-patterns/status',
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId as string

      const isActive = await energyLearningService.isPatternActive(userId)
      const hasMinData = await energyLearningService.hasMinimumData(userId)
      const confidenceScore =
        await energyLearningService.getConfidenceScore(userId)

      res.json({
        active: isActive,
        hasMinimumData: hasMinData,
        confidenceScore,
        threshold: 0.7,
      })
    } catch (error) {
      const { status, body } = handleError(
        error,
        'Failed to fetch pattern status'
      )
      res.status(status).json(body)
    }
  }
)

router.get(
  '/tasks/:id/cognitive-load',
  validateParams(uuidParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const taskId = req.params.id
      const workspaceId = req.workspaceId as string

      const taskResult = await query(
        'SELECT id, title, description, type, estimated_duration FROM tasks WHERE id = $1 AND workspace_id = $2',
        [taskId, workspaceId]
      )

      if (taskResult.rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' })
      }

      const task = taskResult.rows[0]
      const classification = await taskClassifier.classifyTask(task as any)

      res.json({
        taskId,
        cognitiveLoad: classification.load,
        confidence: classification.confidence,
      })
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to classify task')
      res.status(status).json(body)
    }
  }
)

export default router

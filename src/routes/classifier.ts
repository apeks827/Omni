import express from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import {
  taskClassifier,
  CognitiveLoad,
  COGNITIVE_KEYWORDS,
} from '../services/ml/task-classifier.service.js'
import taskService from '../domains/tasks/services/TaskService.js'

const router = express.Router()

router.post('/classify', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { taskId, title, description, estimatedDuration, type } = req.body

    if (!taskId && !title) {
      return res.status(400).json({
        success: false,
        error: 'Either taskId or title is required',
      })
    }

    let taskData = {
      title,
      description,
      estimated_duration: estimatedDuration,
      type,
    }

    if (taskId) {
      const workspaceId = req.workspaceId as string
      const task = (await taskService.getTask(taskId, workspaceId)) as any
      taskData = {
        title: task.title,
        description: task.description,
        estimated_duration: task.estimated_duration,
        type: task.type || 'task',
      }
    }

    const classification = await taskClassifier.classifyTask(taskData as any)

    res.json({
      success: true,
      classification: {
        load: classification.load,
        confidence: classification.confidence,
        loadLabel: getLoadLabel(classification.load),
      },
      input: taskId ? { taskId } : { title, description },
    })
  } catch (error) {
    console.error('Classification failed:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

router.post(
  '/classify-bulk',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const { tasks } = req.body

      if (!Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'tasks array is required',
        })
      }

      if (tasks.length > 100) {
        return res.status(400).json({
          success: false,
          error: 'Maximum 100 tasks per request',
        })
      }

      const workspaceId = req.workspaceId as string

      const results = await Promise.all(
        tasks.map(async (taskInput: any, index: number) => {
          try {
            let taskData = taskInput

            if (taskInput.taskId) {
              const task = (await taskService.getTask(
                taskInput.taskId,
                workspaceId
              )) as any
              taskData = {
                title: task.title,
                description: task.description,
                estimated_duration: task.estimated_duration,
                type: task.type || 'task',
              }
            }

            const classification = await taskClassifier.classifyTask(
              taskData as any
            )
            return {
              index,
              success: true,
              taskId: taskInput.taskId || null,
              classification: {
                load: classification.load,
                confidence: classification.confidence,
                loadLabel: getLoadLabel(classification.load),
              },
            }
          } catch (error) {
            return {
              index,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              taskId: taskInput.taskId || null,
            }
          }
        })
      )

      const successful = results.filter((r: any) => r.success).length

      res.json({
        success: true,
        total: tasks.length,
        successful,
        failed: tasks.length - successful,
        results,
      })
    } catch (error) {
      console.error('Bulk classification failed:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
)

router.post(
  '/classify-keywords',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const { keywords } = req.body

      if (!Array.isArray(keywords) || keywords.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'keywords array is required and must not be empty',
        })
      }

      if (keywords.length > 50) {
        return res.status(400).json({
          success: false,
          error: 'Maximum 50 keywords per request',
        })
      }

      const result = taskClassifier.classifyByKeywords(keywords)

      res.json({
        success: true,
        classification: result,
      })
    } catch (error) {
      console.error('Keyword classification failed:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
)

router.get('/keywords', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const classification = await taskClassifier.classifyByType(
      (req.query.type as string) || '',
      (req.query.title as string) || '',
      (req.query.description as string) || ''
    )

    res.json({
      success: true,
      keywords: {
        type: classification,
        matchedKeywords: getMatchedKeywords(classification),
      },
    })
  } catch (error) {
    console.error('Keyword analysis failed:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

router.get('/cognitive-load-levels', async (req, res) => {
  res.json({
    success: true,
    levels: [
      {
        value: 'deep_work',
        label: 'Deep Work',
        description:
          'Complex tasks requiring focused concentration (60+ minutes)',
      },
      {
        value: 'medium',
        label: 'Medium',
        description: 'Tasks requiring moderate attention (30-60 minutes)',
      },
      {
        value: 'light',
        label: 'Light',
        description: 'Simple tasks with low cognitive load (15-30 minutes)',
      },
      {
        value: 'admin',
        label: 'Admin',
        description: 'Administrative tasks (< 15 minutes)',
      },
    ],
  })
})

router.get('/available-keywords', async (req, res) => {
  res.json({
    success: true,
    keywords: COGNITIVE_KEYWORDS,
  })
})

function getLoadLabel(load: CognitiveLoad): string {
  const labels: Record<CognitiveLoad, string> = {
    deep_work: 'Deep Work',
    medium: 'Medium',
    light: 'Light',
    admin: 'Admin',
  }
  return labels[load]
}

function getMatchedKeywords(load: CognitiveLoad): string[] {
  return COGNITIVE_KEYWORDS[load] || []
}

export default router

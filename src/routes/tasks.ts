import { Router } from 'express'
import { Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { validate, validateParams } from '../middleware/validation.js'
import {
  createTaskSchema,
  updateTaskSchema,
  uuidParamSchema,
  quickTaskSchema,
  bulkUpdateTaskSchema,
  bulkDeleteTaskSchema,
  bulkMoveTaskSchema,
} from '../validation/schemas.js'
import taskService from '../domains/tasks/services/TaskService.js'
import prioritizationService from '../services/prioritization/prioritization.service.js'
import { handleError, AppError, ErrorCodes } from '../utils/errors.js'
import { userRateLimit } from '../middleware/rateLimit.js'
import { createAIClient } from '../services/ai/client.js'

const router = Router()

router.use(authenticateToken)

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const { status, priority, project_id, label_id } = req.query

    const statusStr = typeof status === 'string' ? status : undefined
    const priorityStr = typeof priority === 'string' ? priority : undefined
    const projectIdStr = typeof project_id === 'string' ? project_id : undefined
    const labelIdStr = typeof label_id === 'string' ? label_id : undefined

    const tasks = await taskService.listTasks(workspaceId, {
      status: statusStr,
      priority: priorityStr,
      project_id: projectIdStr,
      label_id: labelIdStr,
    })

    res.json(tasks)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to fetch tasks')
    res.status(status).json(body)
  }
})

const bulkRateLimit = userRateLimit({
  windowMs: 60000,
  max: 10,
  message: 'Rate limit exceeded: 10 bulk operations per minute',
})

router.patch(
  '/bulk',
  bulkRateLimit,
  validate(bulkUpdateTaskSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { task_ids, updates } = req.body
      const workspaceId = req.workspaceId as string
      const userId = req.userId as string

      const result = await taskService.bulkUpdateTasks(
        task_ids,
        workspaceId,
        userId,
        updates || {}
      )

      res.json({
        updated_count: result.success,
        failed_count: result.failed,
        total: task_ids.length,
        errors: result.errors,
      })
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to bulk update tasks')
      res.status(status).json(body)
    }
  }
)

router.delete(
  '/bulk',
  bulkRateLimit,
  validate(bulkDeleteTaskSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { task_ids } = req.body
      const workspaceId = req.workspaceId as string

      const result = await taskService.bulkDeleteTasks(task_ids, workspaceId)

      res.json({
        deleted_count: result.success,
        failed_count: result.failed,
        total: task_ids.length,
        errors: result.errors,
      })
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to bulk delete tasks')
      res.status(status).json(body)
    }
  }
)

router.post(
  '/bulk/move',
  bulkRateLimit,
  validate(bulkMoveTaskSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { task_ids, project_id } = req.body
      const workspaceId = req.workspaceId as string

      const result = await taskService.bulkMoveTasks(
        task_ids,
        workspaceId,
        project_id
      )

      res.json({
        moved_count: result.success,
        failed_count: result.failed,
        total: task_ids.length,
        project_id,
        errors: result.errors,
      })
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to bulk move tasks')
      res.status(status).json(body)
    }
  }
)

router.get(
  '/:id',
  validateParams(uuidParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string
      const workspaceId = req.workspaceId as string

      const task = await taskService.getTask(id, workspaceId)
      res.json(task)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to fetch task')
      res.status(status).json(body)
    }
  }
)

router.post(
  '/quick',
  validate(quickTaskSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { input } = req.body
      const userId = req.userId
      const workspaceId = req.workspaceId

      const task = await taskService.createQuickTask(
        input,
        userId as string,
        workspaceId as string
      )

      res.status(201).json(task)
    } catch (error: any) {
      if (
        error.message?.includes('empty') ||
        error.message?.includes('exceeds')
      ) {
        const err = new AppError(
          ErrorCodes.VALIDATION_ERROR,
          error.message,
          {},
          400
        )
        const { status, body } = handleError(err)
        return res.status(status).json(body)
      }
      const { status, body } = handleError(error, 'Failed to create task')
      res.status(status).json(body)
    }
  }
)

router.post(
  '/extract',
  userRateLimit({
    windowMs: 60000,
    max: 10,
    message: 'Rate limit exceeded: 10 extractions per minute',
  }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { input } = req.body
      const useLLM = process.env.NLP_LLM_ENABLED === 'true'

      let extracted: Awaited<ReturnType<typeof taskService.extractTaskData>>

      if (useLLM) {
        try {
          const aiClient = createAIClient()
          const llmResult = await aiClient.extractTaskFromNaturalLanguage(input)
          extracted = llmResult
        } catch (llmError) {
          extracted = taskService.extractTaskData(input)
        }
      } else {
        extracted = taskService.extractTaskData(input)
      }

      res.json(extracted)
    } catch (error: any) {
      if (
        error.message?.includes('empty') ||
        error.message?.includes('exceeds')
      ) {
        const err = new AppError(
          ErrorCodes.VALIDATION_ERROR,
          error.message,
          {},
          400
        )
        const { status, body } = handleError(err)
        return res.status(status).json(body)
      }
      const { status, body } = handleError(error, 'Failed to extract task data')
      res.status(status).json(body)
    }
  }
)

router.post(
  '/',
  validate(createTaskSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        title,
        description,
        type,
        status,
        priority,
        project_id,
        assignee_id,
        due_date,
        label_ids,
      } = req.body
      const userId = req.userId
      const workspaceId = req.workspaceId

      const task = await taskService.createTask({
        title,
        description,
        status,
        priority,
        project_id,
        assignee_id,
        creator_id: userId as string,
        workspace_id: workspaceId as string,
        due_date,
        label_ids,
      })

      res.status(201).json(task)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to create task')
      res.status(status).json(body)
    }
  }
)

router.put(
  '/:id',
  validateParams(uuidParamSchema),
  validate(updateTaskSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string
      const {
        title,
        description,
        type,
        status,
        priority,
        project_id,
        assignee_id,
        due_date,
        label_ids,
      } = req.body
      const workspaceId = req.workspaceId as string
      const userId = req.userId as string

      const task = await taskService.updateTask(id, workspaceId, userId, {
        title,
        description,
        status,
        priority,
        project_id,
        assignee_id,
        due_date,
        label_ids,
      })

      res.json(task)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to update task')
      res.status(status).json(body)
    }
  }
)

router.post(
  '/:id/schedule',
  validateParams(uuidParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string
      const workspaceId = req.workspaceId as string
      const userId = req.userId as string

      const result = await taskService.scheduleTask(id, userId, workspaceId)
      res.json(result)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to schedule task')
      res.status(status).json(body)
    }
  }
)

router.delete(
  '/:id',
  validateParams(uuidParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string
      const workspaceId = req.workspaceId as string

      await taskService.deleteTask(id, workspaceId)
      res.status(204).send()
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to delete task')
      res.status(status).json(body)
    }
  }
)

router.get('/priorities', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const userId = req.userId as string

    const tasks = await taskService.listTasks(workspaceId, {
      status: 'pending',
    })

    const prioritized = await prioritizationService.suggestPriorities(
      tasks,
      userId,
      workspaceId
    )

    res.json({
      tasks: prioritized.sort((a, b) => b.score - a.score),
      weights: prioritizationService.getWeights(),
    })
  } catch (error) {
    const { status, body } = handleError(
      error,
      'Failed to get priority suggestions'
    )
    res.status(status).json(body)
  }
})

router.post(
  '/priorities/:taskId/feedback',
  validateParams(uuidParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const taskId = req.params.taskId as string
      const { accepted } = req.body
      const userId = req.userId as string

      await prioritizationService.recordFeedback(taskId, userId, accepted)

      res.json({ success: true, taskId, accepted })
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to record feedback')
      res.status(status).json(body)
    }
  }
)

router.put('/priorities/weights', async (req: AuthRequest, res: Response) => {
  try {
    const weights = req.body
    prioritizationService.setWeights(weights)
    res.json({ success: true, weights: prioritizationService.getWeights() })
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to update weights')
    res.status(status).json(body)
  }
})

export default router

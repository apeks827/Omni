import { Router } from 'express'
import { Response } from 'express'
import { query } from '../config/database.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { validate, validateParams } from '../middleware/validation.js'
import {
  createTaskSchema,
  updateTaskSchema,
  uuidParamSchema,
  quickTaskSchema,
} from '../validation/schemas.js'
import handoffService from '../services/handoff/handoff.service.js'
import reviewService from '../services/review/review.service.js'
import queueService from '../services/queue/queue.service.js'
import { extractTaskData } from '../services/nlp/extractor.js'
import { scheduleTask } from '../services/scheduling/scheduler.js'
import { AppError, ErrorCodes, handleError } from '../utils/errors.js'

const router = Router()

const hasWorkspaceResource = async (
  table: 'projects' | 'users',
  id: string,
  workspaceId: string
) => {
  const result = await query(
    `SELECT id FROM ${table} WHERE id = $1 AND workspace_id = $2`,
    [id, workspaceId]
  )

  return result.rows.length > 0
}

interface Task {
  id: string
  title: string
  description?: string
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  project_id?: string
  assignee_id?: string
  creator_id: string
  workspace_id: string
  due_date?: Date
  created_at: Date
  updated_at: Date
}

router.use(authenticateToken)

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId
    const { status, priority, project_id } = req.query

    let queryText = 'SELECT * FROM tasks WHERE workspace_id = $1'
    const params: any[] = [workspaceId]
    let paramIndex = 2

    if (status) {
      queryText += ` AND status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    if (priority) {
      queryText += ` AND priority = $${paramIndex}`
      params.push(priority)
      paramIndex++
    }

    if (project_id) {
      queryText += ` AND project_id = $${paramIndex}`
      params.push(project_id)
      paramIndex++
    }

    queryText += ' ORDER BY created_at DESC'

    const result = await query(queryText, params)
    res.json(result.rows)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to fetch tasks')
    res.status(status).json(body)
  }
})

router.get(
  '/:id',
  validateParams(uuidParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const workspaceId = req.workspaceId
      const result = await query(
        'SELECT * FROM tasks WHERE id = $1 AND workspace_id = $2',
        [id, workspaceId]
      )

      if (result.rows.length === 0) {
        const error = new AppError(
          ErrorCodes.TASK_NOT_FOUND,
          'Task not found',
          { task_id: id },
          404
        )
        const { status, body } = handleError(error)
        return res.status(status).json(body)
      }

      res.json(result.rows[0])
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

      const extracted = extractTaskData(input)

      const result = await query(
        'INSERT INTO tasks (title, description, status, priority, creator_id, workspace_id, due_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [
          extracted.title,
          null,
          'todo',
          extracted.priority || 'medium',
          userId,
          workspaceId,
          extracted.due_date,
        ]
      )

      res.status(201).json(result.rows[0])
    } catch (error: any) {
      if (
        error.message.includes('empty') ||
        error.message.includes('exceeds')
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

router.post('/extract', async (req: AuthRequest, res: Response) => {
  try {
    const { input } = req.body

    if (!input || typeof input !== 'string') {
      const err = new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Input is required',
        {},
        400
      )
      const { status, body } = handleError(err)
      return res.status(status).json(body)
    }

    const extracted = extractTaskData(input)
    res.json(extracted)
  } catch (error: any) {
    if (error.message.includes('empty') || error.message.includes('exceeds')) {
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
})

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
      } = req.body
      const userId = req.userId
      const workspaceId = req.workspaceId

      if (!title) {
        return res.status(400).json({ error: 'Title is required' })
      }

      if (project_id) {
        const projectExists = await hasWorkspaceResource(
          'projects',
          project_id,
          workspaceId as string
        )

        if (!projectExists) {
          return res
            .status(400)
            .json({ error: 'Invalid project_id for workspace' })
        }
      }

      if (assignee_id) {
        const assigneeExists = await hasWorkspaceResource(
          'users',
          assignee_id,
          workspaceId as string
        )

        if (!assigneeExists) {
          return res
            .status(400)
            .json({ error: 'Invalid assignee_id for workspace' })
        }
      }

      const result = await query(
        'INSERT INTO tasks (title, description, status, priority, project_id, assignee_id, creator_id, workspace_id, due_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [
          title,
          description,
          status || 'todo',
          priority || 'medium',
          project_id,
          assignee_id,
          userId,
          workspaceId,
          due_date,
        ]
      )

      res.status(201).json(result.rows[0])
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
      const { id } = req.params
      const {
        title,
        description,
        type,
        status,
        priority,
        project_id,
        assignee_id,
        due_date,
      } = req.body
      const workspaceId = req.workspaceId
      const userId = req.userId

      if (project_id) {
        const projectExists = await hasWorkspaceResource(
          'projects',
          project_id,
          workspaceId as string
        )

        if (!projectExists) {
          return res
            .status(400)
            .json({ error: 'Invalid project_id for workspace' })
        }
      }

      if (assignee_id) {
        const assigneeExists = await hasWorkspaceResource(
          'users',
          assignee_id,
          workspaceId as string
        )

        if (!assigneeExists) {
          return res
            .status(400)
            .json({ error: 'Invalid assignee_id for workspace' })
        }
      }

      const result = await query(
        'UPDATE tasks SET title = $1, description = $2, status = $3, priority = $4, project_id = $5, assignee_id = $6, due_date = $7, updated_at = NOW() WHERE id = $8 AND workspace_id = $9 RETURNING *',
        [
          title,
          description,
          status,
          priority,
          project_id,
          assignee_id,
          due_date,
          id,
          workspaceId,
        ]
      )

      if (result.rows.length === 0) {
        const error = new AppError(
          ErrorCodes.TASK_NOT_FOUND,
          'Task not found',
          { task_id: id },
          404
        )
        const { status, body } = handleError(error)
        return res.status(status).json(body)
      }

      const updatedTask = result.rows[0]

      if (status === 'completed' && userId) {
        try {
          await queueService.autoAssignNext(
            updatedTask.id,
            userId,
            workspaceId as string
          )
        } catch (queueError) {
          console.error('Error auto-assigning next task:', queueError)
        }
      }

      if (status) {
        try {
          await handoffService.triggerHandoffsForTask(
            updatedTask,
            workspaceId as string
          )

          await reviewService.triggerReviewForTask(
            updatedTask,
            workspaceId as string
          )
        } catch (handoffError) {
          console.error('Error triggering handoffs:', handoffError)
        }
      }

      res.json(updatedTask)
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

      if (!userId) {
        const error = new AppError(
          ErrorCodes.UNAUTHORIZED,
          'Unauthorized',
          {},
          401
        )
        const { status, body } = handleError(error)
        return res.status(status).json(body)
      }

      const taskResult = await query(
        'SELECT id, workspace_id FROM tasks WHERE id = $1',
        [id]
      )

      if (taskResult.rows.length === 0) {
        const error = new AppError(
          ErrorCodes.TASK_NOT_FOUND,
          'Task not found',
          { task_id: id },
          404
        )
        const { status, body } = handleError(error)
        return res.status(status).json(body)
      }

      if (taskResult.rows[0].workspace_id !== workspaceId) {
        const error = new AppError(
          ErrorCodes.FORBIDDEN,
          'Forbidden',
          { task_id: id },
          403
        )
        const { status, body } = handleError(error)
        return res.status(status).json(body)
      }

      const scheduleResult = await scheduleTask({
        taskId: id,
        userId: userId,
        workspaceId: workspaceId,
      })

      await query(
        'INSERT INTO schedule_slots (user_id, task_id, start_time, end_time, status) VALUES ($1, $2, $3, $4, $5)',
        [
          userId,
          id,
          scheduleResult.suggested_slot.start_time,
          scheduleResult.suggested_slot.end_time,
          'scheduled',
        ]
      )

      res.json(scheduleResult)
    } catch (error) {
      if (error instanceof AppError) {
        const { status, body } = handleError(error)
        return res.status(status).json(body)
      }
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
      const { id } = req.params
      const workspaceId = req.workspaceId
      const result = await query(
        'DELETE FROM tasks WHERE id = $1 AND workspace_id = $2 RETURNING id',
        [id, workspaceId]
      )

      if (result.rows.length === 0) {
        const error = new AppError(
          ErrorCodes.TASK_NOT_FOUND,
          'Task not found',
          { task_id: id },
          404
        )
        const { status, body } = handleError(error)
        return res.status(status).json(body)
      }

      res.status(204).send()
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to delete task')
      res.status(status).json(body)
    }
  }
)

export default router

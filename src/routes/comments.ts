import { Router, Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { validateParams } from '../middleware/validation.js'
import { handleError, AppError, ErrorCodes } from '../utils/errors.js'
import { pool } from '../config/database.js'
import { z } from 'zod'

const router = Router()

router.use(authenticateToken)

const taskIdSchema = z.object({
  taskId: z.string().uuid(),
})

const commentIdSchema = z.object({
  id: z.string().uuid(),
})

router.post(
  '/:taskId/comments',
  validateParams(taskIdSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const taskId = req.params.taskId
      const { content, parent_comment_id } = req.body
      const userId = req.userId as string
      const workspaceId = req.workspaceId as string

      if (!content || content.trim().length === 0) {
        throw new AppError(
          ErrorCodes.VALIDATION_ERROR,
          'Comment content is required',
          {},
          400
        )
      }

      const sanitizedContent = content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .trim()

      const taskCheck = await pool.query(
        'SELECT id FROM tasks WHERE id = $1 AND workspace_id = $2',
        [taskId, workspaceId]
      )

      if (taskCheck.rows.length === 0) {
        throw new AppError(ErrorCodes.TASK_NOT_FOUND, 'Task not found', {}, 404)
      }

      if (parent_comment_id) {
        const parentCheck = await pool.query(
          'SELECT id FROM task_comments WHERE id = $1 AND task_id = $2',
          [parent_comment_id, taskId]
        )

        if (parentCheck.rows.length === 0) {
          throw new AppError(
            ErrorCodes.VALIDATION_ERROR,
            'Parent comment not found',
            {},
            400
          )
        }
      }

      const result = await pool.query(
        `INSERT INTO task_comments (task_id, user_id, content, parent_comment_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, task_id, user_id, content, parent_comment_id, created_at, updated_at`,
        [taskId, userId, sanitizedContent, parent_comment_id || null]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to create comment')
      res.status(status).json(body)
    }
  }
)

router.get(
  '/:taskId/comments',
  validateParams(taskIdSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const taskId = req.params.taskId
      const workspaceId = req.workspaceId as string

      const taskCheck = await pool.query(
        'SELECT id FROM tasks WHERE id = $1 AND workspace_id = $2',
        [taskId, workspaceId]
      )

      if (taskCheck.rows.length === 0) {
        throw new AppError(ErrorCodes.TASK_NOT_FOUND, 'Task not found', {}, 404)
      }

      const result = await pool.query(
        `SELECT id, task_id, user_id, content, parent_comment_id, created_at, updated_at
         FROM task_comments
         WHERE task_id = $1 AND deleted_at IS NULL
         ORDER BY created_at ASC`,
        [taskId]
      )

      res.json(result.rows)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to fetch comments')
      res.status(status).json(body)
    }
  }
)

router.put(
  '/:taskId/comments/:id',
  validateParams(
    z.object({ taskId: z.string().uuid(), id: z.string().uuid() })
  ),
  async (req: AuthRequest, res: Response) => {
    try {
      const commentId = req.params.id
      const { content } = req.body
      const userId = req.userId as string

      if (!content || content.trim().length === 0) {
        throw new AppError(
          ErrorCodes.VALIDATION_ERROR,
          'Comment content is required',
          {},
          400
        )
      }

      const sanitizedContent = content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .trim()

      const commentCheck = await pool.query(
        'SELECT user_id FROM task_comments WHERE id = $1 AND deleted_at IS NULL',
        [commentId]
      )

      if (commentCheck.rows.length === 0) {
        throw new AppError(
          ErrorCodes.VALIDATION_ERROR,
          'Comment not found',
          {},
          404
        )
      }

      if (commentCheck.rows[0].user_id !== userId) {
        throw new AppError(
          ErrorCodes.FORBIDDEN,
          'You can only edit your own comments',
          {},
          403
        )
      }

      const result = await pool.query(
        `UPDATE task_comments
         SET content = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id, task_id, user_id, content, parent_comment_id, created_at, updated_at`,
        [sanitizedContent, commentId]
      )

      res.json(result.rows[0])
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to update comment')
      res.status(status).json(body)
    }
  }
)

router.delete(
  '/:taskId/comments/:id',
  validateParams(
    z.object({ taskId: z.string().uuid(), id: z.string().uuid() })
  ),
  async (req: AuthRequest, res: Response) => {
    try {
      const commentId = req.params.id
      const userId = req.userId as string

      const commentCheck = await pool.query(
        'SELECT user_id FROM task_comments WHERE id = $1 AND deleted_at IS NULL',
        [commentId]
      )

      if (commentCheck.rows.length === 0) {
        throw new AppError(
          ErrorCodes.VALIDATION_ERROR,
          'Comment not found',
          {},
          404
        )
      }

      if (commentCheck.rows[0].user_id !== userId) {
        throw new AppError(
          ErrorCodes.FORBIDDEN,
          'You can only delete your own comments',
          {},
          403
        )
      }

      await pool.query(
        'UPDATE task_comments SET deleted_at = NOW() WHERE id = $1',
        [commentId]
      )

      res.status(204).send()
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to delete comment')
      res.status(status).json(body)
    }
  }
)

export default router

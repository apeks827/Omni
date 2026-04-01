import { Router, Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { validateParams } from '../middleware/validation.js'
import { handleError } from '../utils/errors.js'
import commentService from '../domains/comments/services/CommentService.js'
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
      const taskId = req.params.taskId as string
      const { content, parent_comment_id } = req.body
      const userId = req.userId as string
      const workspaceId = req.workspaceId as string

      const comment = await commentService.createComment(
        taskId,
        userId,
        workspaceId,
        content as string,
        parent_comment_id as string | undefined
      )

      res.status(201).json(comment)
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
      const taskId = req.params.taskId as string
      const workspaceId = req.workspaceId as string

      const comments = await commentService.getComments(taskId, workspaceId)

      res.json(comments)
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
      const commentId = req.params.id as string
      const { content } = req.body
      const userId = req.userId as string

      const comment = await commentService.updateComment(
        commentId,
        userId,
        content as string
      )

      res.json(comment)
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
      const commentId = req.params.id as string
      const userId = req.userId as string

      await commentService.deleteComment(commentId, userId)

      res.status(204).send()
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to delete comment')
      res.status(status).json(body)
    }
  }
)

export default router

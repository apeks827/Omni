import commentRepository, {
  Comment,
} from '../repositories/CommentRepository.js'
import taskRepository from '../../tasks/repositories/TaskRepository.js'
import { AppError, ErrorCodes } from '../../../utils/errors.js'

class CommentService {
  private sanitizeContent(content: string): string {
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .trim()
  }

  async getComments(taskId: string, workspaceId: string): Promise<Comment[]> {
    const task = await taskRepository.findById(taskId, workspaceId)
    if (!task) {
      throw new AppError(ErrorCodes.TASK_NOT_FOUND, 'Task not found', {}, 404)
    }

    return commentRepository.findByTask(taskId)
  }

  async createComment(
    taskId: string,
    userId: string,
    workspaceId: string,
    content: string,
    parentCommentId?: string
  ): Promise<Comment> {
    if (!content || content.trim().length === 0) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Comment content is required',
        {},
        400
      )
    }

    const task = await taskRepository.findById(taskId, workspaceId)
    if (!task) {
      throw new AppError(ErrorCodes.TASK_NOT_FOUND, 'Task not found', {}, 404)
    }

    if (parentCommentId) {
      const parentExists = await commentRepository.parentExists(
        parentCommentId,
        taskId
      )
      if (!parentExists) {
        throw new AppError(
          ErrorCodes.VALIDATION_ERROR,
          'Parent comment not found',
          {},
          400
        )
      }
    }

    const sanitizedContent = this.sanitizeContent(content)
    return commentRepository.create({
      task_id: taskId,
      user_id: userId,
      content: sanitizedContent,
      parent_comment_id: parentCommentId,
    })
  }

  async updateComment(
    commentId: string,
    userId: string,
    content: string
  ): Promise<Comment> {
    if (!content || content.trim().length === 0) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Comment content is required',
        {},
        400
      )
    }

    const comment = await commentRepository.findById(commentId)
    if (!comment) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Comment not found',
        {},
        404
      )
    }

    if (comment.user_id !== userId) {
      throw new AppError(
        ErrorCodes.FORBIDDEN,
        'You can only edit your own comments',
        {},
        403
      )
    }

    const sanitizedContent = this.sanitizeContent(content)
    return commentRepository.update(commentId, sanitizedContent)
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await commentRepository.findById(commentId)
    if (!comment) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Comment not found',
        {},
        404
      )
    }

    if (comment.user_id !== userId) {
      throw new AppError(
        ErrorCodes.FORBIDDEN,
        'You can only delete your own comments',
        {},
        403
      )
    }

    await commentRepository.softDelete(commentId)
  }
}

export default new CommentService()

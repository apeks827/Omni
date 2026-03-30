import { query } from '../../../config/database.js'

export interface Comment {
  id: string
  task_id: string
  user_id: string
  content: string
  parent_comment_id: string | null
  created_at: Date
  updated_at: Date
}

class CommentRepository {
  async findByTask(taskId: string): Promise<Comment[]> {
    const result = await query(
      `SELECT id, task_id, user_id, content, parent_comment_id, created_at, updated_at
       FROM task_comments
       WHERE task_id = $1 AND deleted_at IS NULL
       ORDER BY created_at ASC`,
      [taskId]
    )
    return result.rows
  }

  async findById(commentId: string): Promise<Comment | null> {
    const result = await query(
      'SELECT id, task_id, user_id, content, parent_comment_id, created_at, updated_at FROM task_comments WHERE id = $1 AND deleted_at IS NULL',
      [commentId]
    )
    return result.rows[0] || null
  }

  async create(data: {
    task_id: string
    user_id: string
    content: string
    parent_comment_id?: string | null
  }): Promise<Comment> {
    const result = await query(
      `INSERT INTO task_comments (task_id, user_id, content, parent_comment_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, task_id, user_id, content, parent_comment_id, created_at, updated_at`,
      [data.task_id, data.user_id, data.content, data.parent_comment_id || null]
    )
    return result.rows[0]
  }

  async update(commentId: string, content: string): Promise<Comment> {
    const result = await query(
      `UPDATE task_comments
       SET content = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, task_id, user_id, content, parent_comment_id, created_at, updated_at`,
      [content, commentId]
    )
    return result.rows[0]
  }

  async softDelete(commentId: string): Promise<void> {
    await query('UPDATE task_comments SET deleted_at = NOW() WHERE id = $1', [
      commentId,
    ])
  }

  async parentExists(
    parentCommentId: string,
    taskId: string
  ): Promise<boolean> {
    const result = await query(
      'SELECT id FROM task_comments WHERE id = $1 AND task_id = $2',
      [parentCommentId, taskId]
    )
    return result.rows.length > 0
  }
}

export default new CommentRepository()

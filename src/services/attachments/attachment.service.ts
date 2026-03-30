import { pool } from '../../config/database.js'
import path from 'path'
import fs from 'fs'

export interface AttachmentData {
  task_id: string
  user_id: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
}

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads'

export class AttachmentService {
  private getUploadDir(workspaceId: string): string {
    const dir = path.join(UPLOAD_DIR, workspaceId)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    return dir
  }

  async createAttachment(data: AttachmentData, workspaceId: string) {
    const result = await pool.query(
      `INSERT INTO task_attachments (task_id, user_id, file_name, file_path, file_size, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.task_id,
        data.user_id,
        data.file_name,
        data.file_path,
        data.file_size,
        data.mime_type,
      ]
    )
    return result.rows[0]
  }

  async listAttachments(taskId: string, workspaceId: string) {
    const taskCheck = await pool.query(
      'SELECT id FROM tasks WHERE id = $1 AND workspace_id = $2',
      [taskId, workspaceId]
    )

    if (taskCheck.rows.length === 0) {
      throw new Error('Task not found')
    }

    const result = await pool.query(
      `SELECT id, task_id, user_id, file_name, file_size, mime_type, uploaded_at
       FROM task_attachments
       WHERE task_id = $1
       ORDER BY uploaded_at DESC`,
      [taskId]
    )

    return result.rows
  }

  async getAttachment(id: string, workspaceId: string) {
    const result = await pool.query(
      `SELECT ta.* FROM task_attachments ta
       JOIN tasks t ON ta.task_id = t.id
       WHERE ta.id = $1 AND t.workspace_id = $2`,
      [id, workspaceId]
    )

    if (result.rows.length === 0) {
      throw new Error('Attachment not found')
    }

    return result.rows[0]
  }

  async deleteAttachment(id: string, userId: string, workspaceId: string) {
    const attachment = await this.getAttachment(id, workspaceId)

    if (attachment.user_id !== userId) {
      throw new Error('You can only delete your own attachments')
    }

    const filePath = path.join(process.cwd(), attachment.file_path)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    await pool.query('DELETE FROM task_attachments WHERE id = $1', [id])
  }

  async getTotalSize(taskId: string): Promise<number> {
    const result = await pool.query(
      'SELECT COALESCE(SUM(file_size), 0) as total FROM task_attachments WHERE task_id = $1',
      [taskId]
    )
    return parseInt(result.rows[0].total)
  }

  async searchByFileName(query: string, workspaceId: string) {
    const result = await pool.query(
      `SELECT ta.*, t.title as task_title, t.id as task_id
       FROM task_attachments ta
       JOIN tasks t ON ta.task_id = t.id
       WHERE t.workspace_id = $1 AND ta.file_name ILIKE $2
       ORDER BY ta.uploaded_at DESC`,
      [workspaceId, `%${query}%`]
    )
    return result.rows
  }

  isAllowedType(mimeType: string): boolean {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ]
    return allowed.includes(mimeType)
  }

  isAllowedSize(size: number): boolean {
    const MAX_FILE_SIZE = 10 * 1024 * 1024
    return size <= MAX_FILE_SIZE
  }
}

export default new AttachmentService()

import { pool } from '../../../config/database.js'

export interface UserFeedback {
  id: string
  workspace_id: string
  user_id: string | null
  session_id: string | null
  category: 'bug' | 'confusion' | 'feature_request'
  description: string
  severity: 'low' | 'medium' | 'high'
  repro_steps: string | null
  page: string | null
  app_version: string | null
  environment: Record<string, string> | null
  screenshot_url: string | null
  contact_permission: boolean
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  reviewed_by: string | null
  reviewed_at: Date | null
  reviewer_notes: string | null
  created_at: Date
  updated_at: Date
}

export interface CreateFeedbackData {
  workspace_id: string
  user_id?: string
  session_id?: string
  category: 'bug' | 'confusion' | 'feature_request'
  description: string
  severity?: 'low' | 'medium' | 'high'
  repro_steps?: string
  page?: string
  app_version?: string
  environment?: Record<string, string>
  screenshot_url?: string
  contact_permission?: boolean
}

export interface FeedbackFilters {
  category?: string
  severity?: string
  status?: string
  start_date?: Date
  end_date?: Date
  limit?: number
  offset?: number
}

export class FeedbackRepository {
  async create(data: CreateFeedbackData): Promise<UserFeedback> {
    const result = await pool.query(
      `INSERT INTO user_feedback (
        workspace_id, user_id, session_id, category, description,
        severity, repro_steps, page, app_version, environment,
        screenshot_url, contact_permission
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        data.workspace_id,
        data.user_id || null,
        data.session_id || null,
        data.category,
        data.description,
        data.severity || 'medium',
        data.repro_steps || null,
        data.page || null,
        data.app_version || null,
        data.environment ? JSON.stringify(data.environment) : null,
        data.screenshot_url || null,
        data.contact_permission || false,
      ]
    )
    return this.mapRow(result.rows[0])
  }

  async findById(
    id: string,
    workspaceId: string
  ): Promise<UserFeedback | null> {
    const result = await pool.query(
      'SELECT * FROM user_feedback WHERE id = $1 AND workspace_id = $2',
      [id, workspaceId]
    )
    if (result.rows.length === 0) return null
    return this.mapRow(result.rows[0])
  }

  async list(
    workspaceId: string,
    filters: FeedbackFilters
  ): Promise<{ data: UserFeedback[]; total: number }> {
    const conditions: string[] = ['workspace_id = $1']
    const params: (string | Date | number)[] = [workspaceId]
    let paramIndex = 2

    if (filters.category) {
      conditions.push(`category = $${paramIndex}`)
      params.push(filters.category)
      paramIndex++
    }

    if (filters.severity) {
      conditions.push(`severity = $${paramIndex}`)
      params.push(filters.severity)
      paramIndex++
    }

    if (filters.status) {
      conditions.push(`status = $${paramIndex}`)
      params.push(filters.status)
      paramIndex++
    }

    if (filters.start_date) {
      conditions.push(`created_at >= $${paramIndex}`)
      params.push(filters.start_date)
      paramIndex++
    }

    if (filters.end_date) {
      conditions.push(`created_at <= $${paramIndex}`)
      params.push(filters.end_date)
      paramIndex++
    }

    const whereClause = conditions.join(' AND ')

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM user_feedback WHERE ${whereClause}`,
      params
    )
    const total = parseInt(countResult.rows[0].count)

    const limit = filters.limit || 50
    const offset = filters.offset || 0

    const result = await pool.query(
      `SELECT * FROM user_feedback WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    )

    return {
      data: result.rows.map(row => this.mapRow(row)),
      total,
    }
  }

  async updateStatus(
    id: string,
    workspaceId: string,
    status: string,
    reviewedBy?: string,
    reviewerNotes?: string
  ): Promise<UserFeedback | null> {
    const result = await pool.query(
      `UPDATE user_feedback
       SET status = $1, reviewed_by = $2, reviewed_at = NOW(), reviewer_notes = $3, updated_at = NOW()
       WHERE id = $4 AND workspace_id = $5
       RETURNING *`,
      [status, reviewedBy || null, reviewerNotes || null, id, workspaceId]
    )
    if (result.rows.length === 0) return null
    return this.mapRow(result.rows[0])
  }

  private mapRow(row: Record<string, unknown>): UserFeedback {
    return {
      id: row.id as string,
      workspace_id: row.workspace_id as string,
      user_id: row.user_id as string | null,
      session_id: row.session_id as string | null,
      category: row.category as UserFeedback['category'],
      description: row.description as string,
      severity: row.severity as UserFeedback['severity'],
      repro_steps: row.repro_steps as string | null,
      page: row.page as string | null,
      app_version: row.app_version as string | null,
      environment: row.environment as Record<string, string> | null,
      screenshot_url: row.screenshot_url as string | null,
      contact_permission: row.contact_permission as boolean,
      status: row.status as UserFeedback['status'],
      reviewed_by: row.reviewed_by as string | null,
      reviewed_at: row.reviewed_at as Date | null,
      reviewer_notes: row.reviewer_notes as string | null,
      created_at: row.created_at as Date,
      updated_at: row.updated_at as Date,
    }
  }
}

export default new FeedbackRepository()

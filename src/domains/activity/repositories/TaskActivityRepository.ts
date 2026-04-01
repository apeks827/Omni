import { query } from '../../../config/database.js'

export interface TaskActivity {
  id: string
  task_id: string
  user_id: string | null
  workspace_id: string
  action_type: string
  changes: unknown
  created_at: Date
  username?: string
  email?: string
  task_title?: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
}

export interface ActivityFilters {
  action_type?: string
}

class TaskActivityRepository {
  async findByWorkspace(
    workspaceId: string,
    filters: ActivityFilters = {},
    limit: number = 100,
    offset: number = 0
  ): Promise<PaginatedResult<TaskActivity>> {
    let queryText = `
      SELECT 
        ta.id,
        ta.task_id,
        ta.user_id,
        ta.workspace_id,
        ta.action_type,
        ta.changes,
        ta.created_at,
        u.username,
        u.email,
        t.title as task_title
      FROM task_activities ta
      LEFT JOIN users u ON ta.user_id = u.id
      LEFT JOIN tasks t ON ta.task_id = t.id
      WHERE ta.workspace_id = $1
    `
    const params: (string | number)[] = [workspaceId]
    let paramIndex = 2

    if (filters.action_type) {
      queryText += ` AND ta.action_type = $${paramIndex}`
      params.push(filters.action_type)
      paramIndex++
    }

    queryText += ` ORDER BY ta.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const result = await query(queryText, params)

    const countQuery = filters.action_type
      ? 'SELECT COUNT(*) FROM task_activities WHERE workspace_id = $1 AND action_type = $2'
      : 'SELECT COUNT(*) FROM task_activities WHERE workspace_id = $1'
    const countParams = filters.action_type
      ? [workspaceId, filters.action_type]
      : [workspaceId]
    const countResult = await query(countQuery, countParams)

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
    }
  }

  async findByTask(
    taskId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<PaginatedResult<TaskActivity>> {
    const result = await query(
      `SELECT 
        ta.id,
        ta.task_id,
        ta.user_id,
        ta.workspace_id,
        ta.action_type,
        ta.changes,
        ta.created_at,
        u.username,
        u.email,
        t.title as task_title
      FROM task_activities ta
      LEFT JOIN users u ON ta.user_id = u.id
      LEFT JOIN tasks t ON ta.task_id = t.id
      WHERE ta.task_id = $1
      ORDER BY ta.created_at DESC
      LIMIT $2 OFFSET $3`,
      [taskId, limit, offset]
    )

    const countResult = await query(
      'SELECT COUNT(*) FROM task_activities WHERE task_id = $1',
      [taskId]
    )

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
    }
  }

  async findByUser(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<PaginatedResult<TaskActivity>> {
    const result = await query(
      `SELECT 
        ta.id,
        ta.task_id,
        ta.user_id,
        ta.workspace_id,
        ta.action_type,
        ta.changes,
        ta.created_at,
        u.username,
        u.email,
        t.title as task_title
      FROM task_activities ta
      LEFT JOIN users u ON ta.user_id = u.id
      LEFT JOIN tasks t ON ta.task_id = t.id
      WHERE ta.user_id = $1
      ORDER BY ta.created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    )

    const countResult = await query(
      'SELECT COUNT(*) FROM task_activities WHERE user_id = $1',
      [userId]
    )

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
    }
  }
}

export default new TaskActivityRepository()

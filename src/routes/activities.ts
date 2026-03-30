import { Router } from 'express'
import { Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { handleError } from '../utils/errors.js'
import { pool } from '../config/database.js'

const router = Router()

router.use(authenticateToken)

interface Activity {
  id: string
  task_id: string
  user_id: string | null
  workspace_id: string
  action_type: string
  changes: any[]
  created_at: Date
  user?: {
    id: string
    username: string
    email: string
  }
  task_title?: string
}

interface ActivityRow {
  id: string
  task_id: string
  user_id: string | null
  workspace_id: string
  action_type: string
  changes: any
  created_at: Date
  username?: string
  email?: string
  task_title?: string
}

const formatActivityRow = (row: ActivityRow): Activity => ({
  id: row.id,
  task_id: row.task_id,
  user_id: row.user_id,
  workspace_id: row.workspace_id,
  action_type: row.action_type,
  changes:
    typeof row.changes === 'string'
      ? JSON.parse(row.changes)
      : row.changes || [],
  created_at: row.created_at,
  user: row.user_id
    ? {
        id: row.user_id,
        username: row.username || 'Unknown',
        email: row.email || '',
      }
    : undefined,
  task_title: row.task_title,
})

router.get(
  '/workspaces/:workspaceId/activities',
  async (req: AuthRequest, res: Response) => {
    try {
      const workspaceId = req.params.workspaceId as string
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 100)
      const offset = parseInt(req.query.offset as string) || 0
      const actionType = req.query.action_type as string | undefined

      let query = `
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
      const params: any[] = [workspaceId]

      if (actionType) {
        query += ' AND ta.action_type = $2'
        params.push(actionType)
      }

      query += `
      ORDER BY ta.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countQuery = actionType
        ? 'SELECT COUNT(*) FROM task_activities WHERE workspace_id = $1 AND action_type = $2'
        : 'SELECT COUNT(*) FROM task_activities WHERE workspace_id = $1'
      const countParams = actionType ? [workspaceId, actionType] : [workspaceId]
      const countResult = await pool.query(countQuery, countParams)
      const total = parseInt(countResult.rows[0].count)

      res.json({
        activities: result.rows.map(formatActivityRow),
        total,
      })
    } catch (error) {
      const { status, body } = handleError(
        error,
        'Failed to fetch workspace activities'
      )
      res.status(status).json(body)
    }
  }
)

router.get(
  '/tasks/:taskId/activities',
  async (req: AuthRequest, res: Response) => {
    try {
      const taskId = req.params.taskId as string
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100)
      const offset = parseInt(req.query.offset as string) || 0

      const result = await pool.query(
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

      const countResult = await pool.query(
        'SELECT COUNT(*) FROM task_activities WHERE task_id = $1',
        [taskId]
      )
      const total = parseInt(countResult.rows[0].count)

      res.json({
        activities: result.rows.map(formatActivityRow),
        total,
      })
    } catch (error) {
      const { status, body } = handleError(
        error,
        'Failed to fetch task activities'
      )
      res.status(status).json(body)
    }
  }
)

router.get(
  '/users/:userId/activities',
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.params.userId as string
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100)
      const offset = parseInt(req.query.offset as string) || 0

      const result = await pool.query(
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

      const countResult = await pool.query(
        'SELECT COUNT(*) FROM task_activities WHERE user_id = $1',
        [userId]
      )
      const total = parseInt(countResult.rows[0].count)

      res.json({
        activities: result.rows.map(formatActivityRow),
        total,
      })
    } catch (error) {
      const { status, body } = handleError(
        error,
        'Failed to fetch user activities'
      )
      res.status(status).json(body)
    }
  }
)

export default router

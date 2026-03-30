import express from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { query } from '../config/database.js'

const router = express.Router()

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { layer, severity, resolved, limit = '50' } = req.query

    let sql = `
      SELECT 
        id, correlation_id, layer, error_type, message, 
        stack_trace, context, user_id, task_id, severity, 
        resolved, created_at
      FROM error_events
      WHERE 1=1
    `
    const params: any[] = []
    let paramCount = 0

    if (layer) {
      paramCount++
      sql += ` AND layer = $${paramCount}`
      params.push(layer)
    }

    if (severity) {
      paramCount++
      sql += ` AND severity = $${paramCount}`
      params.push(severity)
    }

    if (resolved !== undefined) {
      paramCount++
      sql += ` AND resolved = $${paramCount}`
      params.push(resolved === 'true')
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramCount + 1}`
    params.push(parseInt(limit as string))

    const result = await query(sql, params)
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching error events:', error)
    res.status(500).json({ error: 'Failed to fetch error events' })
  }
})

router.patch(
  '/:id/resolve',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params

      const result = await query(
        'UPDATE error_events SET resolved = TRUE WHERE id = $1 RETURNING *',
        [id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Error event not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Error resolving error event:', error)
      res.status(500).json({ error: 'Failed to resolve error event' })
    }
  }
)

router.get(
  '/correlation/:correlationId',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const { correlationId } = req.params

      const result = await query(
        `SELECT 
        id, correlation_id, layer, error_type, message, 
        stack_trace, context, user_id, task_id, severity, 
        resolved, created_at
      FROM error_events
      WHERE correlation_id = $1
      ORDER BY created_at ASC`,
        [correlationId]
      )

      res.json(result.rows)
    } catch (error) {
      console.error('Error fetching correlated errors:', error)
      res.status(500).json({ error: 'Failed to fetch correlated errors' })
    }
  }
)

export default router

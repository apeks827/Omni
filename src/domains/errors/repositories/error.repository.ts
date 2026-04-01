import { query } from '../../../config/database.js'

interface ErrorEvent {
  id: string
  correlation_id: string
  layer: string
  error_type: string
  message: string
  stack_trace?: string
  context?: any
  user_id?: string
  task_id?: string
  severity: string
  resolved: boolean
  created_at: Date
}

interface ErrorFilters {
  layer?: string
  severity?: string
  resolved?: boolean
  limit?: number
}

class ErrorRepository {
  async findAll(filters: ErrorFilters): Promise<ErrorEvent[]> {
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

    if (filters.layer) {
      paramCount++
      sql += ` AND layer = $${paramCount}`
      params.push(filters.layer)
    }

    if (filters.severity) {
      paramCount++
      sql += ` AND severity = $${paramCount}`
      params.push(filters.severity)
    }

    if (filters.resolved !== undefined) {
      paramCount++
      sql += ` AND resolved = $${paramCount}`
      params.push(filters.resolved)
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramCount + 1}`
    params.push(filters.limit || 50)

    const result = await query(sql, params)
    return result.rows
  }

  async resolve(id: string): Promise<ErrorEvent | null> {
    const result = await query(
      'UPDATE error_events SET resolved = TRUE WHERE id = $1 RETURNING *',
      [id]
    )
    return result.rows.length > 0 ? result.rows[0] : null
  }

  async findByCorrelationId(correlationId: string): Promise<ErrorEvent[]> {
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
    return result.rows
  }
}

export default new ErrorRepository()

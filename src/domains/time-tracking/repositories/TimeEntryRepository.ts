import { pool } from '../../../config/database.js'
import { TimeEntry } from '../models/TimeEntry.js'

export interface CreateTimeEntryData {
  task_id: string
  workspace_id: string
  user_id: string
  start_time: Date
  end_time?: Date
  duration_seconds: number
  type: 'manual' | 'timer' | 'pomodoro'
  pomodoro_type?: 'work' | 'break' | 'long_break'
  description?: string
  source?: 'client' | 'api' | 'import'
}

export interface TimeEntryFilters {
  task_id?: string
  start_date?: Date
  end_date?: Date
  type?: string
  limit?: number
  offset?: number
}

class TimeEntryRepository {
  async create(data: CreateTimeEntryData): Promise<TimeEntry> {
    const result = await pool.query(
      `INSERT INTO time_entries (
        task_id, workspace_id, user_id, start_time, end_time, 
        duration_seconds, type, pomodoro_type, description, source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        data.task_id,
        data.workspace_id,
        data.user_id,
        data.start_time,
        data.end_time || null,
        data.duration_seconds,
        data.type,
        data.pomodoro_type || null,
        data.description || null,
        data.source || 'client',
      ]
    )
    return result.rows[0]
  }

  async findById(
    id: string,
    workspaceId: string,
    userId?: string
  ): Promise<TimeEntry | null> {
    const query = userId
      ? 'SELECT * FROM time_entries WHERE id = $1 AND workspace_id = $2 AND user_id = $3'
      : 'SELECT * FROM time_entries WHERE id = $1 AND workspace_id = $2'
    const params = userId ? [id, workspaceId, userId] : [id, workspaceId]

    const result = await pool.query(query, params)
    return result.rows[0] || null
  }

  async findByFilters(
    workspaceId: string,
    userId: string,
    filters: TimeEntryFilters
  ): Promise<{ entries: TimeEntry[]; total: number }> {
    const conditions = ['workspace_id = $1', 'user_id = $2']
    const params: any[] = [workspaceId, userId]
    let paramIndex = 3

    if (filters.task_id) {
      conditions.push(`task_id = $${paramIndex}`)
      params.push(filters.task_id)
      paramIndex++
    }

    if (filters.start_date) {
      conditions.push(`start_time >= $${paramIndex}`)
      params.push(filters.start_date)
      paramIndex++
    }

    if (filters.end_date) {
      conditions.push(`start_time <= $${paramIndex}`)
      params.push(filters.end_date)
      paramIndex++
    }

    if (filters.type) {
      conditions.push(`type = $${paramIndex}`)
      params.push(filters.type)
      paramIndex++
    }

    const whereClause = conditions.join(' AND ')

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM time_entries WHERE ${whereClause}`,
      params
    )
    const total = parseInt(countResult.rows[0].count)

    const limit = filters.limit || 20
    const offset = filters.offset || 0

    const result = await pool.query(
      `SELECT * FROM time_entries 
       WHERE ${whereClause}
       ORDER BY start_time DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    )

    return {
      entries: result.rows,
      total,
    }
  }

  async update(
    id: string,
    workspaceId: string,
    data: Partial<CreateTimeEntryData>
  ): Promise<TimeEntry | null> {
    const fields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (data.start_time !== undefined) {
      fields.push(`start_time = $${paramIndex}`)
      values.push(data.start_time)
      paramIndex++
    }

    if (data.end_time !== undefined) {
      fields.push(`end_time = $${paramIndex}`)
      values.push(data.end_time)
      paramIndex++
    }

    if (data.duration_seconds !== undefined) {
      fields.push(`duration_seconds = $${paramIndex}`)
      values.push(data.duration_seconds)
      paramIndex++
    }

    if (data.description !== undefined) {
      fields.push(`description = $${paramIndex}`)
      values.push(data.description)
      paramIndex++
    }

    if (fields.length === 0) return this.findById(id, workspaceId)

    fields.push('updated_at = NOW()')
    const whereParamIndex = paramIndex
    values.push(id, workspaceId)

    const result = await pool.query(
      `UPDATE time_entries 
       SET ${fields.join(', ')}
       WHERE id = $${whereParamIndex} AND workspace_id = $${whereParamIndex + 1}
       RETURNING *`,
      values
    )

    return result.rows[0] || null
  }

  async delete(id: string, workspaceId: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM time_entries WHERE id = $1 AND workspace_id = $2',
      [id, workspaceId]
    )
    return result.rowCount !== null && result.rowCount > 0
  }

  async getByTask(
    workspaceId: string,
    userId: string,
    taskId: string | undefined,
    startDate: Date,
    endDate: Date
  ): Promise<TimeEntry[]> {
    const conditions = [
      'workspace_id = $1',
      'user_id = $2',
      'start_time >= $3',
      'start_time <= $4',
    ]
    const params: any[] = [workspaceId, userId, startDate, endDate]

    if (taskId) {
      conditions.push('task_id = $5')
      params.push(taskId)
    }

    const whereClause = conditions.join(' AND ')

    const result = await pool.query(
      `SELECT te.*, t.title as task_title, t.project_id 
       FROM time_entries te
       LEFT JOIN tasks t ON te.task_id = t.id
       WHERE ${whereClause}
       ORDER BY te.start_time DESC`,
      params
    )

    return result.rows
  }

  async getAnalytics(
    workspaceId: string,
    userId: string,
    startDate: Date,
    endDate: Date,
    groupBy: 'task' | 'day' | 'week' | 'project'
  ): Promise<any> {
    let groupByClause = ''
    let selectClause = ''

    switch (groupBy) {
      case 'task':
        selectClause = 'task_id'
        groupByClause = 'task_id'
        break
      case 'day':
        selectClause = 'DATE(start_time) as date'
        groupByClause = 'DATE(start_time)'
        break
      case 'week':
        selectClause = 'DATE_TRUNC(\'week\', start_time) as week'
        groupByClause = 'DATE_TRUNC(\'week\', start_time)'
        break
      case 'project':
        selectClause = 't.project_id'
        groupByClause = 't.project_id'
        break
    }

    const query = `
      SELECT 
        ${selectClause},
        SUM(te.duration_seconds) as total_seconds,
        COUNT(*) as entry_count
      FROM time_entries te
      ${groupBy === 'project' ? 'LEFT JOIN tasks t ON te.task_id = t.id' : ''}
      WHERE te.workspace_id = $1 
        AND te.user_id = $2
        AND te.start_time >= $3 
        AND te.start_time <= $4
      GROUP BY ${groupByClause}
      ORDER BY total_seconds DESC
    `

    const result = await pool.query(query, [
      workspaceId,
      userId,
      startDate,
      endDate,
    ])

    const totalResult = await pool.query(
      `SELECT 
        SUM(duration_seconds) as total_seconds,
        COUNT(*) as total_entries
       FROM time_entries
       WHERE workspace_id = $1 AND user_id = $2
         AND start_time >= $3 AND start_time <= $4`,
      [workspaceId, userId, startDate, endDate]
    )

    const pomodoroResult = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE pomodoro_type = 'work') as work_sessions,
        COUNT(*) FILTER (WHERE pomodoro_type = 'break') as break_sessions,
        SUM(duration_seconds) FILTER (WHERE pomodoro_type = 'work') as total_work_seconds
       FROM time_entries
       WHERE workspace_id = $1 AND user_id = $2 AND type = 'pomodoro'
         AND start_time >= $3 AND start_time <= $4`,
      [workspaceId, userId, startDate, endDate]
    )

    return {
      total_seconds: parseInt(totalResult.rows[0].total_seconds || 0),
      total_entries: parseInt(totalResult.rows[0].total_entries || 0),
      breakdown: result.rows,
      pomodoro_stats: {
        work_sessions: parseInt(pomodoroResult.rows[0].work_sessions || 0),
        break_sessions: parseInt(pomodoroResult.rows[0].break_sessions || 0),
        total_work_seconds: parseInt(
          pomodoroResult.rows[0].total_work_seconds || 0
        ),
      },
    }
  }
}

export default new TimeEntryRepository()

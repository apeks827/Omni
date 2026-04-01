import { pool } from '../../../config/database.js'
import {
  ActivityEvent,
  ActivityEventWithDetails,
  ActivityFeedFilters,
  ActivityCursor,
} from '../../../../shared/types/activity.js'

export class ActivityRepository {
  async create(data: {
    workspace_id: string
    user_id: string
    event_type: string
    entity_type: string
    entity_id: string
    action: string
    field_changes?: unknown[]
    previous_value?: unknown
    new_value?: unknown
    metadata?: Record<string, unknown>
    source: string
    parent_entity_type?: string
    parent_entity_id?: string
    related_entity_type?: string
    related_entity_id?: string
  }): Promise<ActivityEvent> {
    const id = crypto.randomUUID()
    const fieldChangesJson = data.field_changes
      ? JSON.stringify(data.field_changes)
      : null

    const result = await pool.query(
      `INSERT INTO activity_events (
        id, workspace_id, user_id, event_type, entity_type, entity_id,
        action, field_changes, previous_value, new_value, metadata,
        source, parent_entity_type, parent_entity_id,
        related_entity_type, related_entity_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
      RETURNING *`,
      [
        id,
        data.workspace_id,
        data.user_id,
        data.event_type,
        data.entity_type,
        data.entity_id,
        data.action,
        fieldChangesJson,
        data.previous_value ? JSON.stringify(data.previous_value) : null,
        data.new_value ? JSON.stringify(data.new_value) : null,
        data.metadata ? JSON.stringify(data.metadata) : null,
        data.source,
        data.parent_entity_type || null,
        data.parent_entity_id || null,
        data.related_entity_type || null,
        data.related_entity_id || null,
      ]
    )

    return this.mapRow(result.rows[0])
  }

  async findById(
    id: string,
    workspaceId: string
  ): Promise<ActivityEventWithDetails | null> {
    const result = await pool.query(
      `SELECT ae.*,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'avatar_url', u.avatar_url
        ) as user,
        CASE
          WHEN ae.entity_type = 'task' THEN json_build_object('id', t.id, 'title', t.title, 'type', 'task')
          WHEN ae.entity_type = 'project' THEN json_build_object('id', p.id, 'name', p.name, 'type', 'project')
          WHEN ae.entity_type = 'comment' THEN json_build_object('id', c.id, 'title', LEFT(c.content, 100), 'type', 'comment')
          ELSE NULL
        END as entity
      FROM activity_events ae
      JOIN users u ON u.id = ae.user_id
      LEFT JOIN tasks t ON ae.entity_type = 'task' AND ae.entity_id = t.id
      LEFT JOIN projects p ON ae.entity_type = 'project' AND ae.entity_id = p.id
      LEFT JOIN comments c ON ae.entity_type = 'comment' AND ae.entity_id = c.id
      WHERE ae.id = $1 AND ae.workspace_id = $2`,
      [id, workspaceId]
    )

    if (result.rows.length === 0) return null
    return this.mapRowWithDetails(result.rows[0])
  }

  async list(
    workspaceId: string,
    filters: ActivityFeedFilters
  ): Promise<{ events: ActivityEventWithDetails[]; totalCount: number }> {
    const conditions: string[] = ['ae.workspace_id = $1']
    const params: (string | string[] | Date)[] = [workspaceId]
    let paramIndex = 2

    if (filters.entity_type) {
      const types = Array.isArray(filters.entity_type)
        ? filters.entity_type
        : [filters.entity_type]
      conditions.push(`ae.entity_type = ANY($${paramIndex})`)
      params.push(types)
      paramIndex++
    }

    if (filters.entity_id) {
      conditions.push('ae.entity_id = $' + paramIndex)
      params.push(filters.entity_id)
      paramIndex++
    }

    if (filters.event_type) {
      const types = Array.isArray(filters.event_type)
        ? filters.event_type
        : [filters.event_type]
      conditions.push(`ae.event_type = ANY($${paramIndex})`)
      params.push(types)
      paramIndex++
    }

    if (filters.user_id) {
      const users = Array.isArray(filters.user_id)
        ? filters.user_id
        : [filters.user_id]
      conditions.push(`ae.user_id = ANY($${paramIndex})`)
      params.push(users)
      paramIndex++
    }

    if (filters.action) {
      const actions = Array.isArray(filters.action)
        ? filters.action
        : [filters.action]
      conditions.push(`ae.action = ANY($${paramIndex})`)
      params.push(actions)
      paramIndex++
    }

    if (filters.start_date) {
      conditions.push(`ae.created_at >= $${paramIndex}`)
      params.push(filters.start_date)
      paramIndex++
    }

    if (filters.end_date) {
      conditions.push(`ae.created_at <= $${paramIndex}`)
      params.push(filters.end_date)
      paramIndex++
    }

    if (filters.cursor) {
      try {
        const cursor: ActivityCursor = JSON.parse(
          Buffer.from(filters.cursor, 'base64').toString()
        )
        conditions.push(
          `(ae.created_at < $${paramIndex} OR (ae.created_at = $${paramIndex} AND ae.id < $${paramIndex + 1}))`
        )
        params.push(cursor.last_created_at, cursor.last_id)
        paramIndex += 2
      } catch (_e) {
        // Invalid cursor, ignore
      }
    }

    const whereClause = conditions.join(' AND ')

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM activity_events ae WHERE ${whereClause}`,
      params
    )
    const totalCount = parseInt(countResult.rows[0].count)

    const limit = filters.limit || 50

    const result = await pool.query(
      `SELECT ae.*,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'avatar_url', u.avatar_url
        ) as user,
        CASE
          WHEN ae.entity_type = 'task' THEN json_build_object('id', t.id, 'title', t.title, 'type', 'task')
          WHEN ae.entity_type = 'project' THEN json_build_object('id', p.id, 'name', p.name, 'type', 'project')
          WHEN ae.entity_type = 'comment' THEN json_build_object('id', c.id, 'title', LEFT(c.content, 100), 'type', 'comment')
          ELSE NULL
        END as entity
      FROM activity_events ae
      JOIN users u ON u.id = ae.user_id
      LEFT JOIN tasks t ON ae.entity_type = 'task' AND ae.entity_id = t.id
      LEFT JOIN projects p ON ae.entity_type = 'project' AND ae.entity_id = p.id
      LEFT JOIN comments c ON ae.entity_type = 'comment' AND ae.entity_id = c.id
      WHERE ${whereClause}
      ORDER BY ae.created_at DESC, ae.id DESC
      LIMIT $${paramIndex}`,
      [...params, limit + 1]
    )

    const events = result.rows.map(row => this.mapRowWithDetails(row))
    return { events, totalCount }
  }

  async getForTask(
    taskId: string,
    workspaceId: string,
    limit: number = 50
  ): Promise<{
    events: ActivityEventWithDetails[]
    subtasks: { task_id: string; events: ActivityEventWithDetails[] }[]
  }> {
    const taskResult = await pool.query(
      `SELECT ae.*,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'avatar_url', u.avatar_url
        ) as user,
        json_build_object('id', t.id, 'title', t.title, 'type', 'task') as entity
      FROM activity_events ae
      JOIN users u ON u.id = ae.user_id
      LEFT JOIN tasks t ON ae.entity_type = 'task' AND ae.entity_id = t.id
      WHERE ae.entity_id = $1 AND ae.workspace_id = $2
      ORDER BY ae.created_at DESC
      LIMIT $3`,
      [taskId, workspaceId, limit]
    )

    const subtaskIdsResult = await pool.query(
      'SELECT id FROM tasks WHERE parent_id = $1',
      [taskId]
    )
    const subtaskIds = subtaskIdsResult.rows.map(r => r.id)

    let subtasks: { task_id: string; events: ActivityEventWithDetails[] }[] = []
    if (subtaskIds.length > 0) {
      const subtaskEventsResult = await pool.query(
        `SELECT ae.*, t.id as subtask_id,
          json_build_object(
            'id', u.id,
            'name', u.name,
            'avatar_url', u.avatar_url
          ) as user,
          json_build_object('id', st.id, 'title', st.title, 'type', 'task') as entity
        FROM activity_events ae
        JOIN users u ON u.id = ae.user_id
        LEFT JOIN tasks t ON ae.entity_id = t.id
        LEFT JOIN tasks st ON ae.entity_type = 'task' AND ae.entity_id = st.id
        WHERE ae.entity_id = ANY($1) AND ae.workspace_id = $2
        ORDER BY ae.created_at DESC
        LIMIT $3`,
        [subtaskIds, workspaceId, limit]
      )

      const subtaskMap = new Map<string, ActivityEventWithDetails[]>()
      for (const row of subtaskEventsResult.rows) {
        const events = subtaskMap.get(row.subtask_id) || []
        events.push(this.mapRowWithDetails(row))
        subtaskMap.set(row.subtask_id, events)
      }

      subtasks = Array.from(subtaskMap.entries()).map(([task_id, events]) => ({
        task_id,
        events,
      }))
    }

    const events = taskResult.rows.map(row => this.mapRowWithDetails(row))
    return { events, subtasks }
  }

  private mapRow(row: Record<string, unknown>): ActivityEvent {
    return {
      id: row.id as string,
      workspace_id: row.workspace_id as string,
      user_id: row.user_id as string,
      event_type: row.event_type as ActivityEvent['event_type'],
      entity_type: row.entity_type as ActivityEvent['entity_type'],
      entity_id: row.entity_id as string,
      action: row.action as ActivityEvent['action'],
      field_changes: row.field_changes as ActivityEvent['field_changes'],
      previous_value: row.previous_value as ActivityEvent['previous_value'],
      new_value: row.new_value as ActivityEvent['new_value'],
      metadata: row.metadata as ActivityEvent['metadata'],
      source: row.source as ActivityEvent['source'],
      parent_entity_type:
        row.parent_entity_type as ActivityEvent['parent_entity_type'],
      parent_entity_id:
        row.parent_entity_id as ActivityEvent['parent_entity_id'],
      related_entity_type:
        row.related_entity_type as ActivityEvent['related_entity_type'],
      related_entity_id:
        row.related_entity_id as ActivityEvent['related_entity_id'],
      created_at: row.created_at as Date,
    }
  }

  private mapRowWithDetails(
    row: Record<string, unknown>
  ): ActivityEventWithDetails {
    return {
      ...this.mapRow(row),
      user: row.user as ActivityEventWithDetails['user'],
      entity: row.entity as ActivityEventWithDetails['entity'],
    }
  }
}

export default new ActivityRepository()

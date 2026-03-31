import { query } from '../../../config/database.js'

export interface Task {
  id: string
  title: string
  description?: string
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  project_id?: string
  assignee_id?: string
  creator_id: string
  workspace_id: string
  due_date?: Date
  created_at: Date
  updated_at: Date
  deleted_at?: Date | null
  labels?: Array<{ id: string; name: string; color?: string }>
  preferred_device?: string[]
  preferred_time_of_day?: string[]
  context_tags?: string[]
  context_score?: number
}

export interface TaskFilters {
  status?: string
  priority?: string
  project_id?: string
  label_id?: string
  page?: number
  limit?: number
  include_deleted?: boolean
  context_device?: string
  context_time_of_day?: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateTaskData {
  title: string
  description?: string
  status?: string
  priority?: string
  project_id?: string
  assignee_id?: string
  creator_id: string
  workspace_id: string
  due_date?: Date | string
  label_ids?: string[]
  preferred_device?: string[]
  preferred_time_of_day?: string[]
  context_tags?: string[]
}

export interface UpdateTaskData {
  title?: string
  description?: string
  status?: string
  priority?: string
  project_id?: string
  assignee_id?: string
  due_date?: Date
  label_ids?: string[]
  preferred_device?: string[]
  preferred_time_of_day?: string[]
  context_tags?: string[]
}

class TaskRepository {
  private async attachLabels(
    taskId: string,
    labelIds: string[]
  ): Promise<void> {
    if (!labelIds || labelIds.length === 0) return

    const values = labelIds.map((_, i) => `($1, $${i + 2})`).join(', ')
    await query(
      `INSERT INTO task_labels (task_id, label_id) VALUES ${values} ON CONFLICT (task_id, label_id) DO NOTHING`,
      [taskId, ...labelIds]
    )
  }

  async setTaskLabels(taskId: string, labelIds: string[]): Promise<void> {
    await query('DELETE FROM task_labels WHERE task_id = $1', [taskId])
    await this.attachLabels(taskId, labelIds)
  }

  async getTaskLabels(
    taskId: string
  ): Promise<Array<{ id: string; name: string; color?: string }>> {
    const result = await query(
      `SELECT l.id, l.name, l.color FROM labels l
       INNER JOIN task_labels tl ON l.id = tl.label_id
       WHERE tl.task_id = $1`,
      [taskId]
    )
    return result.rows
  }

  async getTaskLabelsForMultipleTasks(
    taskIds: string[]
  ): Promise<Map<string, Array<{ id: string; name: string; color?: string }>>> {
    if (taskIds.length === 0) return new Map()

    const placeholders = taskIds.map((_, i) => `$${i + 1}`).join(', ')
    const result = await query(
      `SELECT tl.task_id, l.id, l.name, l.color 
       FROM labels l
       INNER JOIN task_labels tl ON l.id = tl.label_id
       WHERE tl.task_id IN (${placeholders})`,
      taskIds
    )

    const labelsMap = new Map<
      string,
      Array<{ id: string; name: string; color?: string }>
    >()
    for (const row of result.rows) {
      if (!labelsMap.has(row.task_id)) {
        labelsMap.set(row.task_id, [])
      }
      labelsMap.get(row.task_id)!.push({
        id: row.id,
        name: row.name,
        color: row.color,
      })
    }

    return labelsMap
  }

  async findByWorkspace(
    workspaceId: string,
    filters: TaskFilters = {}
  ): Promise<PaginatedResult<Task>> {
    const page = Math.max(1, filters.page || 1)
    const limit = Math.min(100, Math.max(1, filters.limit || 20))
    const offset = (page - 1) * limit

    let queryText = 'SELECT t.* FROM tasks t WHERE t.workspace_id = $1'
    let countQuery = 'SELECT COUNT(*) FROM tasks t WHERE t.workspace_id = $1'
    const params: string[] = [workspaceId]
    const countParams: string[] = [workspaceId]
    let paramIndex = 2
    let countParamIndex = 2

    if (!filters.include_deleted) {
      queryText += ' AND t.deleted_at IS NULL'
    }

    if (filters.status) {
      queryText += ` AND t.status = $${paramIndex}`
      countQuery += ` AND t.status = $${countParamIndex}`
      params.push(filters.status)
      countParams.push(filters.status)
      paramIndex++
      countParamIndex++
    }

    if (filters.priority) {
      queryText += ` AND t.priority = $${paramIndex}`
      countQuery += ` AND t.priority = $${countParamIndex}`
      params.push(filters.priority)
      countParams.push(filters.priority)
      paramIndex++
      countParamIndex++
    }

    if (filters.project_id) {
      queryText += ` AND t.project_id = $${paramIndex}`
      countQuery += ` AND t.project_id = $${countParamIndex}`
      params.push(filters.project_id)
      countParams.push(filters.project_id)
      paramIndex++
      countParamIndex++
    }

    if (filters.label_id) {
      queryText += ` AND t.id IN (
        SELECT task_id FROM task_labels WHERE label_id = $${paramIndex}
      )`
      countQuery += ` AND t.id IN (
        SELECT task_id FROM task_labels WHERE label_id = $${countParamIndex}
      )`
      params.push(filters.label_id)
      countParams.push(filters.label_id)
      paramIndex++
      countParamIndex++
    }

    const countResult = await query(countQuery, countParams)
    const total = parseInt(countResult.rows[0].count, 10)
    const totalPages = Math.ceil(total / limit)

    if (filters.context_device || filters.context_time_of_day) {
      queryText = `
        SELECT t.*,
          COALESCE(
            CASE
              WHEN t.preferred_device @> ARRAY[$1]::TEXT[] AND t.preferred_time_of_day @> ARRAY[$2]::TEXT[] THEN 100
              WHEN t.preferred_device @> ARRAY[$1]::TEXT[] OR t.preferred_time_of_day @> ARRAY[$2]::TEXT[] THEN 75
              WHEN array_length(t.preferred_device, 1) IS NULL AND array_length(t.preferred_time_of_day, 1) IS NULL THEN 50
              ELSE 0
            END, 50
          ) as context_score
        FROM tasks t
        WHERE t.workspace_id = $1
        ${filters.include_deleted ? '' : 'AND t.deleted_at IS NULL'}
      `
      params.push(
        filters.context_device || '',
        filters.context_time_of_day || ''
      )
      paramIndex = 3

      if (filters.status) {
        queryText += ` AND t.status = $${paramIndex}`
        params.push(filters.status)
        paramIndex++
      }
      if (filters.priority) {
        queryText += ` AND t.priority = $${paramIndex}`
        params.push(filters.priority)
        paramIndex++
      }
      if (filters.project_id) {
        queryText += ` AND t.project_id = $${paramIndex}`
        params.push(filters.project_id)
        paramIndex++
      }

      queryText += ` ORDER BY context_score DESC, t.priority DESC, t.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(String(limit), String(offset))
    } else {
      queryText += ` ORDER BY t.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(String(limit), String(offset))
    }

    const result = await query(queryText, params)
    const tasks = result.rows as Task[]

    if (tasks.length > 0) {
      const taskIds = tasks.map(t => t.id)
      const labelsMap = await this.getTaskLabelsForMultipleTasks(taskIds)
      for (const task of tasks) {
        task.labels = labelsMap.get(task.id) || []
      }
    }

    return {
      data: tasks,
      total,
      page,
      limit,
      totalPages,
    }
  }

  async findById(id: string, workspaceId: string): Promise<Task | null> {
    const result = await query(
      'SELECT * FROM tasks WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL',
      [id, workspaceId]
    )
    if (result.rows.length === 0) return null

    const task = result.rows[0] as Task
    const labelsMap = await this.getTaskLabelsForMultipleTasks([task.id])
    task.labels = labelsMap.get(task.id) || []
    return task
  }

  async create(data: CreateTaskData): Promise<Task> {
    const result = await query(
      `INSERT INTO tasks (title, description, status, priority, project_id, assignee_id, creator_id, workspace_id, due_date, preferred_device, preferred_time_of_day, context_tags) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        data.title,
        data.description,
        data.status || 'todo',
        data.priority || 'medium',
        data.project_id,
        data.assignee_id,
        data.creator_id,
        data.workspace_id,
        data.due_date,
        data.preferred_device || [],
        data.preferred_time_of_day || [],
        data.context_tags || [],
      ]
    )
    const task = result.rows[0] as Task

    if (data.label_ids && data.label_ids.length > 0) {
      await this.attachLabels(task.id, data.label_ids)
      task.labels = await this.getTaskLabels(task.id)
    } else {
      task.labels = []
    }

    return task
  }

  async update(
    id: string,
    workspaceId: string,
    data: UpdateTaskData
  ): Promise<Task | null> {
    const setClauses: string[] = ['updated_at = NOW()']
    const values: any[] = []
    let paramIndex = 1

    if (data.title !== undefined) {
      setClauses.push(`title = $${paramIndex}`)
      values.push(data.title)
      paramIndex++
    }

    if (data.description !== undefined) {
      setClauses.push(`description = $${paramIndex}`)
      values.push(data.description)
      paramIndex++
    }

    if (data.status !== undefined) {
      setClauses.push(`status = $${paramIndex}`)
      values.push(data.status)
      paramIndex++
    }

    if (data.priority !== undefined) {
      setClauses.push(`priority = $${paramIndex}`)
      values.push(data.priority)
      paramIndex++
    }

    if (data.project_id !== undefined) {
      setClauses.push(`project_id = $${paramIndex}`)
      values.push(data.project_id)
      paramIndex++
    }

    if (data.assignee_id !== undefined) {
      setClauses.push(`assignee_id = $${paramIndex}`)
      values.push(data.assignee_id)
      paramIndex++
    }

    if (data.due_date !== undefined) {
      setClauses.push(`due_date = $${paramIndex}`)
      values.push(data.due_date)
      paramIndex++
    }

    if (data.preferred_device !== undefined) {
      setClauses.push(`preferred_device = $${paramIndex}`)
      values.push(data.preferred_device)
      paramIndex++
    }

    if (data.preferred_time_of_day !== undefined) {
      setClauses.push(`preferred_time_of_day = $${paramIndex}`)
      values.push(data.preferred_time_of_day)
      paramIndex++
    }

    if (data.context_tags !== undefined) {
      setClauses.push(`context_tags = $${paramIndex}`)
      values.push(data.context_tags)
      paramIndex++
    }

    values.push(id, workspaceId)

    const result = await query(
      `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = $${paramIndex} AND workspace_id = $${paramIndex + 1} RETURNING *`,
      values
    )
    if (result.rows.length === 0) return null

    const task = result.rows[0] as Task

    if (data.label_ids !== undefined) {
      await this.setTaskLabels(task.id, data.label_ids || [])
      task.labels =
        data.label_ids.length > 0 ? await this.getTaskLabels(task.id) : []
    } else {
      task.labels = await this.getTaskLabels(task.id)
    }

    return task
  }

  async delete(id: string, workspaceId: string): Promise<boolean> {
    const result = await query(
      'UPDATE tasks SET deleted_at = NOW() WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL RETURNING id',
      [id, workspaceId]
    )
    return result.rows.length > 0
  }

  async hasWorkspaceResource(
    table: 'projects' | 'users',
    id: string,
    workspaceId: string
  ): Promise<boolean> {
    const result = await query(
      `SELECT id FROM ${table} WHERE id = $1 AND workspace_id = $2`,
      [id, workspaceId]
    )
    return result.rows.length > 0
  }

  async createScheduleSlot(
    userId: string,
    taskId: string,
    startTime: Date,
    endTime: Date
  ): Promise<void> {
    await query(
      'INSERT INTO schedule_slots (user_id, task_id, start_time, end_time, status) VALUES ($1, $2, $3, $4, $5)',
      [userId, taskId, startTime, endTime, 'scheduled']
    )
  }

  async findByIdsAndWorkspace(
    taskIds: string[],
    workspaceId: string
  ): Promise<Task[]> {
    if (taskIds.length === 0) return []

    const placeholders = taskIds.map((_, i) => `$${i + 1}`).join(', ')
    const result = await query(
      `SELECT * FROM tasks WHERE id IN (${placeholders}) AND workspace_id = $${taskIds.length + 1}`,
      [...taskIds, workspaceId]
    )
    return result.rows as Task[]
  }

  async bulkUpdate(
    taskIds: string[],
    workspaceId: string,
    data: UpdateTaskData
  ): Promise<{ updatedCount: number; taskIds: string[] }> {
    if (taskIds.length === 0) return { updatedCount: 0, taskIds: [] }

    const existingTasks = await this.findByIdsAndWorkspace(taskIds, workspaceId)
    const existingTaskIds = new Set(existingTasks.map(t => t.id))

    const validTaskIds = taskIds.filter(id => existingTaskIds.has(id))

    if (validTaskIds.length === 0) {
      return { updatedCount: 0, taskIds: [] }
    }

    const setClauses: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (data.status !== undefined) {
      setClauses.push(`status = $${paramIndex}`)
      values.push(data.status)
      paramIndex++
    }

    if (data.priority !== undefined) {
      setClauses.push(`priority = $${paramIndex}`)
      values.push(data.priority)
      paramIndex++
    }

    if (data.project_id !== undefined) {
      setClauses.push(`project_id = $${paramIndex}`)
      values.push(data.project_id)
      paramIndex++
    }

    if (data.due_date !== undefined) {
      setClauses.push(`due_date = $${paramIndex}`)
      values.push(data.due_date)
      paramIndex++
    }

    if (setClauses.length === 0) {
      return { updatedCount: 0, taskIds: validTaskIds }
    }

    setClauses.push('updated_at = NOW()')

    const placeholders = validTaskIds
      .map((_, i) => `$${paramIndex + i}`)
      .join(', ')

    const updateQuery = `
      UPDATE tasks 
      SET ${setClauses.join(', ')}
      WHERE id IN (${placeholders}) AND workspace_id = $${paramIndex + validTaskIds.length}
    `

    const result = await query(updateQuery, [
      ...values,
      ...validTaskIds,
      workspaceId,
    ])

    return { updatedCount: result.rowCount || 0, taskIds: validTaskIds }
  }

  async bulkDelete(
    taskIds: string[],
    workspaceId: string
  ): Promise<{ deletedCount: number; taskIds: string[] }> {
    if (taskIds.length === 0) return { deletedCount: 0, taskIds: [] }

    const existingTasks = await this.findByIdsAndWorkspace(taskIds, workspaceId)
    const existingTaskIds = existingTasks.map(t => t.id)

    if (existingTaskIds.length === 0) {
      return { deletedCount: 0, taskIds: [] }
    }

    const placeholders = existingTaskIds.map((_, i) => `$${i + 1}`).join(', ')

    const result = await query(
      `DELETE FROM tasks WHERE id IN (${placeholders}) AND workspace_id = $${existingTaskIds.length + 1}`,
      [...existingTaskIds, workspaceId]
    )

    return { deletedCount: result.rowCount || 0, taskIds: existingTaskIds }
  }

  async bulkMoveToProject(
    taskIds: string[],
    workspaceId: string,
    projectId: string
  ): Promise<{ movedCount: number; taskIds: string[] }> {
    if (taskIds.length === 0) return { movedCount: 0, taskIds: [] }

    const existingTasks = await this.findByIdsAndWorkspace(taskIds, workspaceId)
    const existingTaskIds = existingTasks.map(t => t.id)

    if (existingTaskIds.length === 0) {
      return { movedCount: 0, taskIds: [] }
    }

    const placeholders = existingTaskIds.map((_, i) => `$${i + 1}`).join(', ')

    const result = await query(
      `UPDATE tasks SET project_id = $1, updated_at = NOW() WHERE id IN (${placeholders}) AND workspace_id = $${existingTaskIds.length + 1}`,
      [projectId, ...existingTaskIds, workspaceId]
    )

    return { movedCount: result.rowCount || 0, taskIds: existingTaskIds }
  }
}

export default new TaskRepository()

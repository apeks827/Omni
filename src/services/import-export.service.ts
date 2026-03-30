import { pool } from '../config/database.js'
import { AppError, ErrorCodes } from '../utils/errors.js'
import taskService from '../domains/tasks/services/TaskService.js'

interface ExportFilters {
  status?: string
  priority?: string
  project_id?: string
  label_id?: string
  date_from?: string
  date_to?: string
}

interface ExportResult {
  data: string
  contentType: string
  filename: string
}

interface ImportMapping {
  [key: string]: string
}

interface ImportOptions {
  skip_duplicates?: boolean
  update_existing?: boolean
  preserve_ids?: boolean
}

interface ImportPreview {
  total_tasks: number
  new_tasks: number
  duplicate_tasks: number
  conflicts: Array<{
    task_title: string
    reason: string
  }>
  sample_tasks: Array<any>
}

interface ImportResult {
  imported_count: number
  updated_count: number
  skipped_count: number
  failed_count: number
  errors: Array<{
    task_title: string
    error: string
  }>
}

export async function exportTasks(
  workspaceId: string,
  format: 'json' | 'csv' | 'markdown' | 'ical',
  filters?: ExportFilters
): Promise<ExportResult> {
  let query = `
    SELECT t.*, 
           p.name as project_name,
           array_agg(DISTINCT l.name) FILTER (WHERE l.id IS NOT NULL) as label_names
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN task_labels tl ON t.id = tl.task_id
    LEFT JOIN labels l ON tl.label_id = l.id
    WHERE t.workspace_id = $1
  `
  const params: any[] = [workspaceId]
  let paramIndex = 2

  if (filters?.status) {
    query += ` AND t.status = $${paramIndex}`
    params.push(filters.status)
    paramIndex++
  }

  if (filters?.priority) {
    query += ` AND t.priority = $${paramIndex}`
    params.push(filters.priority)
    paramIndex++
  }

  if (filters?.project_id) {
    query += ` AND t.project_id = $${paramIndex}`
    params.push(filters.project_id)
    paramIndex++
  }

  if (filters?.label_id) {
    query += ` AND EXISTS (SELECT 1 FROM task_labels WHERE task_id = t.id AND label_id = $${paramIndex})`
    params.push(filters.label_id)
    paramIndex++
  }

  if (filters?.date_from) {
    query += ` AND t.due_date >= $${paramIndex}`
    params.push(filters.date_from)
    paramIndex++
  }

  if (filters?.date_to) {
    query += ` AND t.due_date <= $${paramIndex}`
    params.push(filters.date_to)
    paramIndex++
  }

  query += ' GROUP BY t.id, p.name ORDER BY t.created_at DESC'

  const result = await pool.query(query, params)
  const tasks = result.rows

  switch (format) {
    case 'json':
      return {
        data: JSON.stringify(tasks, null, 2),
        contentType: 'application/json',
        filename: `tasks-export-${Date.now()}.json`,
      }

    case 'csv':
      return {
        data: convertToCSV(tasks),
        contentType: 'text/csv',
        filename: `tasks-export-${Date.now()}.csv`,
      }

    case 'markdown':
      return {
        data: convertToMarkdown(tasks),
        contentType: 'text/markdown',
        filename: `tasks-export-${Date.now()}.md`,
      }

    case 'ical':
      return {
        data: convertToICal(tasks),
        contentType: 'text/calendar',
        filename: `tasks-export-${Date.now()}.ics`,
      }

    default:
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Invalid export format')
  }
}

export async function previewImport(
  workspaceId: string,
  data: string,
  format: 'json' | 'csv' | 'markdown' | 'ical',
  mapping?: ImportMapping
): Promise<ImportPreview> {
  const parsedTasks = parseImportData(data, format, mapping)

  const existingTitles = await pool.query(
    'SELECT title FROM tasks WHERE workspace_id = $1',
    [workspaceId]
  )
  const existingTitlesSet = new Set(
    existingTitles.rows.map(r => r.title.toLowerCase())
  )

  let newTasks = 0
  let duplicateTasks = 0
  const conflicts: Array<{ task_title: string; reason: string }> = []

  for (const task of parsedTasks) {
    if (existingTitlesSet.has(task.title?.toLowerCase())) {
      duplicateTasks++
      conflicts.push({
        task_title: task.title,
        reason: 'Task with same title already exists',
      })
    } else {
      newTasks++
    }
  }

  return {
    total_tasks: parsedTasks.length,
    new_tasks: newTasks,
    duplicate_tasks: duplicateTasks,
    conflicts,
    sample_tasks: parsedTasks.slice(0, 5),
  }
}

export async function importTasks(
  workspaceId: string,
  userId: string,
  data: string,
  format: 'json' | 'csv' | 'markdown' | 'ical',
  mapping?: ImportMapping,
  options?: ImportOptions
): Promise<ImportResult> {
  const parsedTasks = parseImportData(data, format, mapping)

  let importedCount = 0
  let updatedCount = 0
  let skippedCount = 0
  let failedCount = 0
  const errors: Array<{ task_title: string; error: string }> = []

  for (const task of parsedTasks) {
    try {
      const existingTask = await pool.query(
        'SELECT id FROM tasks WHERE workspace_id = $1 AND LOWER(title) = LOWER($2)',
        [workspaceId, task.title]
      )

      if (existingTask.rows.length > 0) {
        if (options?.skip_duplicates) {
          skippedCount++
          continue
        }

        if (options?.update_existing) {
          await taskService.updateTask(
            existingTask.rows[0].id,
            workspaceId,
            userId,
            task
          )
          updatedCount++
        } else {
          skippedCount++
        }
      } else {
        await taskService.createTask(workspaceId, userId, task)
        importedCount++
      }
    } catch (error) {
      failedCount++
      errors.push({
        task_title: task.title || 'Unknown',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return {
    imported_count: importedCount,
    updated_count: updatedCount,
    skipped_count: skippedCount,
    failed_count: failedCount,
    errors,
  }
}

function parseImportData(
  data: string,
  format: 'json' | 'csv' | 'markdown' | 'ical',
  mapping?: ImportMapping
): Array<any> {
  switch (format) {
    case 'json':
      return parseJSON(data, mapping)
    case 'csv':
      return parseCSV(data, mapping)
    case 'markdown':
      return parseMarkdown(data)
    case 'ical':
      return parseICal(data)
    default:
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Invalid import format')
  }
}

function parseJSON(data: string, mapping?: ImportMapping): Array<any> {
  const parsed = JSON.parse(data)
  const tasks = Array.isArray(parsed) ? parsed : [parsed]

  if (!mapping) return tasks

  return tasks.map(task => {
    const mapped: any = {}
    for (const [sourceKey, targetKey] of Object.entries(mapping)) {
      if (task[sourceKey] !== undefined) {
        mapped[targetKey] = task[sourceKey]
      }
    }
    return mapped
  })
}

function parseCSV(data: string, mapping?: ImportMapping): Array<any> {
  const lines = data.trim().split('\n')
  if (lines.length < 2) {
    throw new AppError(
      ErrorCodes.VALIDATION_ERROR,
      'CSV must have header and at least one row'
    )
  }

  const headers = lines[0].split(',').map(h => h.trim())
  const tasks: Array<any> = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    const task: any = {}

    headers.forEach((header, index) => {
      const key = mapping?.[header] || header
      task[key] = values[index]
    })

    tasks.push(task)
  }

  return tasks
}

function parseMarkdown(data: string): Array<any> {
  const tasks: Array<any> = []
  const lines = data.split('\n')

  for (const line of lines) {
    const taskMatch = line.match(/^[-*]\s+\[[ x]\]\s+(.+)$/)
    if (taskMatch) {
      tasks.push({
        title: taskMatch[1].trim(),
        status: line.includes('[x]') ? 'done' : 'todo',
      })
    }
  }

  return tasks
}

function parseICal(data: string): Array<any> {
  const tasks: Array<any> = []
  const events = data.split('BEGIN:VTODO')

  for (let i = 1; i < events.length; i++) {
    const event = events[i]
    const task: any = {}

    const summaryMatch = event.match(/SUMMARY:(.+)/)
    if (summaryMatch) task.title = summaryMatch[1].trim()

    const descMatch = event.match(/DESCRIPTION:(.+)/)
    if (descMatch) task.description = descMatch[1].trim()

    const dueMatch = event.match(/DUE:(.+)/)
    if (dueMatch) task.due_date = dueMatch[1].trim()

    const priorityMatch = event.match(/PRIORITY:(\d+)/)
    if (priorityMatch) {
      const priority = parseInt(priorityMatch[1])
      task.priority = priority <= 3 ? 'high' : priority <= 6 ? 'medium' : 'low'
    }

    if (task.title) tasks.push(task)
  }

  return tasks
}

function convertToCSV(tasks: Array<any>): string {
  if (tasks.length === 0) return ''

  const headers = [
    'id',
    'title',
    'description',
    'status',
    'priority',
    'project_name',
    'due_date',
    'created_at',
  ]
  const rows = tasks.map(task =>
    headers
      .map(h => {
        const value = task[h]
        if (value === null || value === undefined) return ''
        if (typeof value === 'string' && value.includes(','))
          return `"${value}"`
        return value
      })
      .join(',')
  )

  return [headers.join(','), ...rows].join('\n')
}

function convertToMarkdown(tasks: Array<any>): string {
  let md = '# Tasks Export\n\n'

  for (const task of tasks) {
    const checkbox = task.status === 'done' ? '[x]' : '[ ]'
    md += `- ${checkbox} **${task.title}**\n`
    if (task.description) md += `  ${task.description}\n`
    if (task.priority) md += `  Priority: ${task.priority}\n`
    if (task.due_date)
      md += `  Due: ${new Date(task.due_date).toLocaleDateString()}\n`
    if (task.project_name) md += `  Project: ${task.project_name}\n`
    md += '\n'
  }

  return md
}

function convertToICal(tasks: Array<any>): string {
  let ical = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Task Manager//EN\n'

  for (const task of tasks) {
    ical += 'BEGIN:VTODO\n'
    ical += `UID:${task.id}\n`
    ical += `SUMMARY:${task.title}\n`
    if (task.description) ical += `DESCRIPTION:${task.description}\n`
    if (task.due_date)
      ical += `DUE:${new Date(task.due_date).toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`

    const priorityMap: any = { critical: 1, high: 3, medium: 5, low: 7 }
    if (task.priority) ical += `PRIORITY:${priorityMap[task.priority] || 5}\n`

    const statusMap: any = {
      todo: 'NEEDS-ACTION',
      in_progress: 'IN-PROCESS',
      done: 'COMPLETED',
    }
    if (task.status)
      ical += `STATUS:${statusMap[task.status] || 'NEEDS-ACTION'}\n`

    ical += 'END:VTODO\n'
  }

  ical += 'END:VCALENDAR\n'
  return ical
}

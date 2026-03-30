import { pool } from '../config/database.js'

interface SearchFilters {
  status?: string
  priority?: string
  project_id?: string
  label_id?: string
}

interface SearchResult {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  project_id: string | null
  assignee_id: string | null
  creator_id: string
  workspace_id: string
  due_date: Date | null
  created_at: Date
  updated_at: Date
  rank: number
}

export class SearchService {
  async searchTasks(
    query: string,
    workspaceId: string,
    filters: SearchFilters = {}
  ): Promise<SearchResult[]> {
    const tsquery = this.parseQuery(query)

    let sql = `
      SELECT 
        id, title, description, status, priority, 
        project_id, assignee_id, creator_id, workspace_id,
        due_date, created_at, updated_at,
        ts_rank(search_vector, to_tsquery('english', $1)) as rank
      FROM tasks
      WHERE workspace_id = $2
        AND search_vector @@ to_tsquery('english', $1)
    `

    const params: any[] = [tsquery, workspaceId]
    let paramIndex = 3

    if (filters.status) {
      sql += ` AND status = $${paramIndex}`
      params.push(filters.status)
      paramIndex++
    }

    if (filters.priority) {
      sql += ` AND priority = $${paramIndex}`
      params.push(filters.priority)
      paramIndex++
    }

    if (filters.project_id) {
      sql += ` AND project_id = $${paramIndex}`
      params.push(filters.project_id)
      paramIndex++
    }

    if (filters.label_id) {
      sql += ` AND id IN (
        SELECT task_id FROM task_labels WHERE label_id = $${paramIndex}
      )`
      params.push(filters.label_id)
      paramIndex++
    }

    sql += ' ORDER BY rank DESC, created_at DESC'

    const result = await pool.query(sql, params)
    return result.rows
  }

  private parseQuery(query: string): string {
    const trimmed = query.trim()
    if (!trimmed) {
      return ''
    }

    const words = trimmed.split(/\s+/)
    return words
      .map(word => word.replace(/[^\w]/g, ''))
      .filter(w => w)
      .join(' & ')
  }
}

export default new SearchService()

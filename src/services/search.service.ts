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
    if (!query.trim()) {
      return []
    }

    const tsquery = this.parseQuery(query)
    if (!tsquery) {
      return []
    }

    const sql = this.buildSearchQuery(tsquery, filters)
    const params = this.buildParams(tsquery, workspaceId, filters)
    const result = await pool.query(sql, params)
    return result.rows
  }

  async searchSuggestions(
    prefix: string,
    workspaceId: string,
    limit: number = 5
  ): Promise<{ suggestion: string; count: number }[]> {
    if (!prefix.trim()) {
      return []
    }

    const sanitized = prefix.replace(/[^\w\s]/g, '').trim()
    if (sanitized.length < 2) {
      return []
    }

    const sql = `
      SELECT 
        word as suggestion,
        ndoc as count
      FROM ts_stat(
        to_tsvector('english', (
          SELECT string_agg(title || ' ' || COALESCE(description, ''), ' ')
          FROM tasks
          WHERE workspace_id = $2
        ))
      )
      WHERE word LIKE $1 || '%'
      ORDER BY ndoc DESC
      LIMIT $3
    `

    const result = await pool.query(sql, [
      sanitized.toLowerCase(),
      workspaceId,
      limit,
    ])
    return result.rows
  }

  async searchTitles(
    prefix: string,
    workspaceId: string,
    limit: number = 10
  ): Promise<{ id: string; title: string; rank: number }[]> {
    if (!prefix.trim()) {
      return []
    }

    const sanitized = prefix.replace(/[^\w\s]/g, '').trim()
    if (sanitized.length < 1) {
      return []
    }

    const sql = `
      SELECT 
        id,
        title,
        ts_rank(
          to_tsvector('english', title),
          to_tsquery('english', $1 || ':*')
        ) as rank
      FROM tasks
      WHERE workspace_id = $2
        AND to_tsvector('english', title) @@ to_tsquery('english', $1 || ':*')
      ORDER BY rank DESC, created_at DESC
      LIMIT $3
    `

    const result = await pool.query(sql, [
      sanitized.toLowerCase(),
      workspaceId,
      limit,
    ])
    return result.rows
  }

  private parseQuery(query: string): string {
    const trimmed = query.trim()
    if (!trimmed) {
      return ''
    }

    let processed = trimmed.replace(/[""]/g, '"').replace(/'/g, '\'\'')

    const hasPhrase = /"[^"]+"/.test(processed)
    if (hasPhrase) {
      const phrasePattern = /"([^"]+)"/g
      const phrases: string[] = []
      processed = processed.replace(phrasePattern, (_, phrase) => {
        const sanitized = phrase.replace(/[^\w\s]/g, '').trim()
        if (sanitized) {
          phrases.push(sanitized)
        }
        return ''
      })

      const words = processed.split(/\s+/).filter(w => w.replace(/[^\w]/g, ''))
      const queryParts: string[] = []

      for (const phrase of phrases) {
        queryParts.push(`"${phrase}"`)
      }

      if (words.length > 0) {
        queryParts.push(
          words
            .map(w => w.replace(/[^\w]/g, ''))
            .filter(w => w)
            .join(' & ')
        )
      }

      return queryParts.join(' & ')
    }

    const hasOr = /(?:^|\s)OR(?:\s|$)/i.test(processed)
    if (hasOr) {
      const parts = processed
        .split(/\s+OR\s+/i)
        .map(p => p.trim())
        .filter(p => p)
      return parts.map(p => this.parseSimpleQuery(p)).join(' | ')
    }

    const hasNot =
      /^NOT\s+/i.test(processed) || /\s+NOT\s+(?=\w)/i.test(processed)
    if (hasNot) {
      let notQuery = ''
      processed = processed.replace(/NOT\s+/gi, match => {
        notQuery = '!'
        return ''
      })
      const simple = this.parseSimpleQuery(processed)
      return notQuery + simple
    }

    return this.parseSimpleQuery(processed)
  }

  private parseSimpleQuery(query: string): string {
    const words = query.split(/\s+/).filter(w => {
      const clean = w.replace(/[^\w]/g, '')
      return clean.length > 0
    })

    if (words.length === 0) {
      return ''
    }

    if (words.length === 1) {
      const word = words[0].replace(/[^\w]/g, '')
      return word.length > 0 ? word : ''
    }

    return words.map(w => w.replace(/[^\w]/g, '')).join(' & ')
  }

  private buildSearchQuery(tsquery: string, filters: SearchFilters): string {
    let sql = `
      SELECT 
        t.id, 
        t.title, 
        t.description, 
        t.status, 
        t.priority, 
        t.project_id, 
        t.assignee_id, 
        t.creator_id, 
        t.workspace_id,
        t.due_date, 
        t.created_at, 
        t.updated_at,
        (
          ts_rank(t.search_vector, to_tsquery('english', $1)) +
          ts_rank(setweight(to_tsvector('english', COALESCE(t.title, '')), 'A'), to_tsquery('english', $1)) * 0.5
        ) as rank
      FROM tasks t
      WHERE t.workspace_id = $2
        AND t.search_vector @@ to_tsquery('english', $1)
    `

    let paramIndex = 3

    if (filters.status) {
      sql += ` AND t.status = $${paramIndex}`
      paramIndex++
    }

    if (filters.priority) {
      sql += ` AND t.priority = $${paramIndex}`
      paramIndex++
    }

    if (filters.project_id) {
      sql += ` AND t.project_id = $${paramIndex}`
      paramIndex++
    }

    if (filters.label_id) {
      sql += ` AND t.id IN (
        SELECT task_id FROM task_labels WHERE label_id = $${paramIndex}
      )`
      paramIndex++
    }

    sql += ' ORDER BY rank DESC, t.created_at DESC'

    return sql
  }

  private buildParams(
    query: string,
    workspaceId: string,
    filters: SearchFilters
  ): any[] {
    const params: any[] = [query, workspaceId]

    if (filters.status) {
      params.push(filters.status)
    }

    if (filters.priority) {
      params.push(filters.priority)
    }

    if (filters.project_id) {
      params.push(filters.project_id)
    }

    if (filters.label_id) {
      params.push(filters.label_id)
    }

    return params
  }
}

export default new SearchService()

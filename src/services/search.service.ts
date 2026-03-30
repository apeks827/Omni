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

interface SavedSearch {
  id: string
  user_id: string
  workspace_id: string
  name: string
  query: string
  filters: SearchFilters
  created_at: Date
  updated_at: Date
}

interface SearchHistoryEntry {
  id: string
  user_id: string
  workspace_id: string
  query: string
  filters: SearchFilters
  result_count: number
  searched_at: Date
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

    let processed = trimmed.replace(/[""]/g, '"').replace(/'/g, '\'')

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
      processed = processed.replace(/NOT\s+/gi, () => {
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

  async createSavedSearch(
    userId: string,
    workspaceId: string,
    name: string,
    query: string,
    filters: SearchFilters = {}
  ): Promise<SavedSearch> {
    const sql = `
      INSERT INTO saved_searches (user_id, workspace_id, name, query, filters)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `
    const result = await pool.query(sql, [
      userId,
      workspaceId,
      name,
      query,
      JSON.stringify(filters),
    ])
    return result.rows[0]
  }

  async getSavedSearches(
    userId: string,
    workspaceId: string
  ): Promise<SavedSearch[]> {
    const sql = `
      SELECT * FROM saved_searches
      WHERE user_id = $1 AND workspace_id = $2
      ORDER BY created_at DESC
    `
    const result = await pool.query(sql, [userId, workspaceId])
    return result.rows
  }

  async getSavedSearch(
    id: string,
    userId: string,
    workspaceId: string
  ): Promise<SavedSearch | null> {
    const sql = `
      SELECT * FROM saved_searches
      WHERE id = $1 AND user_id = $2 AND workspace_id = $3
    `
    const result = await pool.query(sql, [id, userId, workspaceId])
    return result.rows[0] || null
  }

  async updateSavedSearch(
    id: string,
    userId: string,
    workspaceId: string,
    updates: { name?: string; query?: string; filters?: SearchFilters }
  ): Promise<SavedSearch | null> {
    const fields: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (updates.name !== undefined) {
      fields.push(`name = $${paramIndex}`)
      params.push(updates.name)
      paramIndex++
    }

    if (updates.query !== undefined) {
      fields.push(`query = $${paramIndex}`)
      params.push(updates.query)
      paramIndex++
    }

    if (updates.filters !== undefined) {
      fields.push(`filters = $${paramIndex}`)
      params.push(JSON.stringify(updates.filters))
      paramIndex++
    }

    if (fields.length === 0) {
      return this.getSavedSearch(id, userId, workspaceId)
    }

    fields.push('updated_at = CURRENT_TIMESTAMP')

    const sql = `
      UPDATE saved_searches
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} AND workspace_id = $${paramIndex + 2}
      RETURNING *
    `
    params.push(id, userId, workspaceId)

    const result = await pool.query(sql, params)
    return result.rows[0] || null
  }

  async deleteSavedSearch(
    id: string,
    userId: string,
    workspaceId: string
  ): Promise<boolean> {
    const sql = `
      DELETE FROM saved_searches
      WHERE id = $1 AND user_id = $2 AND workspace_id = $3
    `
    const result = await pool.query(sql, [id, userId, workspaceId])
    return (result.rowCount ?? 0) > 0
  }

  async recordSearchHistory(
    userId: string,
    workspaceId: string,
    query: string,
    filters: SearchFilters,
    resultCount: number
  ): Promise<void> {
    const insertSql = `
      INSERT INTO search_history (user_id, workspace_id, query, filters, result_count)
      VALUES ($1, $2, $3, $4, $5)
    `
    await pool.query(insertSql, [
      userId,
      workspaceId,
      query,
      JSON.stringify(filters),
      resultCount,
    ])

    const cleanupSql = `
      DELETE FROM search_history
      WHERE id IN (
        SELECT id FROM search_history
        WHERE user_id = $1 AND workspace_id = $2
        ORDER BY searched_at DESC
        OFFSET 20
      )
    `
    await pool.query(cleanupSql, [userId, workspaceId])
  }

  async getSearchHistory(
    userId: string,
    workspaceId: string,
    limit: number = 20
  ): Promise<SearchHistoryEntry[]> {
    const sql = `
      SELECT * FROM search_history
      WHERE user_id = $1 AND workspace_id = $2
      ORDER BY searched_at DESC
      LIMIT $3
    `
    const result = await pool.query(sql, [userId, workspaceId, limit])
    return result.rows
  }
}

export default new SearchService()

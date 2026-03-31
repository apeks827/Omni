import { query } from '../../config/database.js'

export interface SuggestionRule {
  id: string
  field:
    | 'due_date'
    | 'priority'
    | 'estimated_duration'
    | 'location'
    | 'category'
  pattern: string
  value: string
  confidence: number
  enabled: boolean
  category?: 'due_date' | 'priority' | 'duration' | 'location' | 'category'
  created_at: Date
  updated_at: Date
}

export interface SuggestionFeedback {
  id: string
  workspace_id: string
  user_id: string
  input_text: string
  field: string
  suggested_value: string | null
  actual_value: string | null
  accepted: boolean
  created_at: Date
}

const DEFAULT_RULES: Omit<
  SuggestionRule,
  'id' | 'created_at' | 'updated_at'
>[] = [
  {
    field: 'priority',
    pattern: '\\b(urgent|critical|asap|emergency|immediately)\\b',
    value: 'critical',
    confidence: 0.9,
    enabled: true,
    category: 'priority',
  },
  {
    field: 'priority',
    pattern: '\\b(high priority|important|high|prioritize|soon)\\b',
    value: 'high',
    confidence: 0.8,
    enabled: true,
    category: 'priority',
  },
  {
    field: 'priority',
    pattern: '\\b(low priority|low|whenever|someday|later)\\b',
    value: 'low',
    confidence: 0.7,
    enabled: true,
    category: 'priority',
  },
  {
    field: 'due_date',
    pattern: '\\btomorrow\\b',
    value: 'tomorrow',
    confidence: 0.95,
    enabled: true,
    category: 'due_date',
  },
  {
    field: 'due_date',
    pattern: '\\btoday\\b',
    value: 'today',
    confidence: 0.95,
    enabled: true,
    category: 'due_date',
  },
  {
    field: 'due_date',
    pattern: '\\bnext week\\b',
    value: 'next_week',
    confidence: 0.85,
    enabled: true,
    category: 'due_date',
  },
  {
    field: 'due_date',
    pattern: '\\bnext month\\b',
    value: 'next_month',
    confidence: 0.85,
    enabled: true,
    category: 'due_date',
  },
  {
    field: 'due_date',
    pattern: '\\b(eod|end of day)\\b',
    value: 'eod',
    confidence: 0.9,
    enabled: true,
    category: 'due_date',
  },
  {
    field: 'due_date',
    pattern: '\\b(eow|end of week)\\b',
    value: 'eow',
    confidence: 0.9,
    enabled: true,
    category: 'due_date',
  },
  {
    field: 'due_date',
    pattern: '\\bthis weekend\\b',
    value: 'weekend',
    confidence: 0.85,
    enabled: true,
    category: 'due_date',
  },
  {
    field: 'estimated_duration',
    pattern: '\\bquick\\b',
    value: '5',
    confidence: 0.7,
    enabled: true,
    category: 'duration',
  },
  {
    field: 'estimated_duration',
    pattern: '\\bshort\\b',
    value: '15',
    confidence: 0.7,
    enabled: true,
    category: 'duration',
  },
  {
    field: 'estimated_duration',
    pattern: '\\blong\\b',
    value: '60',
    confidence: 0.7,
    enabled: true,
    category: 'duration',
  },
  {
    field: 'category',
    pattern: '\\bwork\\b',
    value: 'work',
    confidence: 0.8,
    enabled: true,
    category: 'category',
  },
  {
    field: 'category',
    pattern: '\\bpersonal\\b',
    value: 'personal',
    confidence: 0.8,
    enabled: true,
    category: 'category',
  },
  {
    field: 'location',
    pattern: '\\bat home\\b',
    value: 'home',
    confidence: 0.7,
    enabled: true,
    category: 'location',
  },
  {
    field: 'location',
    pattern: '\\bat office\\b',
    value: 'office',
    confidence: 0.7,
    enabled: true,
    category: 'location',
  },
]

class SuggestionRepository {
  async getRules(workspaceId?: string): Promise<SuggestionRule[]> {
    const result = await query(
      `SELECT id, field, pattern, value, confidence, enabled, category, created_at, updated_at
       FROM suggestion_rules
       WHERE ($1::text IS NULL OR workspace_id = $1 OR workspace_id IS NULL)
       AND enabled = true
       ORDER BY confidence DESC`,
      [workspaceId || null]
    )
    return result.rows
  }

  async getAllRules(workspaceId: string): Promise<SuggestionRule[]> {
    const result = await query(
      `SELECT id, field, pattern, value, confidence, enabled, category, created_at, updated_at
       FROM suggestion_rules
       WHERE workspace_id = $1 OR workspace_id IS NULL
       ORDER BY field, confidence DESC`,
      [workspaceId]
    )
    return result.rows
  }

  async upsertRule(
    workspaceId: string,
    rule: Partial<SuggestionRule> & {
      pattern: string
      field: string
      value: string
    }
  ): Promise<SuggestionRule> {
    if (rule.id) {
      const result = await query(
        `UPDATE suggestion_rules
         SET pattern = $1, value = $2, confidence = COALESCE($3, confidence),
             enabled = COALESCE($4, enabled), field = $5, updated_at = NOW()
         WHERE id = $6 AND (workspace_id = $7 OR workspace_id IS NULL)
         RETURNING id, field, pattern, value, confidence, enabled, category, created_at, updated_at`,
        [
          rule.pattern,
          rule.value,
          rule.confidence,
          rule.enabled,
          rule.field,
          rule.id,
          workspaceId,
        ]
      )
      return result.rows[0]
    } else {
      const result = await query(
        `INSERT INTO suggestion_rules (workspace_id, field, pattern, value, confidence, enabled, category)
         VALUES ($1, $2, $3, $4, COALESCE($5, 0.8), COALESCE($6, true), $7)
         RETURNING id, field, pattern, value, confidence, enabled, category, created_at, updated_at`,
        [
          workspaceId,
          rule.field,
          rule.pattern,
          rule.value,
          rule.confidence,
          rule.enabled,
          rule.category || null,
        ]
      )
      return result.rows[0]
    }
  }

  async initializeDefaultRules(workspaceId: string): Promise<void> {
    for (const rule of DEFAULT_RULES) {
      await query(
        `INSERT INTO suggestion_rules (workspace_id, field, pattern, value, confidence, enabled, category)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [
          workspaceId,
          rule.field,
          rule.pattern,
          rule.value,
          rule.confidence,
          rule.enabled,
          rule.category || null,
        ]
      )
    }
  }

  async recordFeedback(
    workspaceId: string,
    userId: string,
    inputText: string,
    field: string,
    suggestedValue: string | null,
    actualValue: string | null,
    accepted: boolean
  ): Promise<void> {
    await query(
      `INSERT INTO suggestion_feedback
       (workspace_id, user_id, input_text, field, suggested_value, actual_value, accepted, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        workspaceId,
        userId,
        inputText,
        field,
        suggestedValue,
        actualValue,
        accepted,
      ]
    )
  }

  async getFeedbackStats(
    workspaceId: string,
    field?: string
  ): Promise<
    {
      accepted: number
      rejected: number
      total: number
      acceptance_rate: number
    }[]
  > {
    const result = await query(
      `SELECT field,
              COUNT(*) FILTER (WHERE accepted = true) as accepted,
              COUNT(*) FILTER (WHERE accepted = false) as rejected,
              COUNT(*) as total,
              CASE WHEN COUNT(*) > 0
                   THEN COUNT(*) FILTER (WHERE accepted = true)::float / COUNT(*)::float
                   ELSE 0 END as acceptance_rate
       FROM suggestion_feedback
       WHERE workspace_id = $1
       AND ($2::text IS NULL OR field = $2)
       GROUP BY field`,
      [workspaceId, field || null]
    )
    return result.rows
  }
}

export default new SuggestionRepository()

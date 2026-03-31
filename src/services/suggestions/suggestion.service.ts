import suggestionRepository, {
  SuggestionRule,
} from './suggestion.repository.js'

export interface FieldSuggestion {
  field:
    | 'due_date'
    | 'priority'
    | 'estimated_duration'
    | 'location'
    | 'category'
  value: string
  label: string
  confidence: number
  reason: string
  matchedText: string
}

export interface TaskSuggestions {
  input: string
  suggestions: FieldSuggestion[]
  hasSuggestions: boolean
  processingTimeMs: number
}

const DATE_LABELS: Record<string, string> = {
  tomorrow: 'Tomorrow',
  today: 'Today',
  next_week: 'Next Week',
  next_month: 'Next Month',
  eod: 'End of Today',
  eow: 'End of Week',
  weekend: 'This Weekend',
}

const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Critical',
  high: 'High Priority',
  medium: 'Medium Priority',
  low: 'Low Priority',
}

function resolveRelativeDate(value: string): string {
  const now = new Date()
  switch (value) {
    case 'tomorrow': {
      const d = new Date(now)
      d.setDate(d.getDate() + 1)
      return d.toISOString()
    }
    case 'today': {
      const d = new Date(now)
      d.setHours(23, 59, 59, 999)
      return d.toISOString()
    }
    case 'next_week': {
      const d = new Date(now)
      d.setDate(d.getDate() + 7)
      return d.toISOString()
    }
    case 'next_month': {
      const d = new Date(now)
      d.setMonth(d.getMonth() + 1)
      return d.toISOString()
    }
    case 'eod': {
      const d = new Date(now)
      d.setHours(23, 59, 59, 999)
      return d.toISOString()
    }
    case 'eow': {
      const d = new Date(now)
      const daysUntilFriday = (5 - d.getDay() + 7) % 7 || 7
      d.setDate(d.getDate() + daysUntilFriday)
      d.setHours(23, 59, 59, 999)
      return d.toISOString()
    }
    case 'weekend': {
      const d = new Date(now)
      const daysUntilSaturday = (6 - d.getDay() + 7) % 7 || 7
      d.setDate(d.getDate() + daysUntilSaturday)
      return d.toISOString()
    }
    default:
      return value
  }
}

class SuggestionService {
  private cachedRules: Map<
    string,
    { rules: SuggestionRule[]; fetchedAt: number }
  > = new Map()
  private readonly CACHE_TTL_MS = 60_000

  async getSuggestions(
    input: string,
    workspaceId: string
  ): Promise<TaskSuggestions> {
    if (!input || input.trim().length === 0) {
      return {
        input,
        suggestions: [],
        hasSuggestions: false,
        processingTimeMs: 0,
      }
    }

    const startTime = Date.now()
    const rules = await this.getRules(workspaceId)
    const suggestions: FieldSuggestion[] = []

    const matchedRules: Array<{
      rule: SuggestionRule
      match: RegExpMatchArray
    }> = []
    for (const rule of rules) {
      try {
        const regex = new RegExp(rule.pattern, 'i')
        const match = input.match(regex)
        if (match) {
          matchedRules.push({ rule, match })
        }
      } catch {
        continue
      }
    }

    matchedRules.sort((a, b) => b.rule.confidence - a.rule.confidence)

    const seenFields = new Set<string>()
    for (const { rule, match } of matchedRules) {
      if (seenFields.has(rule.field)) continue
      seenFields.add(rule.field)

      const resolvedValue =
        rule.field === 'due_date' ? resolveRelativeDate(rule.value) : rule.value

      const label = this.getSuggestionLabel(rule.field, rule.value)
      const reason = this.getSuggestionReason(rule.field, match[0])

      suggestions.push({
        field: rule.field,
        value: resolvedValue,
        label,
        confidence: rule.confidence,
        reason,
        matchedText: match[0],
      })
    }

    return {
      input,
      suggestions,
      hasSuggestions: suggestions.length > 0,
      processingTimeMs: Date.now() - startTime,
    }
  }

  private getSuggestionLabel(field: string, value: string): string {
    if (field === 'due_date') return DATE_LABELS[value] || value
    if (field === 'priority') return PRIORITY_LABELS[value] || value
    if (field === 'estimated_duration') return `${value} min`
    if (field === 'location') return `At ${value}`
    if (field === 'category')
      return value.charAt(0).toUpperCase() + value.slice(1)
    return value
  }

  private getSuggestionReason(field: string, matchedText: string): string {
    if (field === 'due_date') return `Found "${matchedText}" in text`
    if (field === 'priority')
      return `Keyword "${matchedText}" indicates priority`
    if (field === 'estimated_duration')
      return `"${matchedText}" suggests duration`
    if (field === 'location') return `"${matchedText}" implies location`
    if (field === 'category') return `"${matchedText}" indicates category`
    return `Matched pattern for ${field}`
  }

  private async getRules(workspaceId: string): Promise<SuggestionRule[]> {
    const cached = this.cachedRules.get(workspaceId)
    if (cached && Date.now() - cached.fetchedAt < this.CACHE_TTL_MS) {
      return cached.rules
    }

    let rules = await suggestionRepository.getRules(workspaceId)
    if (rules.length === 0) {
      await suggestionRepository.initializeDefaultRules(workspaceId)
      rules = await suggestionRepository.getRules(workspaceId)
    }

    this.cachedRules.set(workspaceId, { rules, fetchedAt: Date.now() })
    return rules
  }

  async getAllRules(workspaceId: string): Promise<SuggestionRule[]> {
    return suggestionRepository.getAllRules(workspaceId)
  }

  async updateRules(
    workspaceId: string,
    rules: Array<
      Partial<SuggestionRule> & {
        pattern: string
        field: string
        value: string
      }
    >
  ): Promise<SuggestionRule[]> {
    this.cachedRules.delete(workspaceId)
    const results: SuggestionRule[] = []
    for (const rule of rules) {
      const saved = await suggestionRepository.upsertRule(workspaceId, rule)
      results.push(saved)
    }
    return results
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
    await suggestionRepository.recordFeedback(
      workspaceId,
      userId,
      inputText,
      field,
      suggestedValue,
      actualValue,
      accepted
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
    return suggestionRepository.getFeedbackStats(workspaceId, field)
  }

  invalidateCache(workspaceId: string): void {
    this.cachedRules.delete(workspaceId)
  }
}

export default new SuggestionService()

import { Context } from './contextDetection'

export interface ContextRule {
  id: string
  name: string
  conditions: ContextCondition[]
  actions: ContextAction[]
  priority: number
  enabled: boolean
}

export interface ContextCondition {
  type: 'time' | 'location' | 'device' | 'network'
  operator: 'equals' | 'contains' | 'between' | 'near'
  value: ConditionValue
}

export type ConditionValue =
  | string
  | number
  | string[]
  | number[]
  | TimeRange
  | LocationRange

export interface TimeRange {
  start: number
  end: number
}

export interface LocationRange {
  latitude: number
  longitude: number
  radiusMeters: number
}

export interface ContextAction {
  type: 'filter' | 'sort' | 'notify' | 'suggest'
  config: ActionConfig
}

export interface ActionConfig {
  taskTypes?: string[]
  priorityBoost?: number
  message?: string
  sortBy?: 'priority' | 'context'
}

export interface RuleEvaluationResult {
  ruleId: string
  matched: boolean
  actions: ContextAction[]
  suggestions: TaskSuggestion[]
}

export interface TaskSuggestion {
  taskId?: string
  taskTitle: string
  taskType: string
  reason: string
  context: 'device' | 'location' | 'time' | 'network'
  priorityBoost: number
}

const STORAGE_KEY = 'omni_context_rules'

class ContextRulesEngine {
  private rules: ContextRule[] = []
  private listeners: Set<(results: RuleEvaluationResult[]) => void> = new Set()
  private lastEvaluationTime = 0
  private debounceMs = 1000

  constructor() {
    this.loadRules()
  }

  private loadRules() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        this.rules = JSON.parse(stored)
      } else {
        this.rules = this.getDefaultRules()
        this.saveRules()
      }
    } catch {
      this.rules = this.getDefaultRules()
    }
  }

  private saveRules() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.rules))
    } catch {
      console.warn('Failed to save context rules to localStorage')
    }
  }

  private getDefaultRules(): ContextRule[] {
    return [
      {
        id: 'device-work-desktop',
        name: 'Work tasks on desktop',
        conditions: [{ type: 'device', operator: 'equals', value: 'desktop' }],
        actions: [
          {
            type: 'suggest',
            config: { taskTypes: ['work', 'deep-work'], priorityBoost: 10 },
          },
        ],
        priority: 10,
        enabled: true,
      },
      {
        id: 'device-errands-mobile',
        name: 'Errands on mobile',
        conditions: [{ type: 'device', operator: 'equals', value: 'mobile' }],
        actions: [
          {
            type: 'suggest',
            config: { taskTypes: ['errand', 'shopping'], priorityBoost: 15 },
          },
        ],
        priority: 10,
        enabled: true,
      },
      {
        id: 'time-morning-work',
        name: 'Work focus in morning',
        conditions: [
          {
            type: 'time',
            operator: 'between',
            value: { start: 5, end: 12 } as TimeRange,
          },
        ],
        actions: [
          {
            type: 'suggest',
            config: {
              taskTypes: ['work', 'high-priority'],
              priorityBoost: 5,
              message: 'Peak productivity hours',
            },
          },
        ],
        priority: 5,
        enabled: true,
      },
      {
        id: 'time-evening-wind-down',
        name: 'Quick tasks in evening',
        conditions: [
          {
            type: 'time',
            operator: 'between',
            value: { start: 17, end: 21 } as TimeRange,
          },
        ],
        actions: [
          {
            type: 'suggest',
            config: { taskTypes: ['quick', 'low-effort'], priorityBoost: 5 },
          },
        ],
        priority: 3,
        enabled: true,
      },
      {
        id: 'network-slow-cellular',
        name: 'Quick tasks on slow network',
        conditions: [
          { type: 'network', operator: 'equals', value: 'cellular' },
        ],
        actions: [
          {
            type: 'suggest',
            config: { taskTypes: ['quick'], priorityBoost: 10 },
          },
        ],
        priority: 4,
        enabled: true,
      },
    ]
  }

  private evaluateCondition(
    condition: ContextCondition,
    context: Context
  ): boolean {
    switch (condition.type) {
      case 'device':
        return this.evaluateDeviceCondition(condition, context)
      case 'time':
        return this.evaluateTimeCondition(condition, context)
      case 'location':
        return this.evaluateLocationCondition(condition, context)
      case 'network':
        return this.evaluateNetworkCondition(condition, context)
      default:
        return false
    }
  }

  private evaluateDeviceCondition(
    condition: ContextCondition,
    context: Context
  ): boolean {
    const deviceType = context.device.type
    const value = condition.value

    if (condition.operator === 'equals') {
      if (typeof value === 'string') {
        return deviceType === value
      }
      if (Array.isArray(value)) {
        return value.some(v => v === deviceType)
      }
      return false
    }
    if (condition.operator === 'contains') {
      if (typeof value === 'string') {
        return deviceType === value
      }
      if (Array.isArray(value)) {
        return value.some(v => v === deviceType)
      }
      return false
    }
    return false
  }

  private evaluateTimeCondition(
    condition: ContextCondition,
    context: Context
  ): boolean {
    const { hour, timeOfDay } = context.time
    const value = condition.value

    if (condition.operator === 'equals') {
      if (typeof value === 'string') {
        return timeOfDay === value
      }
      if (typeof value === 'number') {
        return hour === value
      }
      if (Array.isArray(value)) {
        return value.some(v => v === timeOfDay || v === hour)
      }
      return false
    }

    if (condition.operator === 'between') {
      const range = value as TimeRange
      return hour >= range.start && hour < range.end
    }

    return false
  }

  private evaluateLocationCondition(
    condition: ContextCondition,
    context: Context
  ): boolean {
    if (!context.location) return false

    if (condition.operator === 'near') {
      const range = condition.value as LocationRange
      const distance = this.calculateDistance(
        context.location.latitude,
        context.location.longitude,
        range.latitude,
        range.longitude
      )
      return distance <= range.radiusMeters
    }

    return false
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  private evaluateNetworkCondition(
    condition: ContextCondition,
    context: Context
  ): boolean {
    const networkType = context.network.type
    const value = condition.value

    if (condition.operator === 'equals') {
      if (typeof value === 'string') {
        return networkType === value
      }
      if (Array.isArray(value)) {
        return value.some(v => v === networkType)
      }
      return false
    }
    if (condition.operator === 'contains') {
      if (typeof value === 'string') {
        return networkType === value
      }
      if (Array.isArray(value)) {
        return value.some(v => v === networkType)
      }
      return false
    }
    return false
  }

  evaluateRules(context: Context): RuleEvaluationResult[] {
    const now = Date.now()
    if (now - this.lastEvaluationTime < this.debounceMs) {
      return []
    }
    this.lastEvaluationTime = now

    const results: RuleEvaluationResult[] = []
    const enabledRules = this.rules
      .filter(r => r.enabled)
      .sort((a, b) => b.priority - a.priority)

    for (const rule of enabledRules) {
      const allConditionsMet = rule.conditions.every(c =>
        this.evaluateCondition(c, context)
      )

      if (allConditionsMet) {
        const suggestions = this.generateSuggestions(rule, context)
        results.push({
          ruleId: rule.id,
          matched: true,
          actions: rule.actions,
          suggestions,
        })
      }
    }

    this.notifyListeners(results)
    return results
  }

  private generateSuggestions(
    rule: ContextRule,
    context: Context
  ): TaskSuggestion[] {
    const suggestions: TaskSuggestion[] = []
    const suggestActions = rule.actions.filter(a => a.type === 'suggest')

    for (const action of suggestActions) {
      const taskTypes = action.config.taskTypes || []
      const priorityBoost = action.config.priorityBoost || 0
      const message = action.config.message || `${rule.name}`

      for (const taskType of taskTypes) {
        suggestions.push({
          taskTitle: `Suggested: ${taskType.replace('-', ' ')}`,
          taskType,
          reason: message,
          context: this.getPrimaryContextType(rule),
          priorityBoost,
        })
      }
    }

    return suggestions
  }

  private getPrimaryContextType(
    rule: ContextRule
  ): 'device' | 'location' | 'time' | 'network' {
    const deviceConditions = rule.conditions.filter(c => c.type === 'device')
    if (deviceConditions.length > 0) return 'device'

    const locationConditions = rule.conditions.filter(
      c => c.type === 'location'
    )
    if (locationConditions.length > 0) return 'location'

    const timeConditions = rule.conditions.filter(c => c.type === 'time')
    if (timeConditions.length > 0) return 'time'

    return 'network'
  }

  getRules(): ContextRule[] {
    return [...this.rules]
  }

  addRule(rule: Omit<ContextRule, 'id'>): ContextRule {
    const newRule: ContextRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
    this.rules.push(newRule)
    this.saveRules()
    return newRule
  }

  updateRule(id: string, updates: Partial<ContextRule>): ContextRule | null {
    const index = this.rules.findIndex(r => r.id === id)
    if (index === -1) return null

    this.rules[index] = { ...this.rules[index], ...updates }
    this.saveRules()
    return this.rules[index]
  }

  deleteRule(id: string): boolean {
    const index = this.rules.findIndex(r => r.id === id)
    if (index === -1) return false

    this.rules.splice(index, 1)
    this.saveRules()
    return true
  }

  subscribe(callback: (results: RuleEvaluationResult[]) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private notifyListeners(results: RuleEvaluationResult[]) {
    this.listeners.forEach(listener => listener(results))
  }
}

export const contextRulesEngine = new ContextRulesEngine()

# Intent Processing - MVP Architecture

## Overview

Intent processing translates natural language user input into structured task operations. This document specifies the MVP implementation strategy.

## MVP Decision: Rule-Based with Pattern Matching

**Decision:** Use rule-based pattern matching for MVP, not LLM.

**Rationale:**

- Predictable behavior and latency
- No external API dependencies or costs
- Easier to debug and test
- Sufficient for common task operations
- Can be enhanced with LLM in Phase 2

**Phase 2 Enhancement:** Add GPT-4 for complex/ambiguous intents after MVP validation.

## Supported Intents (MVP)

| Intent        | Example Input                 | Structured Output                                            |
| ------------- | ----------------------------- | ------------------------------------------------------------ |
| CREATE_TASK   | "Add task: Review PR"         | `{ action: 'create', title: 'Review PR' }`                   |
| UPDATE_STATUS | "Mark task 123 as done"       | `{ action: 'update', taskId: '123', status: 'completed' }`   |
| SET_PRIORITY  | "Make task 456 high priority" | `{ action: 'update', taskId: '456', priority: 'high' }`      |
| SET_DUE_DATE  | "Task 789 due tomorrow"       | `{ action: 'update', taskId: '789', dueDate: '2026-03-31' }` |
| ASSIGN_TASK   | "Assign task 123 to John"     | `{ action: 'update', taskId: '123', assignee: 'John' }`      |
| LIST_TASKS    | "Show my tasks"               | `{ action: 'list', filters: { assignee: 'me' } }`            |
| SEARCH_TASKS  | "Find tasks about API"        | `{ action: 'search', query: 'API' }`                         |

## Architecture

```typescript
interface Intent {
  action: 'create' | 'update' | 'list' | 'search' | 'delete'
  confidence: number // 0-1
  entities: Record<string, any>
  rawInput: string
}

interface IntentPattern {
  pattern: RegExp
  intent: string
  extractor: (match: RegExpMatchArray) => Record<string, any>
}

class IntentProcessor {
  private patterns: IntentPattern[] = [
    // CREATE_TASK patterns
    {
      pattern: /^(?:add|create|new)\s+task:?\s+(.+)$/i,
      intent: 'CREATE_TASK',
      extractor: match => ({ title: match[1].trim() }),
    },
    {
      pattern: /^(?:add|create)\s+(.+?)(?:\s+due\s+(.+))?$/i,
      intent: 'CREATE_TASK',
      extractor: match => ({
        title: match[1].trim(),
        dueDate: match[2] ? this.parseDate(match[2]) : undefined,
      }),
    },

    // UPDATE_STATUS patterns
    {
      pattern:
        /^(?:mark|set)\s+(?:task\s+)?(\d+|[a-f0-9-]+)\s+(?:as\s+)?(?:done|complete|completed)$/i,
      intent: 'UPDATE_STATUS',
      extractor: match => ({ taskId: match[1], status: 'completed' }),
    },
    {
      pattern: /^(?:start|begin)\s+(?:task\s+)?(\d+|[a-f0-9-]+)$/i,
      intent: 'UPDATE_STATUS',
      extractor: match => ({ taskId: match[1], status: 'in_progress' }),
    },

    // SET_PRIORITY patterns
    {
      pattern:
        /^(?:make|set)\s+(?:task\s+)?(\d+|[a-f0-9-]+)\s+(low|medium|high|critical)\s+priority$/i,
      intent: 'SET_PRIORITY',
      extractor: match => ({
        taskId: match[1],
        priority: match[2].toLowerCase(),
      }),
    },

    // SET_DUE_DATE patterns
    {
      pattern: /^(?:task\s+)?(\d+|[a-f0-9-]+)\s+due\s+(.+)$/i,
      intent: 'SET_DUE_DATE',
      extractor: match => ({
        taskId: match[1],
        dueDate: this.parseDate(match[2]),
      }),
    },

    // ASSIGN_TASK patterns
    {
      pattern: /^assign\s+(?:task\s+)?(\d+|[a-f0-9-]+)\s+to\s+(.+)$/i,
      intent: 'ASSIGN_TASK',
      extractor: match => ({ taskId: match[1], assignee: match[2].trim() }),
    },

    // LIST_TASKS patterns
    {
      pattern: /^(?:show|list|get)\s+(?:my\s+)?tasks?$/i,
      intent: 'LIST_TASKS',
      extractor: () => ({ filters: { assignee: 'me' } }),
    },
    {
      pattern: /^(?:show|list)\s+(high|critical)\s+priority\s+tasks?$/i,
      intent: 'LIST_TASKS',
      extractor: match => ({ filters: { priority: match[1].toLowerCase() } }),
    },

    // SEARCH_TASKS patterns
    {
      pattern: /^(?:find|search)\s+tasks?\s+(?:about|for|with)\s+(.+)$/i,
      intent: 'SEARCH_TASKS',
      extractor: match => ({ query: match[1].trim() }),
    },
  ]

  process(input: string): Intent | null {
    const normalized = input.trim()

    for (const { pattern, intent, extractor } of this.patterns) {
      const match = normalized.match(pattern)
      if (match) {
        return {
          action: this.intentToAction(intent),
          confidence: 0.9, // High confidence for exact pattern match
          entities: extractor(match),
          rawInput: input,
        }
      }
    }

    // Fallback: fuzzy matching with lower confidence
    const fuzzyResult = this.fuzzyMatch(normalized)
    if (fuzzyResult) {
      return {
        ...fuzzyResult,
        confidence: 0.6,
        rawInput: input,
      }
    }

    return null
  }

  private intentToAction(intent: string): Intent['action'] {
    const mapping: Record<string, Intent['action']> = {
      CREATE_TASK: 'create',
      UPDATE_STATUS: 'update',
      SET_PRIORITY: 'update',
      SET_DUE_DATE: 'update',
      ASSIGN_TASK: 'update',
      LIST_TASKS: 'list',
      SEARCH_TASKS: 'search',
    }
    return mapping[intent] || 'list'
  }

  private parseDate(dateStr: string): string {
    const normalized = dateStr.toLowerCase().trim()
    const now = new Date()

    // Relative dates
    if (normalized === 'today') {
      return now.toISOString().split('T')[0]
    }
    if (normalized === 'tomorrow') {
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow.toISOString().split('T')[0]
    }
    if (normalized === 'next week') {
      const nextWeek = new Date(now)
      nextWeek.setDate(nextWeek.getDate() + 7)
      return nextWeek.toISOString().split('T')[0]
    }

    // Day of week
    const dayMatch = normalized.match(
      /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i
    )
    if (dayMatch) {
      return this.getNextDayOfWeek(dayMatch[1])
    }

    // Absolute dates (ISO format)
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      return normalized
    }

    // Fallback: try to parse with Date constructor
    const parsed = new Date(dateStr)
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0]
    }

    return now.toISOString().split('T')[0]
  }

  private getNextDayOfWeek(dayName: string): string {
    const days = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ]
    const targetDay = days.indexOf(dayName.toLowerCase())
    const today = new Date()
    const currentDay = today.getDay()

    let daysUntilTarget = targetDay - currentDay
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7
    }

    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + daysUntilTarget)
    return targetDate.toISOString().split('T')[0]
  }

  private fuzzyMatch(input: string): Partial<Intent> | null {
    // Simple keyword-based fallback
    if (/\b(add|create|new)\b/i.test(input)) {
      return {
        action: 'create',
        entities: { title: input.replace(/\b(add|create|new)\b/i, '').trim() },
      }
    }

    if (/\b(list|show|get)\b/i.test(input)) {
      return {
        action: 'list',
        entities: { filters: {} },
      }
    }

    return null
  }
}
```

## API Endpoint

### POST /api/intent/process

```typescript
interface IntentRequest {
  input: string
  workspaceId: string
  userId: string
}

interface IntentResponse {
  intent: Intent | null
  suggestions?: string[] // Alternative interpretations
  error?: string
}

router.post('/intent/process', async (req: AuthRequest, res: Response) => {
  const { input } = req.body
  const processor = new IntentProcessor()

  const intent = processor.process(input)

  if (!intent) {
    return res.json({
      intent: null,
      suggestions: [
        'Try: "Add task: Review PR"',
        'Try: "Show my tasks"',
        'Try: "Mark task 123 as done"',
      ],
      error: 'Could not understand input',
    })
  }

  res.json({ intent })
})
```

## Testing Strategy

```typescript
describe('IntentProcessor', () => {
  const processor = new IntentProcessor()

  describe('CREATE_TASK', () => {
    it('should parse simple task creation', () => {
      const result = processor.process('Add task: Review PR')
      expect(result?.action).toBe('create')
      expect(result?.entities.title).toBe('Review PR')
      expect(result?.confidence).toBeGreaterThan(0.8)
    })

    it('should parse task with due date', () => {
      const result = processor.process('Create task: Deploy API due tomorrow')
      expect(result?.action).toBe('create')
      expect(result?.entities.title).toBe('Deploy API')
      expect(result?.entities.dueDate).toBeDefined()
    })
  })

  describe('UPDATE_STATUS', () => {
    it('should parse status update', () => {
      const result = processor.process('Mark task 123 as done')
      expect(result?.action).toBe('update')
      expect(result?.entities.taskId).toBe('123')
      expect(result?.entities.status).toBe('completed')
    })
  })

  describe('Date parsing', () => {
    it('should parse relative dates', () => {
      const result = processor.process('Task 456 due tomorrow')
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      expect(result?.entities.dueDate).toBe(
        tomorrow.toISOString().split('T')[0]
      )
    })

    it('should parse day of week', () => {
      const result = processor.process('Task 789 due Monday')
      expect(result?.entities.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })
})
```

## Phase 2: LLM Enhancement

When adding GPT-4 in Phase 2:

```typescript
class HybridIntentProcessor extends IntentProcessor {
  async processWithLLM(input: string): Promise<Intent> {
    // Try rule-based first
    const ruleBasedResult = this.process(input)

    if (ruleBasedResult && ruleBasedResult.confidence > 0.8) {
      return ruleBasedResult
    }

    // Fallback to LLM for complex/ambiguous inputs
    const llmResult = await this.callGPT4(input)

    return {
      ...llmResult,
      confidence: Math.min(llmResult.confidence, 0.85), // Cap LLM confidence
    }
  }

  private async callGPT4(input: string): Promise<Intent> {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'Extract task intent from user input. Return JSON with action, entities.',
        },
        { role: 'user', content: input },
      ],
      response_format: { type: 'json_object' },
    })

    return JSON.parse(response.choices[0].message.content!)
  }
}
```

## Performance Targets

| Metric      | Target             | MVP Algorithm      |
| ----------- | ------------------ | ------------------ |
| Latency p95 | <50ms              | ✓ Rule-based       |
| Accuracy    | >85%               | ✓ Pattern matching |
| Coverage    | 80% common intents | ✓ 7 intent types   |
| Cost        | $0                 | ✓ No API calls     |

## Extensibility

New intents can be added by:

1. Adding pattern to `patterns` array
2. Implementing extractor function
3. Adding test cases
4. Updating documentation

Example:

```typescript
{
  pattern: /^delete\s+(?:task\s+)?(\d+|[a-f0-9-]+)$/i,
  intent: 'DELETE_TASK',
  extractor: (match) => ({ taskId: match[1] }),
}
```

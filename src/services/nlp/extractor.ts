import { z } from 'zod'

export interface ExtractedTaskData {
  title: string
  due_date?: string
  due_time?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  location?: string
  category?: string
  intent_type?: 'task' | 'habit' | 'routine'
  estimated_duration?: number
}

const habitPatterns = [
  { regex: /\b(every day|daily|each day|dayly)\b/i },
  { regex: /\b(every morning|each morning|every night|each night)\b/i },
  { regex: /\b(every week|weekly|each week)\b/i },
  { regex: /\b(every month|monthly|each month)\b/i },
  { regex: /\b(workout|exercise|fitness|run |gym |yoga|meditat)/i },
  { regex: /\b(read|reading|study|learn)\b/i },
]

const routinePatterns = [
  {
    regex:
      /\b(morning routine|evening routine|bedtime routine|daily routine|weekly routine)\b/i,
  },
  {
    regex:
      /\b(every monday|tuesdays?|wednesdays?|thursdays?|fridays?|saturdays?|sundays?)\b/i,
  },
  { regex: /\b(first thing|every morning before|every night before)\b/i },
  { regex: /\b(weekly|monthly|quarterly|yearly)\b/i },
]

const durationPatterns = [
  { regex: /\b(\d+)\s*hours?\b/i, multiplier: 60 },
  { regex: /\b(\d+)\s*mins?\b/i, multiplier: 1 },
  { regex: /\b(\d+)\s*minutes?\b/i, multiplier: 1 },
  { regex: /\bhalf\s*an?\s*hour\b/i, multiplier: 60, value: 30 },
  { regex: /\bquick(?:ly)?\b/i, multiplier: 1, value: 5 },
  { regex: /\bshort\b/i, multiplier: 1, value: 15 },
  { regex: /\blong\b/i, multiplier: 1, value: 60 },
]

const datePatterns = [
  { regex: /\b(today|tonight)\b/i, offset: 0 },
  { regex: /\b(tomorrow|tmrw)\b/i, offset: 1 },
  { regex: /\bin (\d+) days?\b/i, offsetDays: true },
  {
    regex:
      /\bnext (monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    nextWeekday: true,
  },
  { regex: /\b(\d{4})-(\d{2})-(\d{2})\b/, iso: true },
  { regex: /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/, mdy: true },
]

const timePatterns: Array<{
  regex: RegExp
  format?: string
  namedTime?: boolean
  period?: 'evening' | 'morning' | 'afternoon'
}> = [
  { regex: /\bat (\d{1,2}):(\d{2})\s*(am|pm)?\b/i, format: 'hmma' },
  { regex: /\bat (\d{1,2})\s*(am|pm)\b/i, format: 'hmm' },
  { regex: /\bby (\d{1,2}):(\d{2})\s*(am|pm)?\b/i, format: 'hmma' },
  { regex: /\bbefore (\d{1,2})\s*(am|pm)\b/i, format: 'hmm' },
  { regex: /\b(\d{1,2}):(\d{2})\b/, format: '24h' },
  { regex: /\b(midnight|noon)\b/i, namedTime: true },
  {
    regex:
      /\b(tomorrow evening|tonight evening|this evening|in the evening)\b/i,
    period: 'evening',
  },
  {
    regex: /\b(tomorrow morning|this morning|in the morning)\b/i,
    period: 'morning',
  },
  {
    regex: /\b(tomorrow afternoon|this afternoon|in the afternoon)\b/i,
    period: 'afternoon',
  },
]

const locationPatterns = [
  {
    regex:
      /\bat the (office|home|kitchen|bedroom|bathroom|living room|garage|backyard|garden)\b/i,
    type: 'predefined',
  },
  {
    regex:
      /\bin the (office|home|kitchen|bedroom|bathroom|living room|garage|backyard|garden)\b/i,
    type: 'predefined',
  },
]

const categoryPatterns = [
  { regex: /\bfor work\b/i, category: 'work' },
  { regex: /\bpersonal tasks?\b/i, category: 'personal' },
  { regex: /\bworkout|fitness|exercise\b/i, category: 'health' },
  { regex: /\bshopping list|errands?\b/i, category: 'errands' },
  { regex: /\blearning|study|course\b/i, category: 'learning' },
]

const priorityPatterns = [
  {
    regex: /\b(urgent|critical|asap|emergency)\b/i,
    priority: 'critical' as const,
  },
  { regex: /\b(high priority|important|high)\b/i, priority: 'high' as const },
  { regex: /\b(low priority|low)\b/i, priority: 'low' as const },
]

function parseTime(
  match: RegExpMatchArray,
  format: string,
  namedTime?: string,
  period?: string
): string {
  if (namedTime) {
    if (namedTime.toLowerCase() === 'midnight') return '00:00'
    if (namedTime.toLowerCase() === 'noon') return '12:00'
  }
  if (period) {
    const now = new Date()
    const baseDate = new Date(now)
    if (period === 'evening') {
      baseDate.setHours(18, 0, 0, 0)
      return '18:00'
    }
    if (period === 'morning') {
      baseDate.setHours(9, 0, 0, 0)
      return '09:00'
    }
    if (period === 'afternoon') {
      baseDate.setHours(14, 0, 0, 0)
      return '14:00'
    }
  }

  let hours = 0
  let minutes = 0

  if (format === 'hmma' || format === 'hmm') {
    hours = parseInt(match[1], 10)
    minutes = format === 'hmma' ? parseInt(match[2], 10) : 0
    const ampm = match[format === 'hmma' ? 3 : 2]?.toLowerCase()
    if (ampm === 'pm' && hours !== 12) hours += 12
    if (ampm === 'am' && hours === 12) hours = 0
  } else if (format === '24h') {
    hours = parseInt(match[1], 10)
    minutes = parseInt(match[2], 10)
  }

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

export function extractTaskData(input: string): ExtractedTaskData {
  if (!input || input.trim().length === 0) {
    throw new Error('Input cannot be empty')
  }

  if (input.length > 5000) {
    throw new Error('Input exceeds maximum length of 5000 characters')
  }

  const startTime = Date.now()
  let title = input.trim()
  let due_date: string | undefined
  let due_time: string | undefined
  let priority: 'low' | 'medium' | 'high' | 'critical' | undefined
  let location: string | undefined
  let category: string | undefined
  let intent_type: 'task' | 'habit' | 'routine' | undefined
  let estimated_duration: number | undefined

  for (const pattern of datePatterns) {
    const match = title.match(pattern.regex)
    if (match) {
      const now = new Date()
      let targetDate: Date | null = null

      if ('offset' in pattern) {
        const offsetPattern = pattern as { regex: RegExp; offset: number }
        targetDate = new Date(now)
        targetDate.setDate(now.getDate() + offsetPattern.offset)
      } else if ('offsetDays' in pattern) {
        const days = parseInt(match[1], 10)
        targetDate = new Date(now)
        targetDate.setDate(now.getDate() + days)
      } else if ('nextWeekday' in pattern) {
        const weekdays = [
          'sunday',
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
        ]
        const targetDay = weekdays.indexOf(match[1].toLowerCase())
        const currentDay = now.getDay()
        const daysUntil = (targetDay - currentDay + 7) % 7 || 7
        targetDate = new Date(now)
        targetDate.setDate(now.getDate() + daysUntil)
      } else if ('iso' in pattern) {
        targetDate = new Date(`${match[1]}-${match[2]}-${match[3]}`)
      } else if ('mdy' in pattern) {
        targetDate = new Date(
          `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`
        )
      }

      if (targetDate && !isNaN(targetDate.getTime())) {
        due_date = targetDate.toISOString()
        title = title.replace(match[0], '').trim()
      }
      break
    }
  }

  for (const pattern of timePatterns) {
    const match = title.match(pattern.regex)
    if (match) {
      if (pattern.format) {
        due_time = parseTime(match, pattern.format)
      } else if (pattern.namedTime) {
        due_time = parseTime(match, '', match[1])
      } else if (pattern.period) {
        due_time = parseTime(match, '', undefined, pattern.period)
      }
      title = title.replace(match[0], '').trim()
      break
    }
  }

  for (const pattern of locationPatterns) {
    const match = title.match(pattern.regex)
    if (match) {
      location = match[1]
      title = title.replace(match[0], '').trim()
      break
    }
  }

  for (const pattern of categoryPatterns) {
    const match = title.match(pattern.regex)
    if (match) {
      category = pattern.category
      title = title.replace(match[0], '').trim()
      break
    }
  }

  for (const pattern of priorityPatterns) {
    const match = title.match(pattern.regex)
    if (match) {
      priority = pattern.priority
      title = title.replace(match[0], '').trim()
      break
    }
  }

  for (const pattern of routinePatterns) {
    const match = title.match(pattern.regex)
    if (match) {
      intent_type = 'routine'
      title = title.replace(match[0], '').trim()
      break
    }
  }

  if (!intent_type) {
    for (const pattern of habitPatterns) {
      const match = input.match(pattern.regex)
      if (match) {
        intent_type = 'habit'
        title = title.replace(match[0], '').trim()
        break
      }
    }
  }

  for (const pattern of durationPatterns) {
    const match = title.match(pattern.regex)
    if (match) {
      if ('value' in pattern && pattern.value) {
        estimated_duration = pattern.value
      } else {
        const value = parseInt(match[1], 10)
        estimated_duration = value * (pattern.multiplier || 1)
      }
      title = title.replace(match[0], '').trim()
      break
    }
  }

  title = title.replace(/\s+/g, ' ').trim()

  if (title.length === 0) {
    throw new Error('Task title cannot be empty after extraction')
  }

  const extractionTime = Date.now() - startTime
  if (extractionTime > 100) {
    console.warn(`Extraction took ${extractionTime}ms, exceeding 100ms target`)
  }

  return {
    title,
    due_date,
    due_time,
    priority,
    location,
    category,
    intent_type,
    estimated_duration,
  }
}

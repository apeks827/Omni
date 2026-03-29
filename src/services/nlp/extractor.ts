import { z } from 'zod'

export interface ExtractedTaskData {
  title: string
  due_date?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
}

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

const priorityPatterns = [
  {
    regex: /\b(urgent|critical|asap|emergency)\b/i,
    priority: 'critical' as const,
  },
  { regex: /\b(high priority|important|high)\b/i, priority: 'high' as const },
  { regex: /\b(low priority|low)\b/i, priority: 'low' as const },
]

export function extractTaskData(input: string): ExtractedTaskData {
  if (!input || input.trim().length === 0) {
    throw new Error('Input cannot be empty')
  }

  if (input.length > 5000) {
    throw new Error('Input exceeds maximum length of 5000 characters')
  }

  let title = input.trim()
  let due_date: string | undefined
  let priority: 'low' | 'medium' | 'high' | 'critical' | undefined

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

  for (const pattern of priorityPatterns) {
    const match = title.match(pattern.regex)
    if (match) {
      priority = pattern.priority
      title = title.replace(match[0], '').trim()
      break
    }
  }

  title = title.replace(/\s+/g, ' ').trim()

  if (title.length === 0) {
    throw new Error('Task title cannot be empty after extraction')
  }

  return {
    title,
    due_date,
    priority,
  }
}

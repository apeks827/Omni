import { describe, it, expect } from 'vitest'
import { extractTaskData } from '../services/nlp/extractor.js'

describe('NLP Task Extraction', () => {
  describe('Basic extraction', () => {
    it('should extract simple task title', () => {
      const result = extractTaskData('Buy groceries')
      expect(result.title).toBe('Buy groceries')
      expect(result.due_date).toBeUndefined()
      expect(result.priority).toBeUndefined()
    })

    it('should handle empty input', () => {
      expect(() => extractTaskData('')).toThrow('Input cannot be empty')
    })

    it('should handle whitespace-only input', () => {
      expect(() => extractTaskData('   ')).toThrow('Input cannot be empty')
    })

    it('should reject input exceeding 5000 characters', () => {
      const longInput = 'a'.repeat(5001)
      expect(() => extractTaskData(longInput)).toThrow('exceeds maximum length')
    })
  })

  describe('Date extraction', () => {
    it('should extract "today"', () => {
      const result = extractTaskData('Finish report today')
      expect(result.title).toBe('Finish report')
      expect(result.due_date).toBeDefined()
      const dueDate = new Date(result.due_date!)
      const today = new Date()
      expect(dueDate.toDateString()).toBe(today.toDateString())
    })

    it('should extract "tomorrow"', () => {
      const result = extractTaskData('Call client tomorrow')
      expect(result.title).toBe('Call client')
      expect(result.due_date).toBeDefined()
      const dueDate = new Date(result.due_date!)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      expect(dueDate.toDateString()).toBe(tomorrow.toDateString())
    })

    it('should extract "in X days"', () => {
      const result = extractTaskData('Review PR in 3 days')
      expect(result.title).toBe('Review PR')
      expect(result.due_date).toBeDefined()
      const dueDate = new Date(result.due_date!)
      const expected = new Date()
      expected.setDate(expected.getDate() + 3)
      expect(dueDate.toDateString()).toBe(expected.toDateString())
    })

    it('should extract "next Monday"', () => {
      const result = extractTaskData('Meeting next Monday')
      expect(result.title).toBe('Meeting')
      expect(result.due_date).toBeDefined()
    })

    it('should extract ISO date format', () => {
      const result = extractTaskData('Deploy 2026-04-15')
      expect(result.title).toBe('Deploy')
      expect(result.due_date).toBeDefined()
      const dueDate = new Date(result.due_date!)
      expect(dueDate.toISOString().startsWith('2026-04-15')).toBe(true)
    })

    it('should extract MM/DD/YYYY format', () => {
      const result = extractTaskData('Launch 12/25/2026')
      expect(result.title).toBe('Launch')
      expect(result.due_date).toBeDefined()
      const dueDate = new Date(result.due_date!)
      expect(dueDate.toISOString().startsWith('2026-12-25')).toBe(true)
    })
  })

  describe('Priority extraction', () => {
    it('should extract "urgent" as critical', () => {
      const result = extractTaskData('Fix bug urgent')
      expect(result.title).toBe('Fix bug')
      expect(result.priority).toBe('critical')
    })

    it('should extract "critical" as critical', () => {
      const result = extractTaskData('Security patch critical')
      expect(result.title).toBe('Security patch')
      expect(result.priority).toBe('critical')
    })

    it('should extract "high priority" as high', () => {
      const result = extractTaskData('Review code high priority')
      expect(result.title).toBe('Review code')
      expect(result.priority).toBe('high')
    })

    it('should extract "low priority" as low', () => {
      const result = extractTaskData('Update docs low priority')
      expect(result.title).toBe('Update docs')
      expect(result.priority).toBe('low')
    })
  })

  describe('Combined extraction', () => {
    it('should extract date and priority together', () => {
      const result = extractTaskData('Deploy hotfix today urgent')
      expect(result.title).toBe('Deploy hotfix')
      expect(result.due_date).toBeDefined()
      expect(result.priority).toBe('critical')
    })

    it('should handle special characters', () => {
      const result = extractTaskData('Review PR #123 & merge tomorrow')
      expect(result.title).toBe('Review PR #123 & merge')
      expect(result.due_date).toBeDefined()
    })

    it('should normalize whitespace', () => {
      const result = extractTaskData('Task   with    extra     spaces')
      expect(result.title).toBe('Task with extra spaces')
    })
  })

  describe('Intent type classification', () => {
    it('should classify "every day" as habit', () => {
      const result = extractTaskData('Exercise every day at gym')
      expect(result.title).toBe('at gym')
      expect(result.intent_type).toBe('habit')
    })

    it('should classify "daily" as habit', () => {
      const result = extractTaskData('Read daily')
      expect(result.title).toBe('Read')
      expect(result.intent_type).toBe('habit')
    })

    it('should classify "morning routine" as routine', () => {
      const result = extractTaskData('Complete morning routine')
      expect(result.title).toBe('Complete')
      expect(result.intent_type).toBe('routine')
    })

    it('should classify "every Monday" as routine', () => {
      const result = extractTaskData('Team meeting every Monday')
      expect(result.title).toBe('Team meeting')
      expect(result.intent_type).toBe('routine')
    })

    it('should classify workout as habit', () => {
      const result = extractTaskData('Workout session every day')
      expect(result.title).toBe('session')
      expect(result.intent_type).toBe('habit')
    })

    it('should default to task when no pattern matches', () => {
      const result = extractTaskData('Buy groceries tomorrow')
      expect(result.title).toBe('Buy groceries')
      expect(result.intent_type).toBeUndefined()
    })

    it('should prioritize routine over habit', () => {
      const result = extractTaskData('Check daily routine')
      expect(result.title).toBe('Check')
      expect(result.intent_type).toBe('routine')
    })
  })

  describe('Duration extraction', () => {
    it('should extract hours', () => {
      const result = extractTaskData('Write report 2 hours')
      expect(result.title).toBe('Write report')
      expect(result.estimated_duration).toBe(120)
    })

    it('should extract minutes', () => {
      const result = extractTaskData('Call client 15 minutes')
      expect(result.title).toBe('Call client')
      expect(result.estimated_duration).toBe(15)
    })

    it('should extract "mins" shorthand', () => {
      const result = extractTaskData('Review code 30 mins')
      expect(result.title).toBe('Review code')
      expect(result.estimated_duration).toBe(30)
    })

    it('should extract "half an hour"', () => {
      const result = extractTaskData('Meeting half an hour')
      expect(result.title).toBe('Meeting')
      expect(result.estimated_duration).toBe(30)
    })

    it('should extract "quick" as 5 minutes', () => {
      const result = extractTaskData('Quick standup')
      expect(result.title).toBe('standup')
      expect(result.estimated_duration).toBe(5)
    })

    it('should extract "short" as 15 minutes', () => {
      const result = extractTaskData('Short break')
      expect(result.title).toBe('break')
      expect(result.estimated_duration).toBe(15)
    })

    it('should extract "long" as 60 minutes', () => {
      const result = extractTaskData('Long meeting')
      expect(result.title).toBe('meeting')
      expect(result.estimated_duration).toBe(60)
    })
  })

  describe('Performance', () => {
    it('should complete extraction within 100ms', () => {
      const start = Date.now()
      const result = extractTaskData(
        'Buy groceries tomorrow at 5pm high priority'
      )
      const duration = Date.now() - start
      expect(duration).toBeLessThan(100)
      expect(result.title).toBe('Buy groceries')
    })

    it('should handle complex input within 100ms', () => {
      const start = Date.now()
      const result = extractTaskData(
        'Team meeting every Monday at 9am for 1 hour high priority at the office'
      )
      const duration = Date.now() - start
      expect(duration).toBeLessThan(100)
    })
  })

  describe('Edge cases', () => {
    it('should handle task with only date/priority keywords', () => {
      expect(() => extractTaskData('urgent')).toThrow(
        'Task title cannot be empty after extraction'
      )
    })

    it('should handle very long task titles', () => {
      const longTitle = 'a'.repeat(500)
      const result = extractTaskData(longTitle)
      expect(result.title).toBe(longTitle)
    })

    it('should handle malformed input gracefully', () => {
      const result = extractTaskData('!!!@@@###')
      expect(result.title).toBe('!!!@@@###')
    })
  })
})

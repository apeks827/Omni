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
  })
})

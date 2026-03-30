import { describe, it, expect, beforeEach } from 'vitest'
import intentService from '../services/intent/IntentService.js'

describe('Intent Processing Service', () => {
  describe('parseIntent', () => {
    it('should parse simple task intent', async () => {
      const result = await intentService.parseIntent('Buy groceries')

      expect(result.title).toBe('Buy groceries')
      expect(result.intent_type).toBe('task')
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.processing_time_ms).toBeLessThan(500)
      expect(result.id).toMatch(/^intent_/)
      expect(result.input).toBe('Buy groceries')
      expect(result.created_at).toBeDefined()
    })

    it('should parse task with date and priority', async () => {
      const result = await intentService.parseIntent(
        'Deploy hotfix tomorrow urgent'
      )

      expect(result.title).toBe('Deploy hotfix')
      expect(result.due_date).toBeDefined()
      expect(result.priority).toBe('critical')
      expect(result.intent_type).toBe('task')
    })

    it('should classify habit intent', async () => {
      const result = await intentService.parseIntent('Read daily')

      expect(result.title).toBe('Read')
      expect(result.intent_type).toBe('habit')
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('should classify routine intent', async () => {
      const result = await intentService.parseIntent('Complete morning routine')

      expect(result.intent_type).toBe('routine')
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('should extract estimated duration', async () => {
      const result = await intentService.parseIntent('Meeting 30 minutes')

      expect(result.title).toBe('Meeting')
      expect(result.estimated_duration).toBe(30)
    })

    it('should extract location', async () => {
      const result = await intentService.parseIntent(
        'Team standup at the office'
      )

      expect(result.location).toBe('office')
    })

    it('should extract category', async () => {
      const result = await intentService.parseIntent('Review code for work')

      expect(result.category).toBe('work')
    })

    it('should reject empty input', async () => {
      await expect(intentService.parseIntent('')).rejects.toThrow(
        'Input cannot be empty'
      )
    })

    it('should reject input exceeding 5000 characters', async () => {
      const longInput = 'a'.repeat(5001)
      await expect(intentService.parseIntent(longInput)).rejects.toThrow(
        'exceeds maximum length'
      )
    })

    it('should complete within 100ms for simple input', async () => {
      const start = Date.now()
      const result = await intentService.parseIntent('Quick task')
      const duration = Date.now() - start

      expect(duration).toBeLessThan(100)
      expect(result.processing_time_ms).toBeLessThan(100)
    })

    it('should handle complex input', async () => {
      const result = await intentService.parseIntent(
        'Team meeting every Monday at 9am for 1 hour high priority at the office'
      )

      expect(result.title).toBeDefined()
      expect(result.intent_type).toBe('routine')
      expect(result.estimated_duration).toBe(60)
      expect(result.priority).toBe('high')
      expect(result.location).toBe('office')
    })
  })

  describe('getIntent', () => {
    it('should retrieve cached intent by id', async () => {
      const parsed = await intentService.parseIntent('Test task')
      const retrieved = intentService.getIntent(parsed.id)

      expect(retrieved).not.toBeNull()
      expect(retrieved?.id).toBe(parsed.id)
      expect(retrieved?.title).toBe('Test task')
    })

    it('should return null for non-existent intent', () => {
      const result = intentService.getIntent('non_existent_id')
      expect(result).toBeNull()
    })
  })

  describe('Performance', () => {
    it('should handle multiple concurrent requests', async () => {
      const inputs = [
        'Task 1',
        'Task 2 tomorrow',
        'Task 3 urgent',
        'Task 4 every day',
        'Task 5 at office',
      ]

      const results = await Promise.all(
        inputs.map(input => intentService.parseIntent(input))
      )

      expect(results).toHaveLength(5)
      results.forEach((result, index) => {
        expect(result.title).toContain(`Task ${index + 1}`)
        expect(result.processing_time_ms).toBeLessThan(200)
      })
    })
  })

  describe('Structured output', () => {
    it('should return structured task object', async () => {
      const result = await intentService.parseIntent(
        'Buy groceries tomorrow at 5pm'
      )

      expect(result).toMatchObject({
        id: expect.stringMatching(/^intent_/),
        input: 'Buy groceries tomorrow at 5pm',
        title: expect.any(String),
        intent_type: expect.stringMatching(/^(task|habit|routine)$/),
        confidence: expect.any(Number),
        processing_time_ms: expect.any(Number),
        created_at: expect.any(String),
      })

      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })
  })

  describe('Malformed input handling', () => {
    it('should handle special characters gracefully', async () => {
      const result = await intentService.parseIntent('Task #123 & review @john')

      expect(result.title).toBeDefined()
      expect(result.intent_type).toBeDefined()
    })

    it('should handle whitespace-only input', async () => {
      await expect(intentService.parseIntent('   ')).rejects.toThrow(
        'Input cannot be empty'
      )
    })

    it('should normalize multiple spaces', async () => {
      const result = await intentService.parseIntent(
        'Task   with    extra     spaces'
      )

      expect(result.title).toBe('Task with extra spaces')
    })
  })
})

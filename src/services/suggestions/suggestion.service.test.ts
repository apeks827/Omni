import { describe, it, expect, vi, beforeEach } from 'vitest'
import suggestionService from './suggestion.service.js'
import suggestionRepository from './suggestion.repository.js'

vi.mock('./suggestion.repository.js')

const mockRepository = suggestionRepository as unknown as {
  getRules: ReturnType<typeof vi.fn>
  initializeDefaultRules: ReturnType<typeof vi.fn>
  getAllRules: ReturnType<typeof vi.fn>
  upsertRule: ReturnType<typeof vi.fn>
  recordFeedback: ReturnType<typeof vi.fn>
  getFeedbackStats: ReturnType<typeof vi.fn>
}

describe('SuggestionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    suggestionService.invalidateCache('test-workspace')
  })

  describe('getSuggestions', () => {
    it('returns empty suggestions for empty input', async () => {
      const result = await suggestionService.getSuggestions(
        '',
        'test-workspace'
      )
      expect(result.suggestions).toHaveLength(0)
      expect(result.hasSuggestions).toBe(false)
      expect(result.processingTimeMs).toBe(0)
    })

    it('returns empty suggestions for whitespace only input', async () => {
      const result = await suggestionService.getSuggestions(
        '   ',
        'test-workspace'
      )
      expect(result.suggestions).toHaveLength(0)
      expect(result.hasSuggestions).toBe(false)
    })

    it('returns due date suggestion for "tomorrow" keyword', async () => {
      mockRepository.getRules.mockResolvedValue([
        {
          id: '1',
          workspace_id: 'test-workspace',
          field: 'due_date',
          pattern: '\\btomorrow\\b',
          value: 'tomorrow',
          confidence: 0.9,
          enabled: true,
          category: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ])

      const result = await suggestionService.getSuggestions(
        'Buy groceries tomorrow',
        'test-workspace'
      )

      expect(result.hasSuggestions).toBe(true)
      expect(result.suggestions).toHaveLength(1)
      expect(result.suggestions[0].field).toBe('due_date')
      expect(result.suggestions[0].confidence).toBe(0.9)
      expect(result.suggestions[0].matchedText).toBe('tomorrow')
    })

    it('returns priority suggestion for "urgent" keyword', async () => {
      mockRepository.getRules.mockResolvedValue([
        {
          id: '2',
          workspace_id: 'test-workspace',
          field: 'priority',
          pattern: '\\burgent\\b',
          value: 'high',
          confidence: 0.85,
          enabled: true,
          category: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ])

      const result = await suggestionService.getSuggestions(
        'This is urgent work',
        'test-workspace'
      )

      expect(result.hasSuggestions).toBe(true)
      expect(result.suggestions[0].field).toBe('priority')
      expect(result.suggestions[0].value).toBe('high')
    })

    it('returns duration suggestion for time patterns', async () => {
      mockRepository.getRules.mockResolvedValue([
        {
          id: '3',
          workspace_id: 'test-workspace',
          field: 'estimated_duration',
          pattern: '(\\d+)\\s*hours?',
          value: '60',
          confidence: 0.8,
          enabled: true,
          category: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ])

      const result = await suggestionService.getSuggestions(
        'Meeting will take 2 hours',
        'test-workspace'
      )

      expect(result.hasSuggestions).toBe(true)
      expect(result.suggestions[0].field).toBe('estimated_duration')
    })

    it('returns multiple suggestions sorted by confidence', async () => {
      mockRepository.getRules.mockResolvedValue([
        {
          id: '4',
          workspace_id: 'test-workspace',
          field: 'due_date',
          pattern: '\\bnext week\\b',
          value: 'next_week',
          confidence: 0.7,
          enabled: true,
          category: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '5',
          workspace_id: 'test-workspace',
          field: 'priority',
          pattern: '\\bimportant\\b',
          value: 'high',
          confidence: 0.95,
          enabled: true,
          category: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ])

      const result = await suggestionService.getSuggestions(
        'Important task next week',
        'test-workspace'
      )

      expect(result.suggestions).toHaveLength(2)
      expect(result.suggestions[0].confidence).toBe(0.95)
      expect(result.suggestions[1].confidence).toBe(0.7)
    })

    it('only returns one suggestion per field', async () => {
      mockRepository.getRules.mockResolvedValue([
        {
          id: '6',
          workspace_id: 'test-workspace',
          field: 'due_date',
          pattern: '\\btomorrow\\b',
          value: 'tomorrow',
          confidence: 0.9,
          enabled: true,
          category: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '7',
          workspace_id: 'test-workspace',
          field: 'due_date',
          pattern: '\\bnext week\\b',
          value: 'next_week',
          confidence: 0.8,
          enabled: true,
          category: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ])

      const result = await suggestionService.getSuggestions(
        'Task tomorrow next week',
        'test-workspace'
      )

      const dueDateSuggestions = result.suggestions.filter(
        s => s.field === 'due_date'
      )
      expect(dueDateSuggestions).toHaveLength(1)
      expect(dueDateSuggestions[0].confidence).toBe(0.9)
    })

    it('initializes default rules when no rules exist', async () => {
      mockRepository.getRules.mockResolvedValueOnce([])
      mockRepository.initializeDefaultRules.mockResolvedValue(undefined)
      mockRepository.getRules.mockResolvedValueOnce([
        {
          id: '8',
          workspace_id: 'test-workspace',
          field: 'due_date',
          pattern: '\\btoday\\b',
          value: 'today',
          confidence: 0.9,
          enabled: true,
          category: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ])

      const result = await suggestionService.getSuggestions(
        'Do this today',
        'test-workspace'
      )

      expect(mockRepository.initializeDefaultRules).toHaveBeenCalledWith(
        'test-workspace'
      )
      expect(result.hasSuggestions).toBe(true)
    })

    it('caches rules for 60 seconds', async () => {
      mockRepository.getRules.mockResolvedValue([
        {
          id: '9',
          workspace_id: 'test-workspace',
          field: 'priority',
          pattern: '\\bhigh priority\\b',
          value: 'high',
          confidence: 0.85,
          enabled: true,
          category: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ])

      await suggestionService.getSuggestions(
        'high priority task',
        'test-workspace'
      )
      await suggestionService.getSuggestions(
        'high priority task',
        'test-workspace'
      )

      expect(mockRepository.getRules).toHaveBeenCalledTimes(1)
    })

    it('handles invalid regex patterns gracefully', async () => {
      mockRepository.getRules.mockResolvedValue([
        {
          id: '10',
          workspace_id: 'test-workspace',
          field: 'priority',
          pattern: '[invalid',
          value: 'high',
          confidence: 0.85,
          enabled: true,
          category: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ])

      const result = await suggestionService.getSuggestions(
        'high priority task',
        'test-workspace'
      )

      expect(result.suggestions).toHaveLength(0)
    })
  })

  describe('getAllRules', () => {
    it('returns all rules for workspace', async () => {
      const rules = [
        {
          id: '1',
          workspace_id: 'test-workspace',
          field: 'due_date',
          pattern: '\\btoday\\b',
          value: 'today',
          confidence: 0.9,
          enabled: true,
          category: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]
      mockRepository.getAllRules.mockResolvedValue(rules)

      const result = await suggestionService.getAllRules('test-workspace')

      expect(result).toEqual(rules)
      expect(mockRepository.getAllRules).toHaveBeenCalledWith('test-workspace')
    })
  })

  describe('updateRules', () => {
    it('updates rules and invalidates cache', async () => {
      const updatedRule = {
        id: '1',
        workspace_id: 'test-workspace',
        field: 'priority',
        pattern: '\\bcritical\\b',
        value: 'critical',
        confidence: 1.0,
        enabled: true,
        category: null,
        created_at: new Date(),
        updated_at: new Date(),
      }
      mockRepository.upsertRule.mockResolvedValue(updatedRule)

      const result = await suggestionService.updateRules('test-workspace', [
        { pattern: '\\bcritical\\b', field: 'priority', value: 'critical' },
      ])

      expect(result).toEqual([updatedRule])
      expect(mockRepository.upsertRule).toHaveBeenCalledWith('test-workspace', {
        pattern: '\\bcritical\\b',
        field: 'priority',
        value: 'critical',
      })
    })
  })

  describe('recordFeedback', () => {
    it('records accepted feedback', async () => {
      mockRepository.recordFeedback.mockResolvedValue(undefined)

      await suggestionService.recordFeedback(
        'test-workspace',
        'user-1',
        'Buy groceries tomorrow',
        'due_date',
        'tomorrow',
        null,
        true
      )

      expect(mockRepository.recordFeedback).toHaveBeenCalledWith(
        'test-workspace',
        'user-1',
        'Buy groceries tomorrow',
        'due_date',
        'tomorrow',
        null,
        true
      )
    })
  })

  describe('getFeedbackStats', () => {
    it('returns feedback stats for workspace', async () => {
      const stats = [
        {
          accepted: 10,
          rejected: 2,
          total: 12,
          acceptance_rate: 0.833,
        },
      ]
      mockRepository.getFeedbackStats.mockResolvedValue(stats)

      const result = await suggestionService.getFeedbackStats('test-workspace')

      expect(result).toEqual(stats)
    })
  })
})

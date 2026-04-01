import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import PatternAnalyzerService from './pattern-analyzer.service'
import { query } from '../../../config/database'

// Mock database
vi.mock('../../../config/database', () => ({
  query: vi.fn(),
}))

describe('PatternAnalyzerService', () => {
  let service: PatternAnalyzerService

  beforeEach(() => {
    service = new PatternAnalyzerService()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getPatternData', () => {
    it('should return pattern data for valid user', async () => {
      // Mock database response
      const mockRows = [
        {
          task_count: 10,
          avg_duration: 25.5,
          completion_rate: 0.8,
          most_common_hour: 14,
          most_common_day: 3,
        },
      ]

      ;(query as any).mockResolvedValueOnce({ rows: mockRows })

      const result = await service.getPatternData('user-123')

      expect(result).toBeDefined()
      expect(result.taskCount).toBe(10)
      expect(result.avgDuration).toBe(25.5)
      expect(result.completionRate).toBe(0.8)
      expect(result.mostCommonHour).toBe(14)
      expect(result.mostCommonDay).toBe(3)
    })

    it('should handle empty database response', async () => {
      ;(query as any).mockResolvedValueOnce({ rows: [] })

      const result = await service.getPatternData('user-123')

      expect(result).toBeDefined()
      expect(result.taskCount).toBe(0)
      expect(result.avgDuration).toBe(0)
      expect(result.completionRate).toBe(0)
      expect(result.mostCommonHour).toBeNull()
      expect(result.mostCommonDay).toBeNull()
    })

    it('should handle database errors gracefully', async () => {
      ;(query as any).mockRejectedValueOnce(
        new Error('Database connection failed')
      )

      await expect(service.getPatternData('user-123')).rejects.toThrow(
        'Database connection failed'
      )
    })
  })

  describe('calculatePatternScore', () => {
    it('should calculate score based on completion rate', () => {
      const patternData = {
        taskCount: 20,
        avgDuration: 30,
        completionRate: 0.75,
        mostCommonHour: 10,
        mostCommonDay: 2,
      }

      const score = service.calculatePatternScore(patternData)

      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('should return zero score for no tasks', () => {
      const patternData = {
        taskCount: 0,
        avgDuration: 0,
        completionRate: 0,
        mostCommonHour: null,
        mostCommonDay: null,
      }

      const score = service.calculatePatternScore(patternData)

      expect(score).toBe(0)
    })
  })

  describe('getOptimalTimeSlots', () => {
    it('should return optimal time slots based on pattern data', async () => {
      const mockPatternData = {
        taskCount: 15,
        avgDuration: 45,
        completionRate: 0.8,
        mostCommonHour: 9,
        mostCommonDay: 1,
      }

      vi.spyOn(service, 'getPatternData').mockResolvedValueOnce(
        mockPatternData as any
      )

      const result = await service.getOptimalTimeSlots('user-123')

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle errors in pattern data retrieval', async () => {
      vi.spyOn(service, 'getPatternData').mockRejectedValueOnce(
        new Error('Failed to get pattern data')
      )

      await expect(service.getOptimalTimeSlots('user-123')).rejects.toThrow(
        'Failed to get pattern data'
      )
    })
  })

  describe('updatePatternData', () => {
    it('should update pattern data with new task completion', async () => {
      const mockExistingData = {
        taskCount: 5,
        avgDuration: 30,
        completionRate: 0.6,
        mostCommonHour: 10,
        mostCommonDay: 2,
      }

      vi.spyOn(service, 'getPatternData').mockResolvedValueOnce(
        mockExistingData as any
      )
      ;(query as any).mockResolvedValueOnce({ rows: [] })

      await service.updatePatternData('user-123', 45, true)

      // Verify database was called to update pattern
      expect(query).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle null values in database response', async () => {
      const mockRows = [
        {
          task_count: null,
          avg_duration: null,
          completion_rate: null,
          most_common_hour: null,
          most_common_day: null,
        },
      ]

      ;(query as any).mockResolvedValueOnce({ rows: mockRows })

      const result = await service.getPatternData('user-123')

      expect(result.taskCount).toBe(0)
      expect(result.avgDuration).toBe(0)
      expect(result.completionRate).toBe(0)
    })

    it('should validate user ID parameter', async () => {
      await expect(service.getPatternData('')).rejects.toThrow()
      await expect(service.getPatternData(null as any)).rejects.toThrow()
      await expect(service.getPatternData(undefined as any)).rejects.toThrow()
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PatternAnalyzer } from '../../../services/ml/pattern-analyzer.service.js'

vi.mock('../../../config/database.js', () => ({
  query: vi.fn(),
}))

const { query } = await import('../../../config/database.js')

const mockResult = (rows: unknown[]) => ({
  rows,
  command: '',
  rowCount: rows.length,
  oid: 0,
  fields: [],
})

describe('PatternAnalyzer', () => {
  let analyzer: PatternAnalyzer

  beforeEach(() => {
    analyzer = new PatternAnalyzer()
    vi.clearAllMocks()
  })

  describe('analyzeCompletionPatterns', () => {
    it('should return completion patterns grouped by hour', async () => {
      const mockRows = [
        {
          hour: '9',
          task_count: '10',
          avg_duration: '1800',
          completed_count: '8',
        },
        {
          hour: '14',
          task_count: '15',
          avg_duration: '2400',
          completed_count: '12',
        },
      ]

      vi.mocked(query).mockResolvedValue(mockResult(mockRows))

      const result = await analyzer.analyzeCompletionPatterns('user-1', 14)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        hour: 9,
        completionRate: 0.8,
        avgDuration: 1800,
        taskCount: 10,
      })
      expect(result[1]).toEqual({
        hour: 14,
        completionRate: 0.8,
        avgDuration: 2400,
        taskCount: 15,
      })
    })

    it('should handle zero task counts', async () => {
      const mockRows = [
        {
          hour: '9',
          task_count: '0',
          avg_duration: null,
          completed_count: '0',
        },
      ]

      vi.mocked(query).mockResolvedValue(mockResult(mockRows))

      const result = await analyzer.analyzeCompletionPatterns('user-1', 14)

      expect(result[0].completionRate).toBe(0)
      expect(result[0].avgDuration).toBe(0)
    })
  })

  describe('detectPeakHours', () => {
    it('should identify hours with high completion rates', async () => {
      const patterns = [
        { hour: 9, completionRate: 0.9, avgDuration: 1800, taskCount: 10 },
        { hour: 10, completionRate: 0.85, avgDuration: 2000, taskCount: 8 },
        { hour: 14, completionRate: 0.5, avgDuration: 1500, taskCount: 5 },
        { hour: 15, completionRate: 0.3, avgDuration: 1200, taskCount: 4 },
      ]

      const result = await analyzer.detectPeakHours(patterns)

      expect(result).toContain(9)
      expect(result).toContain(10)
      expect(result).not.toContain(15)
    })

    it('should filter out hours with insufficient task count', async () => {
      const patterns = [
        { hour: 9, completionRate: 0.9, avgDuration: 1800, taskCount: 2 },
      ]

      const result = await analyzer.detectPeakHours(patterns)

      expect(result).not.toContain(9)
    })

    it('should return empty array for no patterns', async () => {
      const result = await analyzer.detectPeakHours([])

      expect(result).toEqual([])
    })
  })

  describe('detectLowEnergyPeriods', () => {
    it('should identify hours with low completion rates', async () => {
      const patterns = [
        { hour: 9, completionRate: 0.9, avgDuration: 1800, taskCount: 10 },
        { hour: 13, completionRate: 0.3, avgDuration: 1500, taskCount: 5 },
        { hour: 22, completionRate: 0.2, avgDuration: 1200, taskCount: 4 },
      ]

      const result = await analyzer.detectLowEnergyPeriods(patterns)

      expect(result).toContain(22)
      expect(result.length).toBeGreaterThan(0)
      expect(result).not.toContain(9)
    })

    it('should filter out hours with insufficient task count', async () => {
      const patterns = [
        { hour: 22, completionRate: 0.2, avgDuration: 1200, taskCount: 1 },
      ]

      const result = await analyzer.detectLowEnergyPeriods(patterns)

      expect(result).not.toContain(22)
    })

    it('should return empty array for no patterns', async () => {
      const result = await analyzer.detectLowEnergyPeriods([])

      expect(result).toEqual([])
    })
  })
})

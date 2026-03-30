import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../config/database.js', () => ({
  query: vi.fn(),
}))

vi.mock('../../../services/ml/pattern-analyzer.service.js', () => ({
  patternAnalyzer: {
    analyzeCompletionPatterns: vi.fn(),
    detectPeakHours: vi.fn(),
    detectLowEnergyPeriods: vi.fn(),
  },
}))

const { query } = await import('../../../config/database.js')
const { patternAnalyzer } =
  await import('../../../services/ml/pattern-analyzer.service.js')
const { EnergyLearningService } =
  await import('../../../services/ml/energy-learning.service.js')

const mockQueryResult = (rows: unknown[]) => ({
  rows,
  command: 'SELECT' as const,
  rowCount: rows.length,
  oid: 0,
  fields: [] as never[],
})

describe('EnergyLearningService', () => {
  let service: InstanceType<typeof EnergyLearningService>

  beforeEach(() => {
    service = new EnergyLearningService()
    vi.clearAllMocks()
  })

  describe('hasMinimumData', () => {
    it('should return true when user has >= 20 entries over 14+ days', async () => {
      const fourteenDaysAgo = new Date()
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

      vi.mocked(query).mockResolvedValue(
        mockQueryResult([
          { count: '25', earliest: fourteenDaysAgo.toISOString() },
        ])
      )

      const result = await service.hasMinimumData('user-1')

      expect(result).toBe(true)
    })

    it('should return false when user has < 20 entries', async () => {
      const fourteenDaysAgo = new Date()
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

      vi.mocked(query).mockResolvedValue(
        mockQueryResult([
          { count: '15', earliest: fourteenDaysAgo.toISOString() },
        ])
      )

      const result = await service.hasMinimumData('user-1')

      expect(result).toBe(false)
    })

    it('should return false when user has < 14 days of data', async () => {
      const tenDaysAgo = new Date()
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)

      vi.mocked(query).mockResolvedValue(
        mockQueryResult([{ count: '25', earliest: tenDaysAgo.toISOString() }])
      )

      const result = await service.hasMinimumData('user-1')

      expect(result).toBe(false)
    })

    it('should return false when user has no data', async () => {
      vi.mocked(query).mockResolvedValue(
        mockQueryResult([{ count: '0', earliest: null }])
      )

      const result = await service.hasMinimumData('user-1')

      expect(result).toBe(false)
    })
  })

  describe('updateUserPatterns', () => {
    it('should not update patterns when minimum data not met', async () => {
      vi.mocked(query).mockResolvedValue(
        mockQueryResult([{ count: '5', earliest: new Date().toISOString() }])
      )

      await service.updateUserPatterns('user-1')

      expect(query).toHaveBeenCalledTimes(1)
      expect(query).not.toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO energy_patterns'),
        expect.anything()
      )
    })

    it('should update patterns when minimum data is met', async () => {
      const mockPatterns = [
        { hour: 9, completionRate: 0.8, avgDuration: 1800, taskCount: 10 },
        { hour: 14, completionRate: 0.6, avgDuration: 2000, taskCount: 8 },
      ]

      vi.mocked(query)
        .mockResolvedValueOnce(
          mockQueryResult([
            {
              count: '25',
              earliest: new Date(
                Date.now() - 14 * 24 * 60 * 60 * 1000
              ).toISOString(),
            },
          ])
        )
        .mockResolvedValueOnce(mockQueryResult([]))

      vi.mocked(patternAnalyzer.analyzeCompletionPatterns).mockResolvedValue(
        mockPatterns
      )
      vi.mocked(patternAnalyzer.detectPeakHours).mockResolvedValue([9])
      vi.mocked(patternAnalyzer.detectLowEnergyPeriods).mockResolvedValue([14])

      await service.updateUserPatterns('user-1')

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO energy_patterns'),
        expect.any(Array)
      )
    })
  })

  describe('getConfidenceScore', () => {
    it('should return confidence score from database', async () => {
      vi.mocked(query).mockResolvedValue(
        mockQueryResult([{ confidence_score: '0.85' }])
      )

      const result = await service.getConfidenceScore('user-1')

      expect(result).toBe(0.85)
    })

    it('should return 0 when no pattern exists', async () => {
      vi.mocked(query).mockResolvedValue(mockQueryResult([]))

      const result = await service.getConfidenceScore('user-1')

      expect(result).toBe(0)
    })
  })

  describe('isPatternActive', () => {
    it('should return true when confidence >= 0.7', async () => {
      vi.mocked(query).mockResolvedValue(
        mockQueryResult([{ confidence_score: '0.8' }])
      )

      const result = await service.isPatternActive('user-1')

      expect(result).toBe(true)
    })

    it('should return false when confidence < 0.7', async () => {
      vi.mocked(query).mockResolvedValue(
        mockQueryResult([{ confidence_score: '0.5' }])
      )

      const result = await service.isPatternActive('user-1')

      expect(result).toBe(false)
    })
  })

  describe('getPattern', () => {
    it('should return pattern data with parsed values', async () => {
      const patternData = {
        peakHours: [9, 10, 11],
        lowEnergyPeriods: [13, 22],
        hourlyPatterns: [],
        confidenceScore: 0.85,
        dataPoints: 50,
      }

      vi.mocked(query).mockResolvedValue(
        mockQueryResult([
          {
            pattern_data: patternData,
            confidence_score: '0.85',
            data_points: '50',
          },
        ])
      )

      const result = await service.getPattern('user-1')

      expect(result).toEqual({
        peakHours: [9, 10, 11],
        lowEnergyPeriods: [13, 22],
        hourlyPatterns: [],
        confidenceScore: 0.85,
        dataPoints: 50,
      })
    })

    it('should return null when no pattern exists', async () => {
      vi.mocked(query).mockResolvedValue(mockQueryResult([]))

      const result = await service.getPattern('user-1')

      expect(result).toBeNull()
    })
  })

  describe('calculateConfidence', () => {
    it('should calculate confidence with data weight and consistency weight', () => {
      const patterns = [
        { hour: 9, completionRate: 0.8, avgDuration: 1800, taskCount: 20 },
        { hour: 10, completionRate: 0.8, avgDuration: 2000, taskCount: 20 },
        { hour: 14, completionRate: 0.6, avgDuration: 1500, taskCount: 20 },
      ]

      const dataPoints = 60

      const result = (service as any).calculateConfidence(patterns, dataPoints)

      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThanOrEqual(1)
    })

    it('should return low confidence for inconsistent patterns', () => {
      const patterns = [
        { hour: 9, completionRate: 0.9, avgDuration: 1800, taskCount: 10 },
        { hour: 10, completionRate: 0.1, avgDuration: 2000, taskCount: 10 },
        { hour: 14, completionRate: 0.5, avgDuration: 1500, taskCount: 10 },
      ]

      const dataPoints = 30

      const result = (service as any).calculateConfidence(patterns, dataPoints)

      expect(result).toBeLessThan(0.7)
    })
  })

  describe('calculateVariance', () => {
    it('should return 1 for empty array', () => {
      const result = (service as any).calculateVariance([])

      expect(result).toBe(1)
    })

    it('should return 0 for uniform values', () => {
      const result = (service as any).calculateVariance([0.5, 0.5, 0.5])

      expect(result).toBe(0)
    })

    it('should return positive variance for varied values', () => {
      const result = (service as any).calculateVariance([0.1, 0.5, 0.9])

      expect(result).toBeGreaterThan(0)
    })
  })
})

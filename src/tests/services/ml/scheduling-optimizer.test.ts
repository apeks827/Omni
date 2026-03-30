import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../services/ml/energy-learning.service.js', () => ({
  energyLearningService: {
    getPattern: vi.fn(),
  },
}))

const { energyLearningService } =
  await import('../../../services/ml/energy-learning.service.js')
const { SchedulingOptimizer } =
  await import('../../../services/ml/scheduling-optimizer.service.js')

describe('SchedulingOptimizer', () => {
  let optimizer: InstanceType<typeof SchedulingOptimizer>

  beforeEach(() => {
    optimizer = new SchedulingOptimizer()
    vi.clearAllMocks()
  })

  describe('calculateSlotScore', () => {
    it('should return 0.5 when no pattern exists', async () => {
      vi.mocked(energyLearningService.getPattern).mockResolvedValue(null)

      const result = await optimizer.calculateSlotScore(
        'user-1',
        10,
        'deep_work'
      )

      expect(result).toBe(0.5)
    })

    it('should return 0.5 when pattern confidence < 0.7', async () => {
      vi.mocked(energyLearningService.getPattern).mockResolvedValue({
        peakHours: [9, 10],
        lowEnergyPeriods: [14],
        confidenceScore: 0.5,
        hourlyPatterns: [],
        dataPoints: 10,
      })

      const result = await optimizer.calculateSlotScore(
        'user-1',
        10,
        'deep_work'
      )

      expect(result).toBe(0.5)
    })

    it('should return 1.0 for deep_work during peak hours', async () => {
      vi.mocked(energyLearningService.getPattern).mockResolvedValue({
        peakHours: [9, 10, 11],
        lowEnergyPeriods: [14],
        confidenceScore: 0.8,
        hourlyPatterns: [],
        dataPoints: 50,
      })

      const result = await optimizer.calculateSlotScore(
        'user-1',
        9,
        'deep_work'
      )

      expect(result).toBe(1.0)
    })

    it('should return 0.8 for medium load during peak hours', async () => {
      vi.mocked(energyLearningService.getPattern).mockResolvedValue({
        peakHours: [9, 10, 11],
        lowEnergyPeriods: [14],
        confidenceScore: 0.8,
        hourlyPatterns: [],
        dataPoints: 50,
      })

      const result = await optimizer.calculateSlotScore('user-1', 10, 'medium')

      expect(result).toBe(0.8)
    })

    it('should return 1.0 for admin work during low energy periods', async () => {
      vi.mocked(energyLearningService.getPattern).mockResolvedValue({
        peakHours: [9, 10, 11],
        lowEnergyPeriods: [13, 14],
        confidenceScore: 0.8,
        hourlyPatterns: [],
        dataPoints: 50,
      })

      const result = await optimizer.calculateSlotScore('user-1', 14, 'admin')

      expect(result).toBe(1.0)
    })

    it('should return 0.3 for deep_work during low energy periods', async () => {
      vi.mocked(energyLearningService.getPattern).mockResolvedValue({
        peakHours: [9, 10, 11],
        lowEnergyPeriods: [13, 14],
        confidenceScore: 0.8,
        hourlyPatterns: [],
        dataPoints: 50,
      })

      const result = await optimizer.calculateSlotScore(
        'user-1',
        14,
        'deep_work'
      )

      expect(result).toBe(0.3)
    })
  })

  describe('adjustSchedulingWeights', () => {
    it('should return weights with energy alignment', async () => {
      vi.mocked(energyLearningService.getPattern).mockResolvedValue({
        peakHours: [9, 10],
        lowEnergyPeriods: [14],
        confidenceScore: 0.8,
        hourlyPatterns: [],
        dataPoints: 50,
      })

      const result = await optimizer.adjustSchedulingWeights(
        'deep_work',
        9,
        0.8,
        'user-1'
      )

      expect(result).toEqual({
        timeSlotScore: 0.8,
        priorityMultiplier: 1.2,
        energyAlignment: 1.0,
      })
    })

    it('should use default values when no pattern', async () => {
      vi.mocked(energyLearningService.getPattern).mockResolvedValue(null)

      const result = await optimizer.adjustSchedulingWeights(
        'light',
        12,
        0.5,
        'user-1'
      )

      expect(result).toEqual({
        timeSlotScore: 0.5,
        priorityMultiplier: 0.9,
        energyAlignment: 0.5,
      })
    })
  })

  describe('getPriorityMultiplier', () => {
    it('should return 1.2 for deep_work', () => {
      expect((optimizer as any).getPriorityMultiplier('deep_work')).toBe(1.2)
    })

    it('should return 1.0 for medium', () => {
      expect((optimizer as any).getPriorityMultiplier('medium')).toBe(1.0)
    })

    it('should return 0.9 for light', () => {
      expect((optimizer as any).getPriorityMultiplier('light')).toBe(0.9)
    })

    it('should return 0.8 for admin', () => {
      expect((optimizer as any).getPriorityMultiplier('admin')).toBe(0.8)
    })
  })

  describe('getEnergyAlignment', () => {
    const pattern = {
      peakHours: [9, 10],
      lowEnergyPeriods: [14, 15],
      hourlyPatterns: [],
      dataPoints: 50,
    }

    it('should return 1.0 for deep_work in peak hours', () => {
      expect(
        (optimizer as any).getEnergyAlignment(9, 'deep_work', pattern)
      ).toBe(1.0)
    })

    it('should return 0.8 for medium in peak hours', () => {
      expect((optimizer as any).getEnergyAlignment(10, 'medium', pattern)).toBe(
        0.8
      )
    })

    it('should return 0.6 for light in peak hours', () => {
      expect((optimizer as any).getEnergyAlignment(9, 'light', pattern)).toBe(
        0.6
      )
    })

    it('should return 0.5 for admin in peak hours', () => {
      expect((optimizer as any).getEnergyAlignment(10, 'admin', pattern)).toBe(
        0.5
      )
    })

    it('should return 1.0 for admin in low energy periods', () => {
      expect((optimizer as any).getEnergyAlignment(14, 'admin', pattern)).toBe(
        1.0
      )
    })

    it('should return 0.9 for light in low energy periods', () => {
      expect((optimizer as any).getEnergyAlignment(15, 'light', pattern)).toBe(
        0.9
      )
    })

    it('should return 0.4 for medium in low energy periods', () => {
      expect((optimizer as any).getEnergyAlignment(14, 'medium', pattern)).toBe(
        0.4
      )
    })

    it('should return 0.3 for deep_work in low energy periods', () => {
      expect(
        (optimizer as any).getEnergyAlignment(15, 'deep_work', pattern)
      ).toBe(0.3)
    })

    it('should return 0.5 for neutral hours', () => {
      expect(
        (optimizer as any).getEnergyAlignment(12, 'deep_work', pattern)
      ).toBe(0.5)
    })
  })

  describe('integration: scheduling optimizer with patterns', () => {
    it('should schedule high-priority deep work in peak hours', async () => {
      vi.mocked(energyLearningService.getPattern).mockResolvedValue({
        peakHours: [9, 10, 11, 14, 15, 16],
        lowEnergyPeriods: [13, 22, 23, 0],
        confidenceScore: 0.85,
        hourlyPatterns: [],
        dataPoints: 100,
      })

      const deepWorkScore = await optimizer.calculateSlotScore(
        'user-1',
        10,
        'deep_work'
      )
      const adminScore = await optimizer.calculateSlotScore(
        'user-1',
        10,
        'admin'
      )
      const lowDeepWorkScore = await optimizer.calculateSlotScore(
        'user-1',
        13,
        'deep_work'
      )

      expect(deepWorkScore).toBe(1.0)
      expect(adminScore).toBe(0.5)
      expect(lowDeepWorkScore).toBe(0.3)

      expect(deepWorkScore).toBeGreaterThan(adminScore)
      expect(deepWorkScore).toBeGreaterThan(lowDeepWorkScore)
    })
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import EnergyLearningService from './energy-learning.service'
import { query } from '../../../config/database'

// Mock database
vi.mock('../../../config/database', () => ({
  query: vi.fn(),
}))

describe('EnergyLearningService', () => {
  let service: EnergyLearningService

  beforeEach(() => {
    service = new EnergyLearningService()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getUserEnergyPattern', () => {
    it('should return energy pattern for valid user', async () => {
      // Mock database response
      const mockRows = [
        {
          energy_level: 8,
          task_count: 12,
          hour_of_day: 14,
          day_of_week: 3,
          confidence_score: 0.85,
        },
      ]

      ;(query as any).mockResolvedValueOnce({ rows: mockRows })

      const result = await service.getUserEnergyPattern('user-123')

      expect(result).toBeDefined()
      expect(result.energyLevel).toBe(8)
      expect(result.taskCount).toBe(12)
      expect(result.confidenceScore).toBe(0.85)
    })

    it('should return default pattern when no data exists', async () => {
      ;(query as any).mockResolvedValueOnce({ rows: [] })

      const result = await service.getUserEnergyPattern('user-123')

      expect(result).toBeDefined()
      expect(result.energyLevel).toBe(5) // Default medium energy
      expect(result.taskCount).toBe(0)
      expect(result.confidenceScore).toBe(0)
    })

    it('should handle database errors gracefully', async () => {
      ;(query as any).mockRejectedValueOnce(
        new Error('Database connection failed')
      )

      await expect(service.getUserEnergyPattern('user-123')).rejects.toThrow(
        'Database connection failed'
      )
    })
  })

  describe('updateUserEnergyPattern', () => {
    it('should update energy pattern with new task data', async () => {
      const mockExistingData = {
        energy_level: 6,
        task_count: 8,
        hour_of_day: 10,
        day_of_week: 2,
        confidence_score: 0.6,
      }

      vi.spyOn(service, 'getUserEnergyPattern').mockResolvedValueOnce(
        mockExistingData as any
      )
      ;(query as any).mockResolvedValueOnce({ rows: [] })

      await service.updateUserEnergyPattern('user-123', 9, 15, true)

      // Verify database was called to insert/update pattern
      expect(query).toHaveBeenCalled()
    })
  })

  describe('calculateOptimalScheduleTime', () => {
    it('should return optimal time based on energy patterns', async () => {
      const mockPattern = {
        energyLevel: 8,
        taskCount: 10,
        confidenceScore: 0.9,
      }

      vi.spyOn(service, 'getUserEnergyPattern').mockResolvedValueOnce(
        mockPattern as any
      )

      const result = await service.calculateOptimalScheduleTime('user-123', 60)

      expect(result).toBeDefined()
      expect(typeof result).toBe('number') // Should return timestamp
    })

    it('should handle low confidence patterns conservatively', async () => {
      const mockPattern = {
        energyLevel: 3,
        taskCount: 2,
        confidenceScore: 0.2,
      }

      vi.spyOn(service, 'getUserEnergyPattern').mockResolvedValueOnce(
        mockPattern as any
      )

      const result = await service.calculateOptimalScheduleTime('user-123', 30)

      expect(result).toBeDefined()
      // Should still return a time even with low confidence
    })
  })

  describe('Energy Level Calculations', () => {
    it('should calculate energy level from task completion rate', () => {
      const energyLevel = service.calculateEnergyLevel(0.8, 20) // 80% completion, 20 tasks

      expect(energyLevel).toBeGreaterThanOrEqual(1)
      expect(energyLevel).toBeLessThanOrEqual(10)
    })

    it('should return minimum energy for poor performance', () => {
      const energyLevel = service.calculateEnergyLevel(0.2, 5) // 20% completion, 5 tasks

      expect(energyLevel).toBeLessThanOrEqual(3)
    })

    it('should return maximum energy for excellent performance', () => {
      const energyLevel = service.calculateEnergyLevel(0.95, 50) // 95% completion, 50 tasks

      expect(energyLevel).toBeGreaterThanOrEqual(8)
    })
  })

  describe('Edge Cases', () => {
    it('should validate user ID parameter', async () => {
      await expect(service.getUserEnergyPattern('')).rejects.toThrow()
      await expect(service.getUserEnergyPattern(null as any)).rejects.toThrow()
      await expect(
        service.getUserEnergyPattern(undefined as any)
      ).rejects.toThrow()
    })

    it('should handle extreme values in calculations', () => {
      const energyLevel = service.calculateEnergyLevel(1.0, 1000) // 100% completion, many tasks

      expect(energyLevel).toBeLessThanOrEqual(10)
      expect(energyLevel).toBeGreaterThanOrEqual(1)
    })
  })
})

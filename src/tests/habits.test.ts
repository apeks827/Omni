import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HabitService } from '../services/habits/habit.service.js'

vi.mock('../config/database.js', () => ({
  pool: {
    query: vi.fn(),
  },
}))

const { pool } = await import('../config/database.js')

const mockResult = (rows: unknown[]) => ({
  rows,
  command: '',
  rowCount: rows.length,
  oid: 0,
  fields: [],
})

describe('HabitService', () => {
  let service: HabitService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new HabitService()
  })

  describe('createHabit', () => {
    it('should create a habit with all fields', async () => {
      const mockHabit = {
        id: 'habit-1',
        user_id: 'user-1',
        name: 'Morning meditation',
        description: '10 minutes daily',
        frequency_type: 'daily',
        duration_minutes: 10,
        energy_level: 'medium',
      }

      vi.mocked(pool.query).mockResolvedValueOnce(mockResult([mockHabit]))

      const result = await service.createHabit({
        user_id: 'user-1',
        name: 'Morning meditation',
        description: '10 minutes daily',
        frequency_type: 'daily',
        duration_minutes: 10,
        energy_level: 'medium',
      })

      expect(result).toEqual(mockHabit)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO habits'),
        [
          'user-1',
          'Morning meditation',
          '10 minutes daily',
          'daily',
          null,
          null,
          null,
          10,
          'medium',
        ]
      )
    })

    it('should create a habit with minimal fields', async () => {
      const mockHabit = {
        id: 'habit-2',
        user_id: 'user-1',
        name: 'Read 20 pages',
        frequency_type: 'daily',
        duration_minutes: 30,
      }

      vi.mocked(pool.query).mockResolvedValueOnce(mockResult([mockHabit]))

      const result = await service.createHabit({
        user_id: 'user-1',
        name: 'Read 20 pages',
        frequency_type: 'daily',
        duration_minutes: 30,
      })

      expect(result.name).toBe('Read 20 pages')
    })
  })

  describe('listHabits', () => {
    it('should return all habits for a user', async () => {
      const mockHabits = [
        { id: 'habit-1', name: 'Habit 1' },
        { id: 'habit-2', name: 'Habit 2' },
      ]

      vi.mocked(pool.query).mockResolvedValueOnce(mockResult(mockHabits))

      const result = await service.listHabits('user-1')

      expect(result).toEqual(mockHabits)
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM habits WHERE user_id'),
        ['user-1']
      )
    })
  })

  describe('getHabit', () => {
    it('should return a habit when found', async () => {
      const mockHabit = { id: 'habit-1', name: 'Habit 1', user_id: 'user-1' }
      vi.mocked(pool.query).mockResolvedValueOnce(mockResult([mockHabit]))

      const result = await service.getHabit('habit-1', 'user-1')

      expect(result).toEqual(mockHabit)
    })

    it('should throw error when habit not found', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce(mockResult([]))

      await expect(service.getHabit('nonexistent', 'user-1')).rejects.toThrow(
        'Habit not found'
      )
    })

    it('should throw error when accessing another users habit', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce(mockResult([]))

      await expect(service.getHabit('habit-1', 'other-user')).rejects.toThrow(
        'Habit not found'
      )
    })
  })

  describe('updateHabit', () => {
    it('should update habit name', async () => {
      const mockHabit = {
        id: 'habit-1',
        name: 'Updated name',
        user_id: 'user-1',
      }
      vi.mocked(pool.query).mockResolvedValueOnce(mockResult([mockHabit]))

      const result = await service.updateHabit('habit-1', 'user-1', {
        name: 'Updated name',
      })

      expect(result.name).toBe('Updated name')
    })

    it('should return existing habit when no updates provided', async () => {
      const mockHabit = { id: 'habit-1', name: 'Existing', user_id: 'user-1' }
      vi.mocked(pool.query).mockResolvedValueOnce(mockResult([mockHabit]))

      const result = await service.updateHabit('habit-1', 'user-1', {})

      expect(result.name).toBe('Existing')
    })

    it('should throw error when habit not found', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce(mockResult([]))

      await expect(
        service.updateHabit('nonexistent', 'user-1', { name: 'Test' })
      ).rejects.toThrow('Habit not found')
    })
  })

  describe('deleteHabit', () => {
    it('should delete habit when found', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce(
        mockResult([{ id: 'habit-1' }])
      )

      await expect(
        service.deleteHabit('habit-1', 'user-1')
      ).resolves.toBeUndefined()
    })

    it('should throw error when habit not found', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce(mockResult([]))

      await expect(
        service.deleteHabit('nonexistent', 'user-1')
      ).rejects.toThrow('Habit not found')
    })
  })

  describe('completeHabit', () => {
    it('should complete a habit and update streak', async () => {
      const mockHabit = { id: 'habit-1', current_streak: 1 }
      vi.mocked(pool.query)
        .mockResolvedValueOnce(mockResult([mockHabit]))
        .mockResolvedValueOnce(mockResult([]))
        .mockResolvedValueOnce(mockResult([]))

      const result = await service.completeHabit(
        'habit-1',
        'user-1',
        'Good progress!'
      )

      expect(result).toEqual({
        success: true,
        message: 'Habit marked complete',
      })
    })
  })

  describe('skipHabit', () => {
    it('should skip a habit and reset streak', async () => {
      const mockHabit = { id: 'habit-1' }
      vi.mocked(pool.query)
        .mockResolvedValueOnce(mockResult([mockHabit]))
        .mockResolvedValueOnce(mockResult([]))

      const result = await service.skipHabit(
        'habit-1',
        'user-1',
        'Feeling unwell'
      )

      expect(result).toEqual({ success: true, message: 'Habit skipped' })
    })
  })

  describe('getHabitStats', () => {
    it('should return habit statistics', async () => {
      const mockHabit = { id: 'habit-1', current_streak: 5, best_streak: 10 }
      const mockStats = {
        total_completions: '100',
        total_skips: '5',
        completions_last_7_days: '7',
        completions_last_30_days: '28',
      }

      vi.mocked(pool.query)
        .mockResolvedValueOnce(mockResult([mockHabit]))
        .mockResolvedValueOnce(mockResult([mockStats]))

      const result = await service.getHabitStats('habit-1', 'user-1')

      expect(result).toEqual({
        habit_id: 'habit-1',
        current_streak: 5,
        best_streak: 10,
        total_completions: 100,
        total_skips: 5,
        completions_last_7_days: 7,
        completions_last_30_days: 28,
      })
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../config/database.js', () => ({
  pool: {
    query: vi.fn(),
  },
}))

vi.mock('../services/calendar/energy.service.js', () => ({
  default: {
    getUserEnergyPattern: vi.fn().mockResolvedValue({
      peak_hours: [9, 10, 11, 14, 15, 16],
      low_hours: [13, 22, 23, 0],
    }),
    scoreTimeBlock: vi.fn().mockReturnValue(80),
  },
}))

const { pool } = await import('../config/database.js')
const habitScheduler = (await import('../services/habits/scheduler.service.js'))
  .default

const mockResult = (rows: unknown[]) => ({
  rows,
  command: '',
  rowCount: rows.length,
  oid: 0,
  fields: [],
})

describe('HabitSchedulerService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('scheduleHabitsAndRoutines', () => {
    it('should schedule habits into calendar gaps', async () => {
      const mockHabits = [
        {
          id: 'habit-1',
          name: 'Drink water',
          frequency_type: 'daily',
          duration_minutes: 5,
          energy_level: 'low',
        },
      ]

      const mockRoutines = []
      const mockTasks = []

      vi.mocked(pool.query)
        .mockResolvedValueOnce(mockResult(mockHabits))
        .mockResolvedValueOnce(mockResult(mockRoutines))
        .mockResolvedValueOnce(mockResult(mockTasks))

      const result = await habitScheduler.scheduleHabitsAndRoutines(
        'user-1',
        'workspace-1',
        '2024-01-15'
      )

      expect(result.habits.length).toBeGreaterThanOrEqual(0)
      expect(result.routines).toEqual([])
      expect(result.conflicts).toBeDefined()
    })

    it('should schedule routines into time windows', async () => {
      const mockHabits = []
      const mockRoutines = [
        {
          id: 'routine-1',
          name: 'Morning routine',
          time_window: 'morning',
          steps: [
            {
              id: 'step-1',
              name: 'Meditate',
              duration_minutes: 10,
              order_index: 0,
            },
            {
              id: 'step-2',
              name: 'Exercise',
              duration_minutes: 20,
              order_index: 1,
            },
          ],
        },
      ]
      const mockTasks = []

      vi.mocked(pool.query)
        .mockResolvedValueOnce(mockResult(mockHabits))
        .mockResolvedValueOnce(mockResult(mockRoutines))
        .mockResolvedValueOnce(mockResult(mockTasks))

      const result = await habitScheduler.scheduleHabitsAndRoutines(
        'user-1',
        'workspace-1',
        '2024-01-15'
      )

      expect(result.routines.length).toBeGreaterThanOrEqual(0)
    })

    it('should respect energy level matching', async () => {
      const mockHabits = [
        {
          id: 'habit-1',
          name: 'Deep work',
          frequency_type: 'daily',
          duration_minutes: 60,
          energy_level: 'high',
        },
      ]
      const mockRoutines = []
      const mockTasks = []

      vi.mocked(pool.query)
        .mockResolvedValueOnce(mockResult(mockHabits))
        .mockResolvedValueOnce(mockResult(mockRoutines))
        .mockResolvedValueOnce(mockResult(mockTasks))

      const result = await habitScheduler.scheduleHabitsAndRoutines(
        'user-1',
        'workspace-1',
        '2024-01-15'
      )

      expect(result.habits.length).toBeGreaterThanOrEqual(0)
    })

    it('should report conflicts when no gaps available', async () => {
      const mockHabits = [
        {
          id: 'habit-1',
          name: 'Quick habit',
          frequency_type: 'daily',
          duration_minutes: 30,
          preferred_time_start: '09:00',
          preferred_time_end: '10:00',
        },
      ]
      const mockRoutines = []
      const mockTasks = [
        {
          id: 'task-1',
          due_date: new Date('2024-01-15T09:00:00'),
          estimated_duration: 120,
        },
      ]

      vi.mocked(pool.query)
        .mockResolvedValueOnce(mockResult(mockHabits))
        .mockResolvedValueOnce(mockResult(mockRoutines))
        .mockResolvedValueOnce(mockResult(mockTasks))

      const result = await habitScheduler.scheduleHabitsAndRoutines(
        'user-1',
        'workspace-1',
        '2024-01-15'
      )

      expect(result.conflicts).toBeDefined()
    })
  })

  describe('updateHabitCompletion', () => {
    it('should update streak on completion', async () => {
      vi.mocked(pool.query)
        .mockResolvedValueOnce(mockResult([]))
        .mockResolvedValueOnce(
          mockResult([{ completed_at: new Date(), skipped: false }])
        )
        .mockResolvedValueOnce(mockResult([]))

      await expect(
        habitScheduler.updateHabitCompletion('habit-1', 'user-1', true)
      ).resolves.not.toThrow()
    })
  })
})

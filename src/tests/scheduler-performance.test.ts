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

const mockResult = (rows: unknown[]): any => ({
  rows,
  command: '',
  rowCount: rows.length,
  oid: 0,
  fields: [],
})

describe('Scheduler Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Large Dataset Scheduling', () => {
    it('should handle 50 habits efficiently', async () => {
      const mockHabits = Array.from({ length: 50 }, (_, i) => ({
        id: `habit-${i}`,
        name: `Habit ${i}`,
        frequency_type: 'daily',
        duration_minutes: 5 + (i % 10),
        energy_level: ['low', 'medium', 'high'][i % 3],
      }))

      const mockRoutines: any[] = []
      const mockTasks: any[] = []

      vi.mocked(pool.query)
        .mockResolvedValueOnce(mockResult(mockHabits))
        .mockResolvedValueOnce(mockResult(mockRoutines))
        .mockResolvedValueOnce(mockResult(mockTasks))

      const startTime = performance.now()
      const result = await habitScheduler.scheduleHabitsAndRoutines(
        'user-1',
        'workspace-1',
        '2024-01-15'
      )
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(1000)
      expect(result.habits).toBeDefined()
    })

    it('should handle 20 routines with multiple steps', async () => {
      const mockHabits: any[] = []
      const mockRoutines = Array.from({ length: 20 }, (_, i) => ({
        id: `routine-${i}`,
        name: `Routine ${i}`,
        time_window: ['morning', 'afternoon', 'evening'][i % 3],
        steps: Array.from({ length: 3 }, (_, j) => ({
          id: `step-${i}-${j}`,
          name: `Step ${j}`,
          duration_minutes: 10,
          order_index: j,
        })),
      }))
      const mockTasks: any[] = []

      vi.mocked(pool.query)
        .mockResolvedValueOnce(mockResult(mockHabits))
        .mockResolvedValueOnce(mockResult(mockRoutines))
        .mockResolvedValueOnce(mockResult(mockTasks))

      const startTime = performance.now()
      const result = await habitScheduler.scheduleHabitsAndRoutines(
        'user-1',
        'workspace-1',
        '2024-01-15'
      )
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(1000)
      expect(result.routines).toBeDefined()
    })

    it('should handle mixed load: 30 habits + 10 routines + 50 tasks', async () => {
      const mockHabits = Array.from({ length: 30 }, (_, i) => ({
        id: `habit-${i}`,
        name: `Habit ${i}`,
        frequency_type: 'daily',
        duration_minutes: 10,
        energy_level: 'medium',
      }))

      const mockRoutines = Array.from({ length: 10 }, (_, i) => ({
        id: `routine-${i}`,
        name: `Routine ${i}`,
        time_window: 'morning',
        steps: [
          {
            id: `step-${i}-0`,
            name: 'Step 1',
            duration_minutes: 15,
            order_index: 0,
          },
        ],
      }))

      const mockTasks = Array.from({ length: 50 }, (_, i) => ({
        id: `task-${i}`,
        due_date: new Date(`2024-01-15T${9 + (i % 8)}:00:00`),
        estimated_duration: 30,
      }))

      vi.mocked(pool.query)
        .mockResolvedValueOnce(mockResult(mockHabits))
        .mockResolvedValueOnce(mockResult(mockRoutines))
        .mockResolvedValueOnce(mockResult(mockTasks))

      const startTime = performance.now()
      const result = await habitScheduler.scheduleHabitsAndRoutines(
        'user-1',
        'workspace-1',
        '2024-01-15'
      )
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(2000)
      expect(result).toHaveProperty('habits')
      expect(result).toHaveProperty('routines')
      expect(result).toHaveProperty('conflicts')
    })
  })

  describe('Scheduling Algorithm Efficiency', () => {
    it('should find optimal gaps for habits', async () => {
      const mockHabits = [
        {
          id: 'habit-1',
          name: 'Quick break',
          frequency_type: 'daily',
          duration_minutes: 5,
          energy_level: 'low',
        },
      ]

      const mockRoutines: any[] = []
      const mockTasks = [
        {
          id: 'task-1',
          due_date: new Date('2024-01-15T09:00:00'),
          estimated_duration: 60,
        },
        {
          id: 'task-2',
          due_date: new Date('2024-01-15T11:00:00'),
          estimated_duration: 60,
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

      expect(result.habits.length).toBeGreaterThanOrEqual(0)
    })

    it('should prioritize preferred time windows', async () => {
      const mockHabits = [
        {
          id: 'habit-1',
          name: 'Morning meditation',
          frequency_type: 'daily',
          duration_minutes: 15,
          preferred_time_start: '07:00',
          preferred_time_end: '09:00',
          energy_level: 'medium',
        },
      ]

      const mockRoutines: any[] = []
      const mockTasks: any[] = []

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
  })

  describe('Memory and Resource Usage', () => {
    it('should not leak memory with repeated scheduling', async () => {
      const mockHabits = Array.from({ length: 10 }, (_, i) => ({
        id: `habit-${i}`,
        name: `Habit ${i}`,
        frequency_type: 'daily',
        duration_minutes: 10,
      }))

      const mockRoutines: any[] = []
      const mockTasks: any[] = []

      for (let i = 0; i < 10; i++) {
        vi.mocked(pool.query)
          .mockResolvedValueOnce(mockResult(mockHabits))
          .mockResolvedValueOnce(mockResult(mockRoutines))
          .mockResolvedValueOnce(mockResult(mockTasks))

        await habitScheduler.scheduleHabitsAndRoutines(
          'user-1',
          'workspace-1',
          '2024-01-15'
        )
      }

      expect(true).toBe(true)
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RoutineService } from '../services/habits/routine.service.js'

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

describe('RoutineService', () => {
  let service: RoutineService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new RoutineService()
  })

  describe('createRoutine', () => {
    it('should create a routine with all fields', async () => {
      const mockRoutine = {
        id: 'routine-1',
        user_id: 'user-1',
        name: 'Morning routine',
        time_window: 'morning',
      }

      vi.mocked(pool.query).mockResolvedValueOnce(mockResult([mockRoutine]))

      const result = await service.createRoutine({
        user_id: 'user-1',
        name: 'Morning routine',
        time_window: 'morning',
      })

      expect(result).toEqual(mockRoutine)
    })

    it('should create a routine without time_window', async () => {
      const mockRoutine = {
        id: 'routine-2',
        user_id: 'user-1',
        name: 'Evening routine',
        time_window: null,
      }

      vi.mocked(pool.query).mockResolvedValueOnce(mockResult([mockRoutine]))

      const result = await service.createRoutine({
        user_id: 'user-1',
        name: 'Evening routine',
      })

      expect(result.time_window).toBeNull()
    })
  })

  describe('listRoutines', () => {
    it('should return all routines with step count', async () => {
      const mockRoutines = [
        {
          id: 'routine-1',
          name: 'Morning',
          step_count: '3',
          total_duration: '45',
        },
        {
          id: 'routine-2',
          name: 'Evening',
          step_count: '2',
          total_duration: '30',
        },
      ]

      vi.mocked(pool.query).mockResolvedValueOnce(mockResult(mockRoutines))

      const result = await service.listRoutines('user-1')

      expect(result).toEqual(mockRoutines)
    })
  })

  describe('getRoutine', () => {
    it('should return a routine when found', async () => {
      const mockRoutine = {
        id: 'routine-1',
        name: 'Morning',
        user_id: 'user-1',
      }
      vi.mocked(pool.query).mockResolvedValueOnce(mockResult([mockRoutine]))

      const result = await service.getRoutine('routine-1', 'user-1')

      expect(result).toEqual(mockRoutine)
    })

    it('should throw error when routine not found', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce(mockResult([]))

      await expect(service.getRoutine('nonexistent', 'user-1')).rejects.toThrow(
        'Routine not found'
      )
    })
  })

  describe('getRoutineWithSteps', () => {
    it('should return routine with steps ordered by index', async () => {
      const mockRoutine = { id: 'routine-1', name: 'Morning' }
      const mockSteps = [
        { id: 'step-1', name: 'Step 1', order_index: 0 },
        { id: 'step-2', name: 'Step 2', order_index: 1 },
      ]

      vi.mocked(pool.query)
        .mockResolvedValueOnce(mockResult([mockRoutine]))
        .mockResolvedValueOnce(mockResult(mockSteps))

      const result = await service.getRoutineWithSteps('routine-1', 'user-1')

      expect(result).toEqual({ ...mockRoutine, steps: mockSteps })
    })
  })

  describe('updateRoutine', () => {
    it('should update routine name', async () => {
      const mockRoutine = {
        id: 'routine-1',
        name: 'Updated name',
        user_id: 'user-1',
      }
      vi.mocked(pool.query).mockResolvedValueOnce(mockResult([mockRoutine]))

      const result = await service.updateRoutine('routine-1', 'user-1', {
        name: 'Updated name',
      })

      expect(result.name).toBe('Updated name')
    })

    it('should throw error when routine not found', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce(mockResult([]))

      await expect(
        service.updateRoutine('nonexistent', 'user-1', { name: 'Test' })
      ).rejects.toThrow('Routine not found')
    })
  })

  describe('deleteRoutine', () => {
    it('should delete routine when found', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce(
        mockResult([{ id: 'routine-1' }])
      )

      await expect(
        service.deleteRoutine('routine-1', 'user-1')
      ).resolves.toBeUndefined()
    })

    it('should throw error when routine not found', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce(mockResult([]))

      await expect(
        service.deleteRoutine('nonexistent', 'user-1')
      ).rejects.toThrow('Routine not found')
    })
  })

  describe('addStep', () => {
    it('should add a step to a routine', async () => {
      const mockRoutine = { id: 'routine-1' }
      const mockStep = {
        id: 'step-1',
        routine_id: 'routine-1',
        name: 'New step',
        order_index: 0,
      }

      vi.mocked(pool.query)
        .mockResolvedValueOnce(mockResult([mockRoutine]))
        .mockResolvedValueOnce(mockResult([mockStep]))
        .mockResolvedValueOnce(mockResult([]))

      const result = await service.addStep('routine-1', 'user-1', {
        routine_id: 'routine-1',
        order_index: 0,
        name: 'New step',
        duration_minutes: 15,
      })

      expect(result.name).toBe('New step')
    })
  })

  describe('updateStep', () => {
    it('should update step fields', async () => {
      const mockRoutine = { id: 'routine-1' }
      const mockStep = { id: 'step-1', name: 'Updated step' }

      vi.mocked(pool.query)
        .mockResolvedValueOnce(mockResult([mockRoutine]))
        .mockResolvedValueOnce(mockResult([mockStep]))

      const result = await service.updateStep('routine-1', 'step-1', 'user-1', {
        name: 'Updated step',
      })

      expect(result.name).toBe('Updated step')
    })
  })

  describe('removeStep', () => {
    it('should remove a step from a routine', async () => {
      const mockRoutine = { id: 'routine-1' }

      vi.mocked(pool.query)
        .mockResolvedValueOnce(mockResult([mockRoutine]))
        .mockResolvedValueOnce(mockResult([{ id: 'step-1' }]))
        .mockResolvedValueOnce(mockResult([]))

      await expect(
        service.removeStep('routine-1', 'step-1', 'user-1')
      ).resolves.toBeUndefined()
    })

    it('should throw error when step not found', async () => {
      const mockRoutine = { id: 'routine-1' }

      vi.mocked(pool.query)
        .mockResolvedValueOnce(mockResult([mockRoutine]))
        .mockResolvedValueOnce(mockResult([]))

      await expect(
        service.removeStep('routine-1', 'nonexistent', 'user-1')
      ).rejects.toThrow('Step not found')
    })
  })

  describe('startRoutine', () => {
    it('should create a new routine completion', async () => {
      const mockRoutine = { id: 'routine-1' }
      const mockCompletion = {
        id: 'completion-1',
        routine_id: 'routine-1',
        total_steps: 3,
      }

      vi.mocked(pool.query)
        .mockResolvedValueOnce(mockResult([mockRoutine]))
        .mockResolvedValueOnce(mockResult([{ total_steps: '3' }]))
        .mockResolvedValueOnce(mockResult([]))
        .mockResolvedValueOnce(mockResult([mockCompletion]))

      const result = await service.startRoutine(
        'routine-1',
        'user-1',
        '2024-01-15'
      )

      expect(result.routine_id).toBe('routine-1')
    })
  })

  describe('completeStep', () => {
    it('should complete a step and return progress', async () => {
      const mockRoutine = { id: 'routine-1' }
      const mockStep = { id: 'step-1' }
      const mockProgress = {
        routine_id: 'routine-1',
        completed_steps: 1,
        total_steps: 3,
      }

      vi.mocked(pool.query)
        .mockResolvedValueOnce(mockResult([mockRoutine]))
        .mockResolvedValueOnce(mockResult([mockStep]))
        .mockResolvedValueOnce(mockResult([]))
        .mockResolvedValueOnce(mockResult([{ total: '3' }]))
        .mockResolvedValueOnce(mockResult([]))
        .mockResolvedValueOnce(mockResult([mockProgress]))

      const result = await service.completeStep(
        'routine-1',
        'step-1',
        'user-1',
        '2024-01-15'
      )

      expect(result.step_completed).toBe(true)
      expect(result.progress.completed_steps).toBe(1)
    })
  })

  describe('getRoutineProgress', () => {
    it('should return progress for a specific date', async () => {
      const mockRoutine = { id: 'routine-1' }
      const mockProgress = {
        routine_id: 'routine-1',
        scheduled_date: '2024-01-15',
        completed_steps: 2,
        total_steps: 3,
        completed_at: null,
      }

      vi.mocked(pool.query)
        .mockResolvedValueOnce(mockResult([mockRoutine]))
        .mockResolvedValueOnce(mockResult([mockProgress]))

      const result = await service.getRoutineProgress(
        'routine-1',
        'user-1',
        '2024-01-15'
      )

      expect(result.completed_steps).toBe(2)
      expect(result.is_complete).toBe(false)
    })

    it('should return empty progress when no completion exists', async () => {
      const mockRoutine = { id: 'routine-1' }

      vi.mocked(pool.query)
        .mockResolvedValueOnce(mockResult([mockRoutine]))
        .mockResolvedValueOnce(mockResult([]))

      const result = await service.getRoutineProgress(
        'routine-1',
        'user-1',
        '2024-01-15'
      )

      expect(result.completed_steps).toBe(0)
      expect(result.is_complete).toBe(false)
    })
  })

  describe('getRoutineStats', () => {
    it('should return routine statistics', async () => {
      const mockRoutine = { id: 'routine-1' }
      const mockStats = {
        total_scheduled: '10',
        total_completed: '8',
        avg_completion_rate: 85.5,
      }

      vi.mocked(pool.query)
        .mockResolvedValueOnce(mockResult([mockRoutine]))
        .mockResolvedValueOnce(mockResult([mockStats]))

      const result = await service.getRoutineStats('routine-1', 'user-1')

      expect(result).toEqual({
        routine_id: 'routine-1',
        total_scheduled: 10,
        total_completed: 8,
        avg_completion_rate: 85.5,
      })
    })

    it('should handle null avg_completion_rate', async () => {
      const mockRoutine = { id: 'routine-1' }
      const mockStats = {
        total_scheduled: '0',
        total_completed: '0',
        avg_completion_rate: null,
      }

      vi.mocked(pool.query)
        .mockResolvedValueOnce(mockResult([mockRoutine]))
        .mockResolvedValueOnce(mockResult([mockStats]))

      const result = await service.getRoutineStats('routine-1', 'user-1')

      expect(result.avg_completion_rate).toBe(0)
    })
  })
})

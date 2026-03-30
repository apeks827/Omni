import { describe, it, expect, vi, beforeEach } from 'vitest'
import rebalancerService from '../../services/calendar/rebalancer.js'

vi.mock('../../config/database.js', () => ({
  pool: { query: vi.fn() },
}))

vi.mock('../../services/calendar/energy.service.js', () => ({
  default: { scoreTimeBlock: vi.fn().mockReturnValue(80) },
}))

const { pool } = await import('../../config/database.js')
const energyService = (
  await import('../../services/calendar/energy.service.js')
).default

const mockResult = (rows: unknown[]) => ({
  rows,
  command: '',
  rowCount: rows.length,
  oid: 0,
  fields: [],
})

describe('RebalancerService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rebalanceSchedule', () => {
    it('should throw error when user not found', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce(mockResult([]))

      await expect(
        rebalancerService.rebalanceSchedule({
          userId: 'user-none',
          workspaceId: 'ws-1',
        })
      ).rejects.toThrow('User not found')
    })

    it('should reschedule missed tasks', async () => {
      const mockUser = {
        rows: [{ low_energy_mode: false, energy_pattern: { peak: [9, 10] } }],
      }

      const mockMissed = {
        rows: [
          {
            id: 'task-missed',
            title: 'Overdue',
            priority: 'high',
            estimated_duration: 60,
            due_date: new Date(Date.now() - 1000 * 60 * 60),
          },
        ],
      }

      vi.mocked(pool.query)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockMissed)
        .mockResolvedValueOnce(mockResult([]))
        .mockResolvedValueOnce(mockResult([]))

      await rebalancerService.rebalanceSchedule({
        userId: 'user-1',
        workspaceId: 'ws-1',
      })

      expect(pool.query).toHaveBeenCalledTimes(4)
    })

    it('should filter low energy tasks in low energy mode', async () => {
      vi.mocked(pool.query)
        .mockResolvedValueOnce(
          mockResult([{ low_energy_mode: true, energy_pattern: null }])
        )
        .mockResolvedValueOnce(mockResult([]))
        .mockResolvedValueOnce(mockResult([]))

      await rebalancerService.rebalanceSchedule({
        userId: 'user-1',
        workspaceId: 'ws-1',
        triggerTaskId: 'task-1',
      })

      const calls = vi.mocked(pool.query).mock.calls
      const lastCall = calls[calls.length - 1]
      expect(lastCall[0]).toContain('UPDATE tasks')
    })

    it('should skip already completed trigger task', async () => {
      vi.mocked(pool.query)
        .mockResolvedValueOnce(
          mockResult([{ low_energy_mode: false, energy_pattern: null }])
        )
        .mockResolvedValueOnce(mockResult([]))

      await rebalancerService.rebalanceSchedule({
        userId: 'user-1',
        workspaceId: 'ws-1',
        triggerTaskId: 'task-1',
      })

      const missedQueryCall = vi.mocked(pool.query).mock.calls[1]
      expect(missedQueryCall[1]).toContain('task-1')
    })
  })

  describe('bumpLowerPriorityTask', () => {
    it('should return true when no conflicting tasks', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce(mockResult([]))

      const result = await rebalancerService.bumpLowerPriorityTask(
        { id: 'task-hi', priority: 'high' } as any,
        new Date(),
        'user-1',
        'ws-1'
      )

      expect(result).toBe(true)
    })

    it('should return false when conflicting task has higher priority', async () => {
      vi.mocked(pool.query)
        .mockResolvedValueOnce(
          mockResult([
            {
              id: 'task-conflict',
              priority: 'critical',
              estimated_duration: 60,
            },
          ])
        )
        .mockResolvedValueOnce(mockResult([]))
        .mockResolvedValueOnce(mockResult([]))

      const result = await rebalancerService.bumpLowerPriorityTask(
        { id: 'task-hi', priority: 'high' } as any,
        new Date(),
        'user-1',
        'ws-1'
      )

      expect(result).toBe(false)
    })

    it('should reschedule conflicting lower priority task', async () => {
      vi.mocked(pool.query)
        .mockResolvedValueOnce(
          mockResult([
            { id: 'task-conflict', priority: 'low', estimated_duration: 30 },
          ])
        )
        .mockResolvedValueOnce(
          mockResult([{ energy_pattern: { peak: [9, 10] } }])
        )
        .mockResolvedValueOnce(mockResult([]))
        .mockResolvedValueOnce(mockResult([]))
        .mockResolvedValueOnce(mockResult([]))

      const result = await rebalancerService.bumpLowerPriorityTask(
        { id: 'task-hi', priority: 'high' } as any,
        new Date(),
        'user-1',
        'ws-1'
      )

      expect(result).toBe(true)
    })
  })
})

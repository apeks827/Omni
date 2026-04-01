import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RescheduleService } from '../../services/scheduling/reschedule.service.js'

const mockQuery = vi.fn()

vi.mock('../../config/database.js', () => ({
  query: (...args: any[]) => mockQuery(...args),
}))

vi.mock('../../services/scheduling/scheduler.js', () => ({
  scheduleTask: vi.fn(),
}))

vi.mock('../../services/notifications/notification.service.js', () => ({
  default: {
    createNotification: vi.fn().mockResolvedValue(null),
  },
}))

describe('RescheduleService', () => {
  let service: RescheduleService

  beforeEach(() => {
    vi.clearAllMocks()
    mockQuery.mockReset()
    service = new RescheduleService()
  })

  describe('detectMissedTasks', () => {
    it('should detect missed tasks that need rescheduling', async () => {
      const mockMissedTasks = [
        {
          id: 'slot-1',
          task_id: 'task-1',
          user_id: 'user-1',
          workspace_id: 'ws-1',
          start_time: new Date('2026-03-30T09:00:00Z'),
          end_time: new Date('2026-03-30T10:00:00Z'),
          task_title: 'Missed Task',
          task_priority: 'high',
          estimated_duration: 60,
        },
      ]

      mockQuery.mockResolvedValueOnce({ rows: mockMissedTasks })

      const result = await service.detectMissedTasks()

      expect(result).toHaveLength(1)
      expect(result[0].task_id).toBe('task-1')
      expect(mockQuery).toHaveBeenCalledTimes(1)
    })

    it('should exclude tasks already rescheduled today', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      await service.detectMissedTasks()

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('NOT EXISTS')
      )
    })
  })

  describe('rescheduleTask', () => {
    it('should reschedule a missed task', async () => {
      const { scheduleTask } =
        await import('../../services/scheduling/scheduler.js')
      const mockScheduleResponse = {
        task_id: 'task-1',
        suggested_slot: {
          start_time: new Date('2026-03-30T14:00:00Z'),
          end_time: new Date('2026-03-30T15:00:00Z'),
          confidence: 0.85,
        },
        reasoning: 'Priority: high | Suggested: 2026-03-30 at 14:00',
        alternative_slots: [],
      }

      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 'reschedule-1' }],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ title: 'Test Task' }] })

      vi.mocked(scheduleTask).mockResolvedValueOnce(mockScheduleResponse)

      const result = await service.rescheduleTask(
        'task-1',
        'user-1',
        'ws-1',
        new Date('2026-03-30T09:00:00Z')
      )

      expect(result).not.toBeNull()
      expect(result?.task_id).toBe('task-1')
      expect(result?.reason).toContain('Moved from')
    })

    it('should return null when no slot is available', async () => {
      const { scheduleTask } =
        await import('../../services/scheduling/scheduler.js')
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'reschedule-1' }],
      })

      vi.mocked(scheduleTask).mockResolvedValueOnce({
        task_id: 'task-1',
        suggested_slot: null as any,
        reasoning: '',
        alternative_slots: [],
      })

      const result = await service.rescheduleTask(
        'task-1',
        'user-1',
        'ws-1',
        new Date('2026-03-30T09:00:00Z')
      )

      expect(result).toBeNull()
    })
  })

  describe('handleUserResponse', () => {
    it('should handle accepted response', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ task_id: 'task-1', rescheduled_time: new Date() }],
      })

      const result = await service.handleUserResponse(
        'reschedule-1',
        'user-1',
        'accepted'
      )

      expect(result).toBe(true)
    })

    it('should handle rejected response by resetting task status', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ task_id: 'task-1', rescheduled_time: new Date() }],
        })
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValueOnce({ rowCount: 1 })

      const result = await service.handleUserResponse(
        'reschedule-1',
        'user-1',
        'rejected'
      )

      expect(result).toBe(true)
      expect(mockQuery).toHaveBeenCalledTimes(3)
    })

    it('should return false for non-existent reschedule', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const result = await service.handleUserResponse(
        'non-existent',
        'user-1',
        'accepted'
      )

      expect(result).toBe(false)
    })
  })

  describe('getAcceptanceRate', () => {
    it('should calculate acceptance rate correctly', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ accepted: '8', total: '10' }],
      })

      const result = await service.getAcceptanceRate('user-1', 30)

      expect(result).toBe(80)
    })

    it('should return 0 when no reschedules exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ accepted: '0', total: '0' }] })

      const result = await service.getAcceptanceRate('user-1', 30)

      expect(result).toBe(0)
    })
  })
})

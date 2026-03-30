import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueueService } from '../../services/queue/queue.service.js'

vi.mock('../../config/database.js', () => ({
  query: vi.fn(),
}))

const { query } = await import('../../config/database.js')

const mockResult = (rows: unknown[]) => ({
  rows,
  command: '',
  rowCount: rows.length,
  oid: 0,
  fields: [],
})

describe('QueueService', () => {
  let queueService: QueueService

  beforeEach(() => {
    queueService = new QueueService()
    vi.clearAllMocks()
  })

  describe('getNextTask', () => {
    it('should return highest priority unassigned task', async () => {
      const mockTask = {
        id: 'task-1',
        title: 'Critical task',
        priority: 'critical',
        status: 'todo',
        workspace_id: 'ws-1',
        assignee_id: null,
      }

      vi.mocked(query).mockResolvedValueOnce(mockResult([mockTask]))

      const result = await queueService.getNextTask({
        workspace_id: 'ws-1',
      })

      expect(result).toEqual(mockTask)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY'),
        expect.arrayContaining(['ws-1'])
      )
    })

    it('should filter by role when provided', async () => {
      vi.mocked(query).mockResolvedValueOnce(mockResult([]))

      await queueService.getNextTask({
        workspace_id: 'ws-1',
        role: 'backend',
      })

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('required_role'),
        expect.arrayContaining(['ws-1', 'backend'])
      )
    })

    it('should return null when no tasks available', async () => {
      vi.mocked(query).mockResolvedValueOnce(mockResult([]))

      const result = await queueService.getNextTask({
        workspace_id: 'ws-1',
      })

      expect(result).toBeNull()
    })

    it('should respect limit parameter', async () => {
      vi.mocked(query).mockResolvedValueOnce(mockResult([]))

      await queueService.getNextTask({
        workspace_id: 'ws-1',
        limit: 5,
      })

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        expect.arrayContaining(['ws-1', 5])
      )
    })
  })

  describe('claimTask', () => {
    it('should assign task to agent and set status to in_progress', async () => {
      const mockTask = {
        id: 'task-1',
        assignee_id: 'agent-1',
        status: 'in_progress',
      }

      vi.mocked(query).mockResolvedValueOnce(mockResult([mockTask]))

      const result = await queueService.claimTask('task-1', 'agent-1', 'ws-1')

      expect(result).toEqual(mockTask)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE tasks'),
        ['agent-1', 'task-1', 'ws-1']
      )
    })

    it('should throw error when task not available', async () => {
      vi.mocked(query).mockResolvedValueOnce(mockResult([]))

      await expect(
        queueService.claimTask('task-1', 'agent-1', 'ws-1')
      ).rejects.toThrow('Task not available for claiming')
    })
  })

  describe('autoAssignNext', () => {
    it('should find and claim next task for agent', async () => {
      const mockAgent = {
        id: 'agent-1',
        role: 'backend',
        capabilities: ['api', 'database'],
      }

      const mockTask = {
        id: 'task-2',
        title: 'Next task',
        priority: 'high',
      }

      vi.mocked(query)
        .mockResolvedValueOnce(mockResult([mockAgent]))
        .mockResolvedValueOnce(mockResult([mockTask]))
        .mockResolvedValueOnce(
          mockResult([{ ...mockTask, assignee_id: 'agent-1' }])
        )

      const result = await queueService.autoAssignNext(
        'task-1',
        'agent-1',
        'ws-1'
      )

      expect(result).toBeDefined()
      expect(result?.id).toBe('task-2')
    })

    it('should return null when agent not found', async () => {
      vi.mocked(query).mockResolvedValueOnce(mockResult([]))

      const result = await queueService.autoAssignNext(
        'task-1',
        'agent-1',
        'ws-1'
      )

      expect(result).toBeNull()
    })

    it('should return null when no next task available', async () => {
      const mockAgent = { id: 'agent-1', role: 'backend' }

      vi.mocked(query)
        .mockResolvedValueOnce(mockResult([mockAgent]))
        .mockResolvedValueOnce(mockResult([]))

      const result = await queueService.autoAssignNext(
        'task-1',
        'agent-1',
        'ws-1'
      )

      expect(result).toBeNull()
    })
  })

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      vi.mocked(query)
        .mockResolvedValueOnce(mockResult([{ count: '10' }]))
        .mockResolvedValueOnce(
          mockResult([
            { priority: 'critical', count: '2' },
            { priority: 'high', count: '5' },
            { priority: 'medium', count: '3' },
          ])
        )
        .mockResolvedValueOnce(
          mockResult([
            { role: 'backend', count: '6' },
            { role: null, count: '4' },
          ])
        )

      const result = await queueService.getQueueStats('ws-1')

      expect(result.total).toBe(10)
      expect(result.byPriority).toEqual({
        critical: 2,
        high: 5,
        medium: 3,
      })
      expect(result.byRole).toEqual({
        backend: 6,
        any: 4,
      })
    })

    it('should handle empty queue', async () => {
      vi.mocked(query)
        .mockResolvedValueOnce(mockResult([{ count: '0' }]))
        .mockResolvedValueOnce(mockResult([]))
        .mockResolvedValueOnce(mockResult([]))

      const result = await queueService.getQueueStats('ws-1')

      expect(result.total).toBe(0)
      expect(result.byPriority).toEqual({})
      expect(result.byRole).toEqual({})
    })
  })
})

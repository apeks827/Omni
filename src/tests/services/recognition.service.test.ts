import { describe, it, expect, vi, beforeEach } from 'vitest'
import recognitionService from '../../services/recognition/recognition.service.js'

vi.mock('../../config/database.js', () => ({
  query: vi.fn(),
}))

import { query } from '../../config/database.js'

const mockQuery = query as ReturnType<typeof vi.fn>

describe('RecognitionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('trackVelocityBonus', () => {
    it('should not create recognition when completion time exceeds target', async () => {
      const result = await recognitionService.trackVelocityBonus(
        'agent-1',
        'workspace-1',
        'task-1',
        5
      )
      expect(result).toBeNull()
    })

    it('should create recognition when completing ahead of schedule', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'rec-1',
            agent_id: 'agent-1',
            workspace_id: 'workspace-1',
            type: 'velocity_bonus',
            description: 'Completed task 1.5h ahead of target (2.5h actual)',
            task_id: 'task-1',
            week: 13,
            year: 2026,
            created_at: new Date(),
          },
        ],
      })

      const result = await recognitionService.trackVelocityBonus(
        'agent-1',
        'workspace-1',
        'task-1',
        2.5
      )

      expect(result).not.toBeNull()
      expect(result?.type).toBe('velocity_bonus')
    })
  })

  describe('trackQualityChampion', () => {
    it('should not create recognition when review required revise', async () => {
      const result = await recognitionService.trackQualityChampion(
        'agent-1',
        'workspace-1',
        false
      )
      expect(result).toBeNull()
    })

    it('should create recognition when approved without revise', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'rec-2',
            agent_id: 'agent-1',
            workspace_id: 'workspace-1',
            type: 'quality_champion',
            description: 'Passed review without REVISE cycle',
            task_id: null,
            week: 13,
            year: 2026,
            created_at: new Date(),
          },
        ],
      })

      const result = await recognitionService.trackQualityChampion(
        'agent-1',
        'workspace-1',
        true
      )

      expect(result).not.toBeNull()
      expect(result?.type).toBe('quality_champion')
    })
  })

  describe('trackImpactMultiplier', () => {
    it('should not create recognition when bugFixesCount is 0', async () => {
      const result = await recognitionService.trackImpactMultiplier(
        'agent-1',
        'workspace-1',
        'task-1',
        0
      )
      expect(result).toBeNull()
    })

    it('should create recognition when bug fixes are present', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'rec-3',
            agent_id: 'agent-1',
            workspace_id: 'workspace-1',
            type: 'impact_multiplier',
            description: 'Proactively fixed 3 bug(s)',
            task_id: 'task-1',
            week: 13,
            year: 2026,
            created_at: new Date(),
          },
        ],
      })

      const result = await recognitionService.trackImpactMultiplier(
        'agent-1',
        'workspace-1',
        'task-1',
        3
      )

      expect(result).not.toBeNull()
      expect(result?.type).toBe('impact_multiplier')
    })
  })

  describe('getAgentStats', () => {
    it('should calculate agent stats correctly', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            { agent_id: 'agent-1', type: 'velocity_bonus', count: '5' },
            { agent_id: 'agent-1', type: 'quality_champion', count: '3' },
            { agent_id: 'agent-1', type: 'impact_multiplier', count: '2' },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ name: 'Test Agent' }],
        })

      const stats = await recognitionService.getAgentStats(
        'agent-1',
        'workspace-1',
        4
      )

      expect(stats.agentId).toBe('agent-1')
      expect(stats.agentName).toBe('Test Agent')
      expect(stats.velocityBonusCount).toBe(5)
      expect(stats.qualityChampionCount).toBe(3)
      expect(stats.impactMultiplierCount).toBe(2)
      expect(stats.totalScore).toBe(120)
    })
  })

  describe('getWeeklyLeaderboard', () => {
    it('should rank agents by score', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            agent_id: 'agent-1',
            agent_name: 'Agent 1',
            type: 'velocity_bonus',
            count: '3',
          },
          {
            agent_id: 'agent-2',
            agent_name: 'Agent 2',
            type: 'quality_champion',
            count: '5',
          },
          {
            agent_id: 'agent-1',
            agent_name: 'Agent 1',
            type: 'impact_multiplier',
            count: '2',
          },
        ],
      })

      const leaderboard = await recognitionService.getWeeklyLeaderboard(
        'workspace-1',
        13,
        2026
      )

      expect(leaderboard.agents).toHaveLength(2)
      expect(leaderboard.agents[0].rank).toBe(1)
    })
  })

  describe('getRecentRecognitions', () => {
    it('should return recent recognitions', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'rec-1',
            agent_id: 'agent-1',
            workspace_id: 'workspace-1',
            type: 'velocity_bonus',
            description: 'Test',
            task_id: null,
            week: 13,
            year: 2026,
            created_at: new Date(),
          },
        ],
      })

      const recognitions = await recognitionService.getRecentRecognitions(
        'workspace-1',
        10
      )

      expect(recognitions).toHaveLength(1)
      expect(recognitions[0].type).toBe('velocity_bonus')
    })
  })

  describe('setConfig', () => {
    it('should update configuration', () => {
      recognitionService.setConfig({
        velocityTargetHours: 2,
        proactivityTargetPercent: 40,
      })

      expect((recognitionService as any).config.velocityTargetHours).toBe(2)
      expect((recognitionService as any).config.proactivityTargetPercent).toBe(
        40
      )
    })
  })
})

import { query } from '../../config/database.js'
import {
  Recognition,
  RecognitionType,
  AgentRecognitionStats,
  WeeklyLeaderboard,
  RecognitionConfig,
} from './types.js'

const DEFAULT_CONFIG: RecognitionConfig = {
  velocityTargetHours: 4,
  proactivityTargetPercent: 30,
  qualityTargetPercent: 90,
  velocityBonusPoints: 10,
  proactivityChampionPoints: 15,
  qualityChampionPoints: 10,
  impactMultiplierPoints: 20,
}

class RecognitionService {
  private config: RecognitionConfig = DEFAULT_CONFIG

  setConfig(config: Partial<RecognitionConfig>) {
    this.config = { ...this.config, ...config }
  }

  async trackVelocityBonus(
    agentId: string,
    workspaceId: string,
    taskId: string,
    completionTimeHours: number
  ): Promise<Recognition | null> {
    if (completionTimeHours >= this.config.velocityTargetHours) {
      return null
    }

    const savings = this.config.velocityTargetHours - completionTimeHours
    const bonusMultiplier = Math.min(1 + savings / 2, 2)
    const description = `Completed task ${savings.toFixed(1)}h ahead of target (${completionTimeHours.toFixed(1)}h actual)`

    return this.createRecognition({
      agentId,
      workspaceId,
      taskId,
      type: 'velocity_bonus',
      description,
    })
  }

  async trackProactivityChampion(
    agentId: string,
    workspaceId: string,
    proactivityPercent: number
  ): Promise<Recognition | null> {
    if (proactivityPercent < this.config.proactivityTargetPercent) {
      return null
    }

    const description = `Achieved ${proactivityPercent.toFixed(1)}% proactivity rate (target: ${this.config.proactivityTargetPercent}%)`

    return this.createRecognition({
      agentId,
      workspaceId,
      type: 'proactivity_champion',
      description,
    })
  }

  async trackQualityChampion(
    agentId: string,
    workspaceId: string,
    approvedWithoutRevise: boolean
  ): Promise<Recognition | null> {
    if (!approvedWithoutRevise) {
      return null
    }

    const description = 'Passed review without REVISE cycle'

    return this.createRecognition({
      agentId,
      workspaceId,
      type: 'quality_champion',
      description,
    })
  }

  async trackImpactMultiplier(
    agentId: string,
    workspaceId: string,
    taskId: string,
    bugFixesCount: number
  ): Promise<Recognition | null> {
    if (bugFixesCount === 0) {
      return null
    }

    const description = `Proactively fixed ${bugFixesCount} bug(s)`

    return this.createRecognition({
      agentId,
      workspaceId,
      taskId,
      type: 'impact_multiplier',
      description,
    })
  }

  async createRecognition(data: {
    agentId: string
    workspaceId: string
    type: RecognitionType
    description: string
    taskId?: string
  }): Promise<Recognition> {
    const now = new Date()
    const week = this.getWeekNumber(now)
    const year = now.getFullYear()

    const result = await query(
      `INSERT INTO recognitions 
       (agent_id, workspace_id, type, description, task_id, week, year, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [
        data.agentId,
        data.workspaceId,
        data.type,
        data.description,
        data.taskId || null,
        week,
        year,
      ]
    )

    return this.mapRow(result.rows[0])
  }

  async getAgentStats(
    agentId: string,
    workspaceId: string,
    weeks: number = 4
  ): Promise<AgentRecognitionStats> {
    const sinceWeek = this.getWeekNumber(
      new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000)
    )
    const sinceYear = new Date(
      Date.now() - weeks * 7 * 24 * 60 * 60 * 1000
    ).getFullYear()

    const result = await query(
      `SELECT 
        agent_id,
        type,
        COUNT(*) as count
       FROM recognitions
       WHERE workspace_id = $1
         AND agent_id = $2
         AND ((year > $3) OR (year = $3 AND week >= $4))
       GROUP BY agent_id, type`,
      [workspaceId, agentId, sinceYear, sinceWeek]
    )

    const stats = result.rows.reduce(
      (acc, row) => {
        switch (row.type) {
          case 'velocity_bonus':
            acc.velocityBonusCount = parseInt(row.count)
            break
          case 'proactivity_champion':
            acc.proactivityChampionWeeks = parseInt(row.count)
            break
          case 'quality_champion':
            acc.qualityChampionCount = parseInt(row.count)
            break
          case 'impact_multiplier':
            acc.impactMultiplierCount = parseInt(row.count)
            break
        }
        return acc
      },
      {
        velocityBonusCount: 0,
        proactivityChampionWeeks: 0,
        qualityChampionCount: 0,
        impactMultiplierCount: 0,
      } as Omit<AgentRecognitionStats, 'agentId' | 'agentName'>
    )

    const agentResult = await query('SELECT name FROM agents WHERE id = $1', [
      agentId,
    ])
    const agentName = agentResult.rows[0]?.name || 'Unknown Agent'

    const totalScore =
      stats.velocityBonusCount * this.config.velocityBonusPoints +
      stats.proactivityChampionWeeks * this.config.proactivityChampionPoints +
      stats.qualityChampionCount * this.config.qualityChampionPoints +
      stats.impactMultiplierCount * this.config.impactMultiplierPoints

    return {
      agentId,
      agentName,
      ...stats,
      totalScore,
    }
  }

  async getWeeklyLeaderboard(
    workspaceId: string,
    week?: number,
    year?: number
  ): Promise<WeeklyLeaderboard> {
    const now = new Date()
    const targetWeek = week || this.getWeekNumber(now)
    const targetYear = year || now.getFullYear()

    const result = await query(
      `SELECT 
        r.agent_id,
        a.name as agent_name,
        r.type,
        COUNT(*) as count
       FROM recognitions r
       JOIN agents a ON r.agent_id = a.id
       WHERE r.workspace_id = $1
         AND r.week = $2
         AND r.year = $3
       GROUP BY r.agent_id, a.name, r.type
       ORDER BY agent_id`,
      [workspaceId, targetWeek, targetYear]
    )

    const agentScores = new Map<
      string,
      { name: string; score: number; badges: RecognitionType[] }
    >()

    for (const row of result.rows) {
      if (!agentScores.has(row.agent_id)) {
        agentScores.set(row.agent_id, {
          name: row.agent_name,
          score: 0,
          badges: [],
        })
      }

      const agent = agentScores.get(row.agent_id)!
      const count = parseInt(row.count)
      let points = 0

      switch (row.type) {
        case 'velocity_bonus':
          points = count * this.config.velocityBonusPoints
          break
        case 'proactivity_champion':
          points = count * this.config.proactivityChampionPoints
          break
        case 'quality_champion':
          points = count * this.config.qualityChampionPoints
          break
        case 'impact_multiplier':
          points = count * this.config.impactMultiplierPoints
          break
      }

      agent.score += points
      agent.badges.push(row.type)
    }

    const sortedAgents = Array.from(agentScores.entries())
      .sort((a, b) => b[1].score - a[1].score)
      .map(([agentId, data], index) => ({
        rank: index + 1,
        agentId,
        agentName: data.name,
        score: data.score,
        badges: [...new Set(data.badges)],
      }))

    return {
      week: targetWeek,
      year: targetYear,
      agents: sortedAgents,
    }
  }

  async getRecentRecognitions(
    workspaceId: string,
    limit: number = 10
  ): Promise<Recognition[]> {
    const result = await query(
      `SELECT * FROM recognitions 
       WHERE workspace_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [workspaceId, limit]
    )

    return result.rows.map(row => this.mapRow(row))
  }

  async runWeeklyRecognition(workspaceId: string): Promise<{
    proactivityChampions: Recognition[]
    leaderboard: WeeklyLeaderboard
  }> {
    const now = new Date()
    const week = this.getWeekNumber(now)
    const year = now.getFullYear()
    const weekStart = this.getWeekStart(now)

    const proactivityResult = await query(
      `SELECT 
        assignee_id as agent_id,
        COUNT(*) FILTER (WHERE assignee_id IS NULL AND creator_id IS NOT NULL) * 100.0 / 
          NULLIF(COUNT(*), 0) as proactivity_rate
       FROM tasks
       WHERE workspace_id = $1
         AND created_at >= $2
         AND created_at < $3
         AND assignee_id IS NOT NULL OR assignee_id IS NULL
       GROUP BY assignee_id`,
      [
        workspaceId,
        weekStart,
        new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
      ]
    )

    const proactivityChampions: Recognition[] = []

    for (const row of proactivityResult.rows) {
      if (
        row.agent_id &&
        row.proactivity_rate >= this.config.proactivityTargetPercent
      ) {
        const recognition = await this.trackProactivityChampion(
          row.agent_id,
          workspaceId,
          parseFloat(row.proactivity_rate)
        )
        if (recognition) {
          proactivityChampions.push(recognition)
        }
      }
    }

    const leaderboard = await this.getWeeklyLeaderboard(workspaceId, week, year)

    return {
      proactivityChampions,
      leaderboard,
    }
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    )
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  private mapRow(row: any): Recognition {
    return {
      id: row.id,
      agent_id: row.agent_id,
      type: row.type,
      workspace_id: row.workspace_id,
      task_id: row.task_id,
      description: row.description,
      week: row.week,
      year: row.year,
      created_at: row.created_at,
    }
  }
}

export default new RecognitionService()

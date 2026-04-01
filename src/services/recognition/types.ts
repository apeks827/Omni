export interface Recognition {
  id: string
  agent_id: string
  type: RecognitionType
  workspace_id: string
  task_id?: string
  description: string
  week: number
  year: number
  created_at: Date
}

export type RecognitionType =
  | 'velocity_bonus'
  | 'proactivity_champion'
  | 'quality_champion'
  | 'impact_multiplier'

export interface AgentRecognitionStats {
  agentId: string
  agentName: string
  velocityBonusCount: number
  proactivityChampionWeeks: number
  qualityChampionCount: number
  impactMultiplierCount: number
  totalScore: number
}

export interface WeeklyLeaderboard {
  week: number
  year: number
  agents: Array<{
    rank: number
    agentId: string
    agentName: string
    score: number
    badges: RecognitionType[]
  }>
}

export interface RecognitionConfig {
  velocityTargetHours: number
  proactivityTargetPercent: number
  qualityTargetPercent: number
  velocityBonusPoints: number
  proactivityChampionPoints: number
  qualityChampionPoints: number
  impactMultiplierPoints: number
}

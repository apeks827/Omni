import type { TeamMemberRole } from './Team'

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: TeamMemberRole
  nickname?: string
  invited_by?: string
  joined_at: Date
  created_at: Date
  updated_at: Date
}

export interface Team {
  id: string
  workspace_id: string
  name: string
  description?: string
  settings: TeamSettings
  is_archived: boolean
  owner_id: string
  created_by: string
  created_at: Date
  updated_at: Date
}

export interface TeamSettings {
  default_role: TeamMemberRole
  allow_guest_access: boolean
  require_approval: boolean
}

export type TeamMemberRole = 'owner' | 'admin' | 'member' | 'guest'

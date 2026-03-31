export type WorkspaceMemberRole = 'owner' | 'admin' | 'member' | 'guest'

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role: WorkspaceMemberRole
  invited_by?: string
  joined_at: Date
  created_at: Date
  updated_at: Date
}

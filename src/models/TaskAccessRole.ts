export type TaskAccessRoleType = 'owner' | 'editor' | 'commenter' | 'viewer'

export interface TaskAccessRole {
  id: string
  task_id: string
  user_id: string
  role: TaskAccessRoleType
  granted_by: string
  granted_at: Date
  created_at: Date
  updated_at: Date
}

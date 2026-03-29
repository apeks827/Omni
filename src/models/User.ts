export interface User {
  id: string
  email: string
  password_hash: string
  name: string
  workspace_id: string
  timezone?: string
  preferences?: Record<string, unknown>
  created_at: Date
  updated_at: Date
}

export interface UserResponse {
  id: string
  email: string
  name: string
  workspace_id: string
  created_at: Date
  updated_at: Date
}

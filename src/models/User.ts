export interface User {
  id: string
  email: string
  password_hash: string
  name: string
  workspace_id: string
  timezone?: string
  preferences?: Record<string, unknown>
  energy_pattern?: { peak_hours: number[]; low_hours: number[] }
  low_energy_mode?: boolean
  last_activity_at?: Date
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

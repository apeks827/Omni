export interface TaskShare {
  id: string
  task_id: string
  team_id?: string
  shared_by: string
  share_mode: 'team' | 'individual'
  created_at: Date
}

export interface TaskAssignment {
  id: string
  task_id: string
  assigned_by: string
  response: 'pending' | 'accepted' | 'declined'
  delegation_note?: string
  delegated_from?: string
  responded_at?: Date
  created_at: Date
  updated_at: Date
}

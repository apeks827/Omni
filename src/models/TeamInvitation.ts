export type InvitationStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'cancelled'
  | 'expired'
export type TeamMemberRole = 'owner' | 'admin' | 'member' | 'guest'

export interface TeamInvitation {
  id: string
  team_id: string
  email: string
  role: TeamMemberRole
  invited_by: string
  token: string
  status: InvitationStatus
  personal_message?: string
  expires_at: Date
  accepted_at?: Date
  declined_at?: Date
  created_at: Date
  updated_at: Date
}

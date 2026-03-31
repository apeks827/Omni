export type ActivityEventType =
  | 'task.created'
  | 'task.updated'
  | 'task.deleted'
  | 'task.restored'
  | 'task.archived'
  | 'task.assigned'
  | 'task.completed'
  | 'task.uncompleted'
  | 'task.blocked'
  | 'task.unblocked'
  | 'task.moved'
  | 'task.merged'
  | 'task.split'
  | 'task.shared'
  | 'task.unshared'
  | 'task.delegated'
  | 'task.accepted'
  | 'task.declined'
  | 'comment.added'
  | 'comment.updated'
  | 'comment.deleted'
  | 'comment.mention'
  | 'attachment.added'
  | 'attachment.removed'
  | 'project.created'
  | 'project.updated'
  | 'project.deleted'
  | 'label.added'
  | 'label.removed'
  | 'time_entry.added'
  | 'time_entry.removed'
  | 'automation.triggered'
  | 'automation.disabled'
  | 'agent.executed'
  | 'agent.failed'
  | 'team.created'
  | 'team.updated'
  | 'team.archived'
  | 'team.member_added'
  | 'team.member_removed'
  | 'team.member_role_changed'
  | 'team.invitation_sent'
  | 'team.invitation_accepted'
  | 'team.invitation_declined'

export type EntityType =
  | 'task'
  | 'project'
  | 'comment'
  | 'attachment'
  | 'label'
  | 'time_entry'
  | 'automation'
  | 'agent_run'
  | 'team'
  | 'team_member'
  | 'team_invitation'

export type ActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'restore'
  | 'archive'
  | 'assign'
  | 'complete'
  | 'comment'
  | 'attach'
  | 'move'
  | 'merge'
  | 'split'
  | 'share'
  | 'unshare'
  | 'delegate'
  | 'accept'
  | 'decline'
  | 'invite'
  | 'join'
  | 'leave'

export type SourceType =
  | 'client'
  | 'api'
  | 'import'
  | 'webhook'
  | 'automation'
  | 'agent'

export interface FieldChange {
  field: string
  old_value: unknown
  new_value: unknown
  display_name?: string
}

export interface ActivityEvent {
  id: string
  workspace_id: string
  user_id: string
  event_type: ActivityEventType
  entity_type: EntityType
  entity_id: string
  action: ActionType
  field_changes?: FieldChange[]
  previous_value?: unknown
  new_value?: unknown
  metadata?: Record<string, unknown>
  source: SourceType
  parent_entity_type?: EntityType
  parent_entity_id?: string
  related_entity_type?: EntityType
  related_entity_id?: string
  created_at: Date
}

export interface ActivityEventWithDetails extends ActivityEvent {
  user?: {
    id: string
    name: string
    avatar_url?: string
  }
  entity?: {
    id: string
    title: string
    type: EntityType
  }
}

export interface ActivityFeedFilters {
  entity_type?: EntityType | EntityType[]
  entity_id?: string
  event_type?: ActivityEventType | ActivityEventType[]
  user_id?: string | string[]
  action?: ActionType | ActionType[]
  start_date?: Date
  end_date?: Date
  limit?: number
  cursor?: string
  include_metadata?: boolean
}

export interface ActivityFeedResponse {
  events: ActivityEventWithDetails[]
  pagination: {
    has_more: boolean
    next_cursor: string | null
    total_count: number
  }
}

export interface ActivityCursor {
  last_id: string
  last_created_at: Date
}

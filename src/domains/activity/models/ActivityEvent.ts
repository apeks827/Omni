import {
  ActivityEvent,
  ActivityEventType,
  EntityType,
  ActionType,
  SourceType,
  FieldChange,
} from '../../../../shared/types/activity.js'

export interface ActivityEventModel extends ActivityEvent {
  created_at: Date
}

export interface CreateActivityEventInput {
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
  source?: SourceType
  parent_entity_type?: EntityType
  parent_entity_id?: string
  related_entity_type?: EntityType
  related_entity_id?: string
}

export { ActivityEvent, FieldChange }

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body?: string
  read_status: boolean
  task_id?: string
  snoozed_until?: Date
  created_at: Date
  updated_at: Date
}

export type NotificationType =
  | 'task_assigned'
  | 'deadline_approaching'
  | 'task_completed'
  | 'mentioned_in_comment'

export interface NotificationPreference {
  id: string
  user_id: string
  notification_type: NotificationType
  in_app_enabled: boolean
  email_enabled: boolean
  push_enabled: boolean
  created_at: Date
  updated_at: Date
}

export interface NotificationResponse {
  id: string
  type: NotificationType
  title: string
  body?: string
  read_status: boolean
  task_id?: string
  snoozed_until?: Date
  created_at: Date
}

export interface NotificationPreferenceResponse {
  notification_type: NotificationType
  in_app_enabled: boolean
  email_enabled: boolean
  push_enabled: boolean
}

export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'missed'
  | 'todo'
  | 'done'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: 'low' | 'medium' | 'high' | 'critical'
  project_id?: string
  assignee_id?: string
  creator_id?: string
  workspace_id: string
  due_date?: Date
  duration_minutes?: number
  created_at: Date
  updated_at: Date
}

export interface ScheduleSlot {
  id: string
  task_id: string
  user_id: string
  start_time: Date
  end_time: Date
  status: 'scheduled' | 'active' | 'completed' | 'missed'
}

export interface EnergyPattern {
  peak_hours: number[]
  low_hours: number[]
}

export interface CalendarDay {
  date: Date
  slots: ScheduleSlot[]
  tasks: Task[]
}

export interface CalendarWeek {
  start_date: Date
  end_date: Date
  days: CalendarDay[]
}

export interface Project {
  id: string
  name: string
  description?: string
  ownerId: string
  createdAt: Date
  updatedAt: Date
}

export interface Label {
  id: string
  name: string
  color: string
  projectId?: string
  createdAt: Date
  updatedAt: Date
}

export interface DashboardData {
  companyId: string
  agents: {
    active: number
    running: number
    paused: number
    error: number
  }
  tasks: {
    open: number
    inProgress: number
    blocked: number
    done: number
  }
  costs: {
    monthSpendCents: number
    monthBudgetCents: number
    monthUtilizationPercent: number
  }
  pendingApprovals: number
  budgets: {
    activeIncidents: number
    pendingApprovals: number
    pausedAgents: number
    pausedProjects: number
  }
}

export type NotificationType =
  | 'task_assigned'
  | 'deadline_approaching'
  | 'task_completed'
  | 'mentioned_in_comment'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  body?: string
  read_status: boolean
  task_id?: string
  created_at: Date
}

export interface NotificationPreference {
  notification_type: NotificationType
  in_app_enabled: boolean
  email_enabled: boolean
  push_enabled: boolean
}

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'custom'

export type WeekDay = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'

export interface RecurrenceRule {
  frequency: RecurrenceFrequency
  interval?: number
  days_of_week?: WeekDay[]
  end_type: 'never' | 'count' | 'until'
  end_count?: number
  end_date?: Date
}

export interface RecurringTask extends Task {
  recurrence_rule: RecurrenceRule
  parent_task_id?: string
  is_recurring: boolean
}

export interface SearchFilters {
  status?: TaskStatus[]
  priority?: Task['priority'][]
  projectId?: string
  assigneeId?: string
  labelIds?: string[]
  dateRange?: {
    field: 'due_date' | 'created_at' | 'updated_at'
    from: string
    to: string
  }
}

export interface SearchQuery {
  query: string
  filters: SearchFilters
  sort: {
    field: 'relevance' | 'due_date' | 'created_at' | 'priority'
    direction: 'asc' | 'desc'
  }
  pagination: {
    offset: number
    limit: number
  }
}

export interface SearchResult {
  tasks: Task[]
  total: number
  suggestions: string[]
  searchId: string
}

export interface SavedSearch {
  id: string
  name: string
  queryJson: SearchQuery
  created_at: Date
  updated_at: Date
}

export interface SearchHistoryItem {
  id: string
  query: string
  resultsCount: number
  created_at: Date
}

export interface Comment {
  id: string
  task_id: string
  user_id: string
  content: string
  parent_comment_id?: string
  created_at: Date
  updated_at: Date
  deleted_at?: Date
  author: {
    id: string
    name: string
    avatar?: string
  }
  attachments?: CommentAttachment[]
  mentions?: string[]
  replies?: Comment[]
}

export interface CommentAttachment {
  id: string
  comment_id: string
  filename: string
  file_url: string
  file_size: number
  mime_type: string
  created_at: Date
}

export interface CreateCommentInput {
  task_id: string
  content: string
  parent_comment_id?: string
  attachments?: File[]
}

export interface UpdateCommentInput {
  content: string
}

export type ActivityActionType =
  | 'task_created'
  | 'task_updated'
  | 'task_completed'
  | 'task_assigned'
  | 'task_commented'
  | 'task_deleted'
  | 'status_changed'
  | 'priority_changed'

export interface ActivityChange {
  field: string
  old: any
  new: any
}

export interface Activity {
  id: string
  task_id: string
  user_id: string | null
  workspace_id: string
  action_type: ActivityActionType
  changes: ActivityChange[]
  created_at: Date
  user?: {
    id: string
    username: string
    email: string
  }
  task_title?: string
}

export interface ActivityFeedResponse {
  activities: Activity[]
  total: number
}

export interface TaskTemplate {
  id: string
  user_id: string
  workspace_id: string
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  estimated_duration?: number
  checklist?: string[]
  variables?: Record<string, string>
  created_at: Date
  updated_at: Date
}

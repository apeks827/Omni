export interface TimeEntry {
  id: string
  task_id: string
  workspace_id: string
  user_id: string
  start_time: Date
  end_time?: Date
  duration_seconds: number
  type: 'manual' | 'timer' | 'pomodoro'
  pomodoro_type?: 'work' | 'break' | 'long_break'
  description?: string
  source: 'client' | 'api' | 'import'
  created_at: Date
  updated_at: Date
}

export interface TimerState {
  id: string
  user_id: string
  task_id: string
  workspace_id: string
  status: 'running' | 'paused' | 'stopped'
  start_time: Date
  elapsed_seconds: number
  last_tick_at?: Date
  pomodoro_type: 'work' | 'break' | 'long_break'
  pomodoro_work_count: number
  created_at: Date
  updated_at: Date
}

export interface TimeEntryFilters {
  task_id?: string
  start_date?: Date
  end_date?: Date
  type?: TimeEntry['type']
  user_id?: string
  workspace_id?: string
  limit?: number
  offset?: number
}

export interface TimeEntryAnalytics {
  total_seconds: number
  total_entries: number
  breakdown: Array<{
    task_id: string
    total_seconds: number
    entry_count: number
  }>
  pomodoro_stats: {
    work_sessions: number
    break_sessions: number
    total_work_seconds: number
  }
}

export interface PomodoroSettings {
  enabled: boolean
  work_duration: number
  break_duration: number
  long_break_duration: number
  sessions_before_long_break: number
}

export interface TaskTimeTracking {
  total_time_tracked: number
  pomodoro_settings?: PomodoroSettings
}

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

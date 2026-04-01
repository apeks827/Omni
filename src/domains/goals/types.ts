export interface Goal {
  id: string
  title: string
  description?: string
  status: 'draft' | 'active' | 'completed' | 'archived' | 'cancelled'
  timeframe_type: 'quarter' | 'year' | 'custom'
  start_date: string
  end_date: string
  progress_percentage: number
  created_at: Date
  updated_at: Date
}

export interface GoalWithKeyResults extends Goal {
  key_results: KeyResult[]
}

export interface KeyResult {
  id: string
  goal_id: string
  title: string
  target_value: number
  current_value: number
  measurement_type: 'numeric' | 'percentage' | 'boolean'
  unit?: string
  progress_percentage: number
  created_at: Date
  updated_at: Date
}

export interface CreateGoalData {
  title: string
  description?: string
  status?: string
  timeframe_type?: string
  start_date: string
  end_date: string
}

export interface UpdateGoalData {
  title?: string
  description?: string | null
  status?: string
  timeframe_type?: string
  start_date?: string
  end_date?: string
  progress_percentage?: number
}

export interface CreateKeyResultData {
  title: string
  target_value: number
  current_value?: number
  measurement_type?: string
  unit?: string
}

export interface UpdateKeyResultData {
  title?: string
  target_value?: number
  current_value?: number
  measurement_type?: string
  unit?: string | null
  progress_percentage?: number
}

export interface TaskGoalLink {
  task_id: string
  goal_id: string
  key_result_id?: string
  created_at: Date
  goal_title?: string
  goal_status?: string
  key_result_title?: string
  kr_progress?: number
}

export interface CreateTaskGoalLinkData {
  goal_id: string
  key_result_id?: string
}

export interface LinkedTask {
  id: string
  title: string
  status: string
  key_result_id?: string
  key_result_title?: string
}

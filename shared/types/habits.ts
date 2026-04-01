export type FrequencyType = 'daily' | 'weekly' | 'custom'
export type EnergyLevel = 'low' | 'medium' | 'high'
export type TimeWindow = 'morning' | 'afternoon' | 'evening'

export interface Habit {
  id: string
  user_id: string
  name: string
  description?: string
  frequency_type: FrequencyType
  frequency_value?: string
  preferred_time_start?: string
  preferred_time_end?: string
  duration_minutes: number
  energy_level?: EnergyLevel
  current_streak: number
  best_streak: number
  created_at: Date
  updated_at: Date
}

export interface HabitCompletion {
  id: string
  habit_id: string
  completed_at: Date
  skipped: boolean
  note?: string
}

export interface Routine {
  id: string
  user_id: string
  name: string
  time_window?: TimeWindow
  created_at: Date
  updated_at: Date
  steps?: RoutineStep[]
}

export interface RoutineStep {
  id: string
  routine_id: string
  order_index: number
  name: string
  duration_minutes: number
  created_at: Date
}

export interface RoutineCompletion {
  id: string
  routine_id: string
  scheduled_date: Date
  completed_steps: number
  total_steps: number
  completed_at?: Date
  created_at: Date
}

export interface CreateHabitInput {
  name: string
  description?: string
  frequency_type: FrequencyType
  frequency_value?: string
  preferred_time_start?: string
  preferred_time_end?: string
  duration_minutes: number
  energy_level?: EnergyLevel
}

export interface UpdateHabitInput {
  name?: string
  description?: string
  frequency_type?: FrequencyType
  frequency_value?: string
  preferred_time_start?: string
  preferred_time_end?: string
  duration_minutes?: number
  energy_level?: EnergyLevel
}

export interface CreateRoutineInput {
  name: string
  time_window?: TimeWindow
  steps: Array<{
    name: string
    duration_minutes: number
  }>
}

export interface UpdateRoutineInput {
  name?: string
  time_window?: TimeWindow
  steps?: Array<{
    id?: string
    name: string
    duration_minutes: number
    order_index: number
  }>
}

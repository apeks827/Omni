export interface Task {
  id: string
  title: string
  description?: string
  type: 'task' | 'habit' | 'routine'
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  context?: Record<string, unknown>
  project_id?: string
  assignee_id?: string
  creator_id: string
  workspace_id: string
  due_date?: Date
  estimated_duration?: number
  actual_duration?: number
  completed_at?: Date
  created_at: Date
  updated_at: Date
}

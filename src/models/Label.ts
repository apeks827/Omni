export interface Label {
  id: string
  name: string
  color?: string
  workspace_id: string
  created_at: Date
  updated_at: Date
}

export interface TaskLabel {
  task_id: string
  label_id: string
  created_at: Date
}

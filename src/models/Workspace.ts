export interface Workspace {
  id: string
  name: string
  owner_id: string
  settings: Record<string, any>
  created_at: Date
  updated_at: Date
}

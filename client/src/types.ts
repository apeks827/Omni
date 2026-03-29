export interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'done'
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

import taskActivityRepository, {
  TaskActivity,
  ActivityFilters,
} from '../repositories/TaskActivityRepository.js'

export interface Activity {
  id: string
  task_id: string
  user_id: string | null
  workspace_id: string
  action_type: string
  changes: any[]
  created_at: Date
  user?: {
    id: string
    username: string
    email: string
  }
  task_title?: string
}

export interface ActivityListResult {
  activities: Activity[]
  total: number
}

class TaskActivityService {
  private formatActivityRow(row: TaskActivity): Activity {
    return {
      id: row.id,
      task_id: row.task_id,
      user_id: row.user_id,
      workspace_id: row.workspace_id,
      action_type: row.action_type,
      changes:
        typeof row.changes === 'string'
          ? JSON.parse(row.changes)
          : row.changes || [],
      created_at: row.created_at,
      user: row.user_id
        ? {
            id: row.user_id,
            username: row.username || 'Unknown',
            email: row.email || '',
          }
        : undefined,
      task_title: row.task_title,
    }
  }

  async getWorkspaceActivities(
    workspaceId: string,
    limit: number = 100,
    offset: number = 0,
    actionType?: string
  ): Promise<ActivityListResult> {
    const filters: ActivityFilters = {}
    if (actionType) {
      filters.action_type = actionType
    }

    const result = await taskActivityRepository.findByWorkspace(
      workspaceId,
      filters,
      limit,
      offset
    )

    return {
      activities: result.data.map(row => this.formatActivityRow(row)),
      total: result.total,
    }
  }

  async getTaskActivities(
    taskId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ActivityListResult> {
    const result = await taskActivityRepository.findByTask(
      taskId,
      limit,
      offset
    )

    return {
      activities: result.data.map(row => this.formatActivityRow(row)),
      total: result.total,
    }
  }

  async getUserActivities(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ActivityListResult> {
    const result = await taskActivityRepository.findByUser(
      userId,
      limit,
      offset
    )

    return {
      activities: result.data.map(row => this.formatActivityRow(row)),
      total: result.total,
    }
  }
}

export default new TaskActivityService()

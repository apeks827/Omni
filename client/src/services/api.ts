import { Task, DashboardData } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

class ApiClient {
  private getAuthToken(): string | null {
    return localStorage.getItem('authToken')
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: 'Request failed' }))
      throw new Error(
        error.message || `HTTP ${response.status}: ${response.statusText}`
      )
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return undefined as T
    }

    return response.json()
  }

  async getTasks(params?: {
    limit?: number
    offset?: number
    status?: string
    priority?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<{ tasks: Task[]; total: number }> {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.set('limit', params.limit.toString())
    if (params?.offset) queryParams.set('offset', params.offset.toString())
    if (params?.status) queryParams.set('status', params.status)
    if (params?.priority) queryParams.set('priority', params.priority)
    if (params?.sortBy) queryParams.set('sort_by', params.sortBy)
    if (params?.sortOrder) queryParams.set('sort_order', params.sortOrder)

    const query = queryParams.toString()
    return this.request<{ tasks: Task[]; total: number }>(
      `/tasks${query ? `?${query}` : ''}`
    )
  }

  async createTask(
    task: Omit<
      Task,
      'id' | 'created_at' | 'updated_at' | 'workspace_id' | 'creator_id'
    >
  ): Promise<Task> {
    return this.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    })
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    return this.request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async deleteTask(id: string): Promise<void> {
    return this.request<void>(`/tasks/${id}`, {
      method: 'DELETE',
    })
  }

  async getDashboard(companyId: string): Promise<DashboardData> {
    return this.request<DashboardData>(`/companies/${companyId}/dashboard`)
  }

  async getCalendarDay(date: string): Promise<any> {
    return this.request<any>(`/calendar/day?date=${date}`)
  }

  async getCalendarWeek(startDate: string): Promise<any> {
    return this.request<any>(`/calendar/week?start_date=${startDate}`)
  }

  async rescheduleSlot(
    slotId: string,
    startTime: Date,
    endTime: Date
  ): Promise<any> {
    return this.request<any>(`/calendar/slots/${slotId}`, {
      method: 'PATCH',
      body: JSON.stringify({ start_time: startTime, end_time: endTime }),
    })
  }

  async toggleLowEnergyMode(enabled: boolean): Promise<void> {
    return this.request<void>('/users/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ low_energy_mode: enabled }),
    })
  }

  async bulkUpdateTasks(
    taskIds: string[],
    updates: Partial<Task>
  ): Promise<Task[]> {
    return this.request<Task[]>('/tasks/bulk', {
      method: 'PATCH',
      body: JSON.stringify({ task_ids: taskIds, updates }),
    })
  }

  async bulkDeleteTasks(taskIds: string[]): Promise<void> {
    return this.request<void>('/tasks/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ task_ids: taskIds }),
    })
  }

  async getTaskActivities(
    taskId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<import('../types').ActivityFeedResponse> {
    return this.request<import('../types').ActivityFeedResponse>(
      `/tasks/${taskId}/activities?limit=${limit}&offset=${offset}`
    )
  }

  async getWorkspaceActivities(
    workspaceId: string,
    limit: number = 100,
    offset: number = 0,
    actionType?: string
  ): Promise<import('../types').ActivityFeedResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    })
    if (actionType) {
      params.set('action_type', actionType)
    }
    return this.request<import('../types').ActivityFeedResponse>(
      `/workspaces/${workspaceId}/activities?${params}`
    )
  }

  async getUserActivities(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<import('../types').ActivityFeedResponse> {
    return this.request<import('../types').ActivityFeedResponse>(
      `/users/${userId}/activities?limit=${limit}&offset=${offset}`
    )
  }

  async getAnalytics(timeRange: 'week' | 'month' | 'all'): Promise<any> {
    const now = new Date()
    let startDate: Date

    if (timeRange === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (timeRange === 'month') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    } else {
      startDate = new Date(0)
    }

    return this.request<any>(
      `/analytics/analytics?start_date=${startDate.toISOString()}&end_date=${now.toISOString()}`
    )
  }

  async getGoals(status?: string): Promise<any[]> {
    const query = status ? `?status=${status}` : ''
    return this.request<any[]>(`/goals${query}`)
  }

  async getGoal(id: string): Promise<any> {
    return this.request<any>(`/goals/${id}`)
  }

  async createGoal(goal: {
    title: string
    description?: string
    status?: string
    timeframe_type?: string
    start_date: string
    end_date: string
  }): Promise<any> {
    return this.request<any>('/goals', {
      method: 'POST',
      body: JSON.stringify(goal),
    })
  }

  async updateGoal(id: string, updates: Partial<any>): Promise<any> {
    return this.request<any>(`/goals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  async deleteGoal(id: string): Promise<void> {
    return this.request<void>(`/goals/${id}`, {
      method: 'DELETE',
    })
  }

  async getKeyResults(goalId: string): Promise<any[]> {
    return this.request<any[]>(`/goals/${goalId}/key-results`)
  }

  async createKeyResult(
    goalId: string,
    kr: {
      title: string
      target_value: number
      current_value?: number
      measurement_type?: string
      unit?: string
    }
  ): Promise<any> {
    return this.request<any>(`/goals/${goalId}/key-results`, {
      method: 'POST',
      body: JSON.stringify(kr),
    })
  }

  async updateKeyResult(id: string, updates: Partial<any>): Promise<any> {
    return this.request<any>(`/key-results/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  async updateKeyResultProgress(
    id: string,
    current_value: number
  ): Promise<any> {
    return this.request<any>(`/key-results/${id}/progress`, {
      method: 'PATCH',
      body: JSON.stringify({ current_value }),
    })
  }

  async deleteKeyResult(id: string): Promise<void> {
    return this.request<void>(`/key-results/${id}`, {
      method: 'DELETE',
    })
  }

  async linkTaskToGoal(
    taskId: string,
    goal_id: string,
    key_result_id?: string
  ): Promise<any> {
    return this.request<any>(`/tasks/${taskId}/link-goal`, {
      method: 'POST',
      body: JSON.stringify({ goal_id, key_result_id }),
    })
  }

  async unlinkTaskFromGoal(taskId: string, goal_id: string): Promise<void> {
    return this.request<void>(`/tasks/${taskId}/link-goal?goal_id=${goal_id}`, {
      method: 'DELETE',
    })
  }

  async getTaskGoals(taskId: string): Promise<any[]> {
    return this.request<any[]>(`/tasks/${taskId}/goals`)
  }

  async getGoalTasks(goalId: string): Promise<any[]> {
    return this.request<any[]>(`/goals/${goalId}/tasks`)
  }

  setAuthToken(token: string): void {
    localStorage.setItem('authToken', token)
  }

  clearAuthToken(): void {
    localStorage.removeItem('authToken')
  }
}

export const apiClient = new ApiClient()

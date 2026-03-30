import {
  TimeEntry,
  TimerState,
  TimeEntryFilters,
  TimeEntryAnalytics,
} from '../../../shared/types/time-tracking'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

class TimeTrackingApi {
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

    if (response.status === 204) {
      return undefined as T
    }

    return response.json()
  }

  async startTimer(taskId: string, description?: string): Promise<TimerState> {
    return this.request<TimerState>('/timers/start', {
      method: 'POST',
      body: JSON.stringify({ taskId, description }),
    })
  }

  async stopTimer(
    timerId: string,
    description?: string
  ): Promise<{ timer: TimerState; timeEntry: TimeEntry }> {
    return this.request('/timers/stop', {
      method: 'POST',
      body: JSON.stringify({ timerId, description }),
    })
  }

  async pauseTimer(timerId: string): Promise<TimerState> {
    return this.request<TimerState>('/timers/pause', {
      method: 'POST',
      body: JSON.stringify({ timerId }),
    })
  }

  async resumeTimer(timerId: string): Promise<TimerState> {
    return this.request<TimerState>('/timers/resume', {
      method: 'POST',
      body: JSON.stringify({ timerId }),
    })
  }

  async getCurrentTimer(): Promise<TimerState | null> {
    return this.request<TimerState | null>('/timers/current')
  }

  async createTimeEntry(
    entry: Omit<TimeEntry, 'id' | 'created_at' | 'updated_at'>
  ): Promise<TimeEntry> {
    return this.request<TimeEntry>('/time-entries', {
      method: 'POST',
      body: JSON.stringify(entry),
    })
  }

  async updateTimeEntry(
    id: string,
    updates: Partial<TimeEntry>
  ): Promise<TimeEntry> {
    return this.request<TimeEntry>(`/time-entries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  async deleteTimeEntry(id: string): Promise<void> {
    return this.request<void>(`/time-entries/${id}`, {
      method: 'DELETE',
    })
  }

  async getTaskTimeEntries(
    taskId: string,
    filters?: TimeEntryFilters
  ): Promise<{ entries: TimeEntry[]; total: number }> {
    const params = new URLSearchParams()
    if (filters?.start_date)
      params.append('startDate', filters.start_date.toISOString())
    if (filters?.end_date)
      params.append('endDate', filters.end_date.toISOString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    return this.request<{ entries: TimeEntry[]; total: number }>(
      `/tasks/${taskId}/time-entries?${params}`
    )
  }

  async getUserTimeEntries(
    userId: string,
    filters?: TimeEntryFilters
  ): Promise<{ entries: TimeEntry[]; total: number }> {
    const params = new URLSearchParams()
    if (filters?.start_date)
      params.append('startDate', filters.start_date.toISOString())
    if (filters?.end_date)
      params.append('endDate', filters.end_date.toISOString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

    return this.request<{ entries: TimeEntry[]; total: number }>(
      `/users/${userId}/time-entries?${params}`
    )
  }

  async getTaskAnalytics(
    taskId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<TimeEntryAnalytics> {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate.toISOString())
    if (endDate) params.append('endDate', endDate.toISOString())

    return this.request<TimeEntryAnalytics>(
      `/analytics/task/${taskId}/summary?${params}`
    )
  }

  async exportTimeData(
    format: 'csv' | 'json',
    filters?: TimeEntryFilters
  ): Promise<Blob> {
    const params = new URLSearchParams()
    params.append('format', format)
    if (filters?.start_date)
      params.append('startDate', filters.start_date.toISOString())
    if (filters?.end_date)
      params.append('endDate', filters.end_date.toISOString())

    const response = await fetch(
      `${API_BASE_URL}/time-entries/export?${params}`,
      {
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Export failed')
    }

    return response.blob()
  }
}

export default new TimeTrackingApi()

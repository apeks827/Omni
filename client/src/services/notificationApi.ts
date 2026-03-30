import { Notification, NotificationPreference } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

interface UnreadCountResponse {
  count: number
}

interface MarkReadResponse {
  success: boolean
}

interface UpdatePreferencesResponse {
  success: boolean
}

class NotificationApiClient {
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

  async getNotifications(limit = 50, offset = 0): Promise<Notification[]> {
    return this.request<Notification[]>(
      `/notifications?limit=${limit}&offset=${offset}`
    )
  }

  async getUnreadCount(): Promise<number> {
    const response = await this.request<UnreadCountResponse>(
      '/notifications/unread-count'
    )
    return response.count
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    const response = await this.request<MarkReadResponse>(
      `/notifications/${notificationId}/read`,
      { method: 'PATCH' }
    )
    return response.success
  }

  async markAllAsRead(): Promise<number> {
    const response = await this.request<{ count: number }>(
      '/notifications/mark-all-read',
      { method: 'POST' }
    )
    return response.count
  }

  async getPreferences(): Promise<NotificationPreference[]> {
    return this.request<NotificationPreference[]>('/notifications/preferences')
  }

  async updatePreferences(
    updates: Partial<NotificationPreference>[]
  ): Promise<void> {
    await this.request<UpdatePreferencesResponse>(
      '/notifications/preferences',
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      }
    )
  }
}

export const notificationApi = new NotificationApiClient()

import { Task } from '../types'

const API_BASE_URL = 'http://localhost:3000/api'

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

  async getTasks(): Promise<Task[]> {
    return this.request<Task[]>('/tasks')
  }

  async createTask(
    task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'workspace_id' | 'creator_id'>
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

  setAuthToken(token: string): void {
    localStorage.setItem('authToken', token)
  }

  clearAuthToken(): void {
    localStorage.removeItem('authToken')
  }
}

export const apiClient = new ApiClient()

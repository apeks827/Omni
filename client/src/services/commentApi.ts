import { Comment, CommentAttachment } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

class CommentApi {
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

  async getComments(taskId: string): Promise<Comment[]> {
    return this.request<Comment[]>(`/tasks/${taskId}/comments`)
  }

  async createComment(
    taskId: string,
    content: string,
    parentCommentId?: string,
    attachments?: File[]
  ): Promise<Comment> {
    const formData = new FormData()
    formData.append('task_id', taskId)
    formData.append('content', content)
    if (parentCommentId) {
      formData.append('parent_comment_id', parentCommentId)
    }
    if (attachments) {
      attachments.forEach(file => {
        formData.append('attachments', file)
      })
    }

    const token = this.getAuthToken()
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/comments`, {
      method: 'POST',
      body: formData,
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

    return response.json()
  }

  async updateComment(commentId: string, content: string): Promise<Comment> {
    return this.request<Comment>(`/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    })
  }

  async deleteComment(commentId: string): Promise<void> {
    return this.request<void>(`/comments/${commentId}`, {
      method: 'DELETE',
    })
  }

  async uploadAttachment(
    commentId: string,
    file: File
  ): Promise<CommentAttachment> {
    const formData = new FormData()
    formData.append('file', file)

    const token = this.getAuthToken()
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(
      `${API_BASE_URL}/comments/${commentId}/attachments`,
      {
        method: 'POST',
        body: formData,
        headers,
      }
    )

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: 'Request failed' }))
      throw new Error(
        error.message || `HTTP ${response.status}: ${response.statusText}`
      )
    }

    return response.json()
  }
}

export const commentApi = new CommentApi()
export default commentApi

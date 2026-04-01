/**
 * Feedback API Contract
 * Based on Support Engineer requirements from OMN-9
 */

export interface FeedbackSubmission {
  /** Required: Feedback category */
  category: 'bug' | 'confusion' | 'feature_request'
  /** Required: User description of the feedback */
  description: string
  /** Optional: Steps to reproduce (for bugs) */
  reproSteps?: string
  /** Optional: Screenshot/file attachment */
  screenshot?: File | null
  /** Auto-captured: Current page/surface */
  page: string
  /** Auto-captured: Session identifier */
  sessionId: string
  /** Auto-captured: App version */
  appVersion: string
  /** Auto-captured: Timestamp */
  timestamp: string
  /** Optional: User contact permission */
  contactPermission?: boolean
  /** Optional: Severity (low/medium/high) */
  severity?: 'low' | 'medium' | 'high'
  /** Optional: Environment hints */
  environment?: {
    device?: string
    browser?: string
    os?: string
  }
}

export interface FeedbackResponse {
  success: boolean
  message: string
  feedbackId?: string
  errors?: Record<string, string[]>
}

/**
 * API Client for Feedback Endpoint
 * TODO: Implement when /api/feedback endpoint is available
 */
export class FeedbackApiClient {
  private static instance: FeedbackApiClient
  private baseUrl: string

  private constructor() {
    // @ts-ignore - Vite env
    this.baseUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}`
  }

  public static getInstance(): FeedbackApiClient {
    if (!FeedbackApiClient.instance) {
      FeedbackApiClient.instance = new FeedbackApiClient()
    }
    return FeedbackApiClient.instance
  }

  /**
   * Submit feedback to the backend
   */
  async submitFeedback(
    feedback: FeedbackSubmission
  ): Promise<FeedbackResponse> {
    const formData = new FormData()

    // Add text fields (backend expects snake_case)
    formData.append('category', feedback.category)
    formData.append('description', feedback.description)
    if (feedback.reproSteps) formData.append('repro_steps', feedback.reproSteps)
    if (feedback.contactPermission !== undefined) {
      formData.append('contact_permission', String(feedback.contactPermission))
    }
    if (feedback.severity) formData.append('severity', feedback.severity)

    // Add auto-captured fields (backend expects snake_case)
    formData.append('page', feedback.page)
    formData.append('session_id', feedback.sessionId)
    formData.append('app_version', feedback.appVersion)

    // Add environment hints if provided
    if (feedback.environment) {
      Object.entries(feedback.environment).forEach(([key, value]) => {
        if (value) formData.append(`environment[${key}]`, value)
      })
    }

    // Add screenshot if provided
    if (feedback.screenshot) {
      formData.append('screenshot', feedback.screenshot)
    }

    const response = await fetch(`${this.baseUrl}/feedback`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        message: errorData.message || 'Submission failed',
        errors: errorData.errors,
      }
    }

    return response.json()
  }
}

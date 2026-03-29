import React, { useState } from 'react'
import { apiClient } from '../services/api'
import { FeedbackApiClient, FeedbackSubmission } from '../services/feedbackApi'
import Button from '../design-system/components/Button'
import Input from '../design-system/components/Input'
import Modal from '../design-system/components/Modal'
import { colors } from '../design-system/tokens'

interface FeedbackWidgetProps {
  isOpen?: boolean
  onClose?: () => void
  page: string
  sessionId: string
  appVersion: string
}

interface FeedbackFormState extends Omit<
  FeedbackSubmission,
  'page' | 'sessionId' | 'appVersion' | 'timestamp'
> {
  page: string
  sessionId: string
  appVersion: string
  timestamp: string
}

const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({
  isOpen = false,
  onClose = () => {},
  page,
  sessionId,
  appVersion,
}) => {
  const [form, setForm] = useState<FeedbackFormState>({
    category: 'bug',
    description: '',
    reproSteps: '',
    contactPermission: false,
    page,
    sessionId,
    appVersion,
    timestamp: new Date().toISOString(),
  })

  const [loading, setLoading] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error' | null
  >(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleChange = (
    field: keyof FeedbackFormState,
    value: string | boolean
  ) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrorMessage(null)
    setSubmitStatus(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      // Store file reference separately as FormData will handle it
      setForm(prev => ({ ...prev, screenshot: files[0] }))
    } else {
      setForm(prev => ({ ...prev, screenshot: null }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)

    try {
      // Remove screenshot from form state for API client (handled separately in FormData)
      const { screenshot, ...feedbackData } = form

      const feedbackApi = FeedbackApiClient.getInstance()
      const response = await feedbackApi.submitFeedback({
        ...feedbackData,
        screenshot: screenshot as File | undefined,
      })

      if (response.success) {
        setSubmitStatus('success')
        // Reset form after successful submission
        setForm(prev => ({
          ...prev,
          description: '',
          reproSteps: '',
          contactPermission: false,
          screenshot: null,
          timestamp: new Date().toISOString(),
        }))
      } else {
        setSubmitStatus('error')
        setErrorMessage(response.message || 'Submission failed')
      }
    } catch (err) {
      setSubmitStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={true} onClose={onClose} title="Submit Feedback">
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        <div>
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={form.category}
            onChange={e =>
              handleChange(
                'category',
                e.target.value as 'bug' | 'confusion' | 'feature_request'
              )
            }
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            <option value="bug">Bug Report</option>
            <option value="confusion">Confusion / Question</option>
            <option value="feature_request">Feature Request</option>
          </select>
        </div>

        <div>
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            value={form.description}
            onChange={e => handleChange('description', e.target.value)}
            placeholder="Please describe your feedback in detail..."
            rows={4}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              resize: 'vertical',
            }}
          />
          {!form.description && submitStatus === 'error' && (
            <p
              style={{
                color: colors.danger,
                fontSize: '12px',
                marginTop: '4px',
              }}
            >
              Description is required
            </p>
          )}
        </div>

        <div>
          <label htmlFor="reproSteps">Reproduction Steps (optional)</label>
          <textarea
            id="reproSteps"
            value={form.reproSteps}
            onChange={e => handleChange('reproSteps', e.target.value)}
            placeholder="Steps to reproduce the issue (if applicable)..."
            rows={3}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              resize: 'vertical',
            }}
          />
        </div>

        <div>
          <label htmlFor="screenshot">Screenshot (optional)</label>
          <input
            id="screenshot"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          />
          <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Supported formats: JPG, PNG, GIF (max 5MB)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            id="contactPermission"
            type="checkbox"
            checked={form.contactPermission}
            onChange={e => handleChange('contactPermission', e.target.checked)}
          />
          <label htmlFor="contactPermission">
            May we contact you for follow-up?
          </label>
        </div>

        {loading && (
          <p style={{ textAlign: 'center', color: colors.primary }}>
            Submitting feedback...
          </p>
        )}

        {submitStatus === 'success' && (
          <div
            style={{
              textAlign: 'center',
              padding: '16px',
              backgroundColor: '#d4edda',
              borderRadius: '4px',
            }}
          >
            <p style={{ margin: 0, color: colors.success }}>
              Thank you! Your feedback has been submitted.
            </p>
          </div>
        )}

        {submitStatus === 'error' && errorMessage && (
          <div
            style={{
              textAlign: 'center',
              padding: '12px',
              backgroundColor: '#f8d7da',
              borderRadius: '4px',
            }}
          >
            <p style={{ margin: 0, color: colors.danger }}>{errorMessage}</p>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            marginTop: '24px',
          }}
        >
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={loading}
            disabled={!form.description || loading}
          >
            {submitStatus === 'success' ? 'Submitted!' : 'Submit Feedback'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default FeedbackWidget

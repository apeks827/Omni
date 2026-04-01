import React, { useState, useEffect } from 'react'
import {
  colors,
  spacing,
  typography,
  borderRadius,
} from '../design-system/tokens'
import { notificationApi } from '../services/notificationApi'
import { NotificationPreference } from '../types'
import Button from '../design-system/components/Button/Button'

const NotificationPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      setLoading(true)
      const data = await notificationApi.getPreferences()
      setPreferences(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load preferences'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (
    notificationType: string,
    field: 'in_app_enabled' | 'email_enabled' | 'push_enabled'
  ) => {
    setPreferences(prev =>
      prev.map(pref =>
        pref.notification_type === notificationType
          ? { ...pref, [field]: !pref[field] }
          : pref
      )
    )
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)
      await notificationApi.updatePreferences(preferences)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save preferences'
      )
    } finally {
      setSaving(false)
    }
  }

  const containerStyles: React.CSSProperties = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: spacing.xl,
  }

  const headerStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray900,
    marginBottom: spacing.lg,
  }

  const descriptionStyles: React.CSSProperties = {
    fontSize: typography.fontSize.md,
    color: colors.gray600,
    marginBottom: spacing.xl,
  }

  const tableStyles: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: spacing.xl,
  }

  const thStyles: React.CSSProperties = {
    textAlign: 'left',
    padding: spacing.md,
    borderBottom: `2px solid ${colors.border.default}`,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray700,
  }

  const tdStyles: React.CSSProperties = {
    padding: spacing.md,
    borderBottom: `1px solid ${colors.border.subtle}`,
  }

  const checkboxStyles: React.CSSProperties = {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  }

  const buttonContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing.md,
    alignItems: 'center',
  }

  const messageStyles: React.CSSProperties = {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  }

  const getNotificationLabel = (type: string): string => {
    const labels: Record<string, string> = {
      task_assigned: 'Task Assigned',
      deadline_approaching: 'Deadline Approaching',
      task_completed: 'Task Completed',
      mentioned_in_comment: 'Mentioned in Comment',
    }
    return labels[type] || type
  }

  if (loading) {
    return <div style={containerStyles}>Loading preferences...</div>
  }

  return (
    <div style={containerStyles}>
      <h1 style={headerStyles}>Notification Preferences</h1>
      <p style={descriptionStyles}>
        Manage how you receive notifications for different events.
      </p>

      {error && (
        <div
          style={{
            ...messageStyles,
            backgroundColor: colors.danger,
            color: colors.white,
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            ...messageStyles,
            backgroundColor: colors.success,
            color: colors.white,
          }}
        >
          Preferences saved successfully!
        </div>
      )}

      <table style={tableStyles}>
        <thead>
          <tr>
            <th style={thStyles}>Notification Type</th>
            <th style={{ ...thStyles, textAlign: 'center' }}>In-App</th>
            <th style={{ ...thStyles, textAlign: 'center' }}>Email</th>
            <th style={{ ...thStyles, textAlign: 'center' }}>Push</th>
          </tr>
        </thead>
        <tbody>
          {preferences.map(pref => (
            <tr key={pref.notification_type}>
              <td style={tdStyles}>
                {getNotificationLabel(pref.notification_type)}
              </td>
              <td style={{ ...tdStyles, textAlign: 'center' }}>
                <input
                  type="checkbox"
                  style={checkboxStyles}
                  checked={pref.in_app_enabled}
                  onChange={() =>
                    handleToggle(pref.notification_type, 'in_app_enabled')
                  }
                />
              </td>
              <td style={{ ...tdStyles, textAlign: 'center' }}>
                <input
                  type="checkbox"
                  style={checkboxStyles}
                  checked={pref.email_enabled}
                  onChange={() =>
                    handleToggle(pref.notification_type, 'email_enabled')
                  }
                />
              </td>
              <td style={{ ...tdStyles, textAlign: 'center' }}>
                <input
                  type="checkbox"
                  style={checkboxStyles}
                  checked={pref.push_enabled}
                  onChange={() =>
                    handleToggle(pref.notification_type, 'push_enabled')
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={buttonContainerStyles}>
        <Button onClick={handleSave} isLoading={saving} disabled={saving}>
          Save Preferences
        </Button>
        <Button variant="outline" onClick={loadPreferences} disabled={saving}>
          Reset
        </Button>
      </div>
    </div>
  )
}

export default NotificationPreferences

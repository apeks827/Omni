import React, { useState } from 'react'
import { useTemplateStore } from '../../stores/templateStore'
import { TaskTemplate } from '../../types'
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from '../../design-system/tokens'

interface TemplateApplyModalProps {
  template: TaskTemplate
  onClose: () => void
}

const TemplateApplyModal: React.FC<TemplateApplyModalProps> = ({
  template,
  onClose,
}) => {
  const { instantiateTemplate, isLoading } = useTemplateStore()
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [projectId, setProjectId] = useState('')

  const templateVars = template.variables || {}
  const varKeys = Object.keys(templateVars)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await instantiateTemplate(template.id, variables, projectId || undefined)
      onClose()
    } catch (error) {
      console.error('Failed to create task from template:', error)
    }
  }

  const previewTitle = substituteVariables(template.title, variables)
  const previewDescription = template.description
    ? substituteVariables(template.description, variables)
    : ''

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.xl,
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: spacing.lg,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.lg,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
            }}
          >
            Create Task from Template
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '24px',
              color: colors.text.secondary,
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {varKeys.length > 0 && (
            <div style={{ marginBottom: spacing.lg }}>
              <h3
                style={{
                  fontSize: typography.fontSize.md,
                  fontWeight: typography.fontWeight.semibold,
                  marginBottom: spacing.md,
                }}
              >
                Fill in Variables
              </h3>
              {varKeys.map(key => (
                <div key={key} style={{ marginBottom: spacing.md }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: spacing.xs,
                      fontWeight: typography.fontWeight.medium,
                    }}
                  >
                    {key}
                  </label>
                  <input
                    type="text"
                    value={variables[key] || templateVars[key] || ''}
                    onChange={e =>
                      setVariables({ ...variables, [key]: e.target.value })
                    }
                    placeholder={templateVars[key] || `Enter ${key}...`}
                    style={{
                      width: '100%',
                      padding: spacing.md,
                      fontSize: typography.fontSize.md,
                      border: `1px solid ${colors.border.default}`,
                      borderRadius: borderRadius.lg,
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          <div style={{ marginBottom: spacing.lg }}>
            <label
              style={{
                display: 'block',
                marginBottom: spacing.xs,
                fontWeight: typography.fontWeight.medium,
              }}
            >
              Project (optional)
            </label>
            <input
              type="text"
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              placeholder="Project ID"
              style={{
                width: '100%',
                padding: spacing.md,
                fontSize: typography.fontSize.md,
                border: `1px solid ${colors.border.default}`,
                borderRadius: borderRadius.lg,
              }}
            />
          </div>

          <div
            style={{
              padding: spacing.md,
              backgroundColor: colors.bg.subtle,
              borderRadius: borderRadius.lg,
              marginBottom: spacing.lg,
            }}
          >
            <h3
              style={{
                fontSize: typography.fontSize.md,
                fontWeight: typography.fontWeight.semibold,
                marginBottom: spacing.sm,
              }}
            >
              Preview
            </h3>
            <div style={{ marginBottom: spacing.sm }}>
              <strong>Title:</strong> {previewTitle}
            </div>
            {previewDescription && (
              <div style={{ marginBottom: spacing.sm }}>
                <strong>Description:</strong> {previewDescription}
              </div>
            )}
            {template.priority && (
              <div style={{ marginBottom: spacing.sm }}>
                <strong>Priority:</strong> {template.priority}
              </div>
            )}
            {template.estimated_duration && (
              <div style={{ marginBottom: spacing.sm }}>
                <strong>Duration:</strong> {template.estimated_duration} minutes
              </div>
            )}
            {template.checklist && template.checklist.length > 0 && (
              <div>
                <strong>Checklist:</strong>
                <ul style={{ marginTop: spacing.xs, paddingLeft: spacing.lg }}>
                  {template.checklist.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              gap: spacing.md,
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: `${spacing.md} ${spacing.lg}`,
                backgroundColor: colors.bg.subtle,
                border: 'none',
                borderRadius: borderRadius.lg,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: `${spacing.md} ${spacing.lg}`,
                backgroundColor: colors.primary,
                color: colors.white,
                border: 'none',
                borderRadius: borderRadius.lg,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              {isLoading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function substituteVariables(
  text: string,
  variables: Record<string, string>
): string {
  let result = text
  const now = new Date()
  const builtInVars: Record<string, string> = {
    date: now.toISOString().split('T')[0],
    week_number: getWeekNumber(now).toString(),
  }

  const allVars = { ...builtInVars, ...variables }
  for (const [key, value] of Object.entries(allVars)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g')
    result = result.replace(regex, value)
  }
  return result
}

function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  )
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export default TemplateApplyModal

import React from 'react'
import { TaskTemplate } from '../../types'
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
} from '../../design-system/tokens'

interface TemplateCardProps {
  template: TaskTemplate
  onSelect: (template: TaskTemplate) => void
  onEdit: (template: TaskTemplate) => void
  onDelete: (id: string) => void
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onSelect,
  onEdit,
  onDelete,
}) => {
  return (
    <div
      style={{
        padding: spacing.md,
        backgroundColor: colors.white,
        border: `1px solid ${colors.border.default}`,
        borderRadius: borderRadius.lg,
        boxShadow: shadows.sm,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = shadows.md
        e.currentTarget.style.borderColor = colors.primary
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = shadows.sm
        e.currentTarget.style.borderColor = colors.border.default
      }}
      onClick={() => onSelect(template)}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: spacing.sm,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
          }}
        >
          {template.title}
        </h3>
        <div style={{ display: 'flex', gap: spacing.xs }}>
          <button
            onClick={e => {
              e.stopPropagation()
              onEdit(template)
            }}
            style={{
              padding: spacing.xs,
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: colors.text.secondary,
            }}
            title="Edit template"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            onClick={e => {
              e.stopPropagation()
              if (confirm('Delete this template?')) {
                onDelete(template.id)
              }
            }}
            style={{
              padding: spacing.xs,
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: colors.danger,
            }}
            title="Delete template"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {template.description && (
        <p
          style={{
            margin: `0 0 ${spacing.sm} 0`,
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            lineHeight: '1.5',
          }}
        >
          {template.description}
        </p>
      )}

      <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
        {template.priority && (
          <span
            style={{
              padding: `${spacing.xs} ${spacing.sm}`,
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium,
              borderRadius: borderRadius.full,
              backgroundColor: getPriorityColor(template.priority),
              color: colors.white,
            }}
          >
            {template.priority}
          </span>
        )}
        {template.estimated_duration && (
          <span
            style={{
              padding: `${spacing.xs} ${spacing.sm}`,
              fontSize: typography.fontSize.xs,
              borderRadius: borderRadius.full,
              backgroundColor: colors.bg.subtle,
              color: colors.text.secondary,
            }}
          >
            {formatDuration(template.estimated_duration)}
          </span>
        )}
        {template.checklist && template.checklist.length > 0 && (
          <span
            style={{
              padding: `${spacing.xs} ${spacing.sm}`,
              fontSize: typography.fontSize.xs,
              borderRadius: borderRadius.full,
              backgroundColor: colors.bg.subtle,
              color: colors.text.secondary,
            }}
          >
            {template.checklist.length} checklist items
          </span>
        )}
      </div>
    </div>
  )
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical':
      return colors.danger
    case 'high':
      return colors.warning
    case 'medium':
      return colors.primary
    case 'low':
      return colors.success
    default:
      return colors.text.secondary
  }
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

export default TemplateCard

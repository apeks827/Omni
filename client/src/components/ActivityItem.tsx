import React from 'react'
import { Activity, ActivityActionType } from '../types'
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from '../design-system/tokens'

interface ActivityItemProps {
  activity: Activity
  onTaskClick?: (taskId: string) => void
}

const ACTION_LABELS: Record<
  ActivityActionType,
  { icon: string; label: string; color: string }
> = {
  task_created: { icon: '+', label: 'created', color: colors.success },
  task_updated: { icon: '✏️', label: 'updated', color: colors.primary },
  task_completed: { icon: '✓', label: 'completed', color: colors.success },
  task_assigned: { icon: '👤', label: 'assigned', color: colors.warning },
  task_commented: { icon: '💬', label: 'commented on', color: colors.info },
  task_deleted: { icon: '🗑️', label: 'deleted', color: colors.danger },
  status_changed: {
    icon: '🔄',
    label: 'changed status of',
    color: colors.primary,
  },
  priority_changed: {
    icon: '⚡',
    label: 'changed priority of',
    color: colors.warning,
  },
}

const formatDate = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

const formatAbsoluteDate = (date: Date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    pending: colors.gray500,
    todo: colors.gray500,
    in_progress: colors.warning,
    completed: colors.success,
    done: colors.success,
    missed: colors.danger,
  }
  return statusColors[status] || colors.gray500
}

const getPriorityColor = (priority: string): string => {
  const priorityColors: Record<string, string> = {
    low: colors.gray500,
    medium: colors.info,
    high: colors.warning,
    critical: colors.danger,
  }
  return priorityColors[priority] || colors.gray500
}

const DiffView: React.FC<{ changes: Activity['changes'] }> = ({ changes }) => {
  if (!changes || changes.length === 0) return null

  return (
    <div
      style={{
        marginTop: spacing.sm,
        padding: spacing.sm,
        backgroundColor: colors.gray100,
        borderRadius: borderRadius.md,
        fontSize: typography.fontSize.sm,
      }}
    >
      {changes.map((change, idx) => (
        <div key={idx} style={{ marginBottom: spacing.xs }}>
          <span style={{ color: colors.gray600 }}>{change.field}:</span>{' '}
          {change.field === 'status' ? (
            <>
              <span
                style={{
                  color: getStatusColor(String(change.old)),
                  textDecoration: 'line-through',
                  opacity: 0.7,
                }}
              >
                {String(change.old ?? 'none')}
              </span>
              <span style={{ margin: '0 4px', color: colors.gray400 }}>→</span>
              <span
                style={{
                  color: getStatusColor(String(change.new ?? '')),
                  fontWeight: 500,
                }}
              >
                {String(change.new ?? 'none')}
              </span>
            </>
          ) : change.field === 'priority' ? (
            <>
              <span
                style={{
                  color: getPriorityColor(String(change.old)),
                  textDecoration: 'line-through',
                  opacity: 0.7,
                }}
              >
                {String(change.old ?? 'none')}
              </span>
              <span style={{ margin: '0 4px', color: colors.gray400 }}>→</span>
              <span
                style={{
                  color: getPriorityColor(String(change.new ?? '')),
                  fontWeight: 500,
                }}
              >
                {String(change.new ?? 'none')}
              </span>
            </>
          ) : (
            <>
              <span style={{ color: colors.gray700 }}>
                {String(change.old ?? 'empty')}
              </span>
              <span style={{ margin: '0 4px', color: colors.gray400 }}>→</span>
              <span style={{ color: colors.primary, fontWeight: 500 }}>
                {String(change.new ?? 'empty')}
              </span>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

const ActivityItem: React.FC<ActivityItemProps> = ({
  activity,
  onTaskClick,
}) => {
  const action = ACTION_LABELS[activity.action_type] || {
    icon: '📋',
    label: activity.action_type,
    color: colors.gray600,
  }

  const handleTaskClick = () => {
    if (onTaskClick && activity.task_id) {
      onTaskClick(activity.task_id)
    }
  }

  const avatarStyle: React.CSSProperties = {
    width: '36px',
    height: '36px',
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    color: colors.white,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    flexShrink: 0,
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: spacing.md,
        padding: spacing.md,
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        border: `1px solid ${colors.border.subtle}`,
        transition: 'box-shadow 0.2s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={avatarStyle}>
        {activity.user?.username?.charAt(0).toUpperCase() || '?'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.sm }}
        >
          <div style={{ flex: 1 }}>
            <span
              style={{
                fontWeight: typography.fontWeight.semibold,
                color: colors.gray900,
              }}
            >
              {activity.user?.username || 'System'}
            </span>
            <span style={{ marginLeft: spacing.xs, color: colors.gray600 }}>
              {action.label}
            </span>
            <button
              onClick={handleTaskClick}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                marginLeft: spacing.xs,
                color: colors.primary,
                cursor: onTaskClick ? 'pointer' : 'default',
                fontWeight: typography.fontWeight.medium,
                fontSize: 'inherit',
              }}
              disabled={!onTaskClick}
            >
              {activity.task_title || 'Unknown task'}
            </button>
          </div>

          <div
            style={{
              fontSize: typography.fontSize.xs,
              color: colors.gray500,
              flexShrink: 0,
            }}
            title={formatAbsoluteDate(activity.created_at)}
          >
            {formatDate(activity.created_at)}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            marginTop: spacing.xs,
          }}
        >
          <span
            style={{
              fontSize: typography.fontSize.xs,
              color: action.color,
              backgroundColor: action.color + '15',
              padding: `2px ${spacing.sm}`,
              borderRadius: borderRadius.full,
              display: 'inline-flex',
              alignItems: 'center',
              gap: spacing.xs,
            }}
          >
            {action.icon} {activity.action_type.replace('_', ' ')}
          </span>
        </div>

        <DiffView changes={activity.changes} />
      </div>
    </div>
  )
}

export default ActivityItem

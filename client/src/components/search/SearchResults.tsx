import React from 'react'
import { Task } from '../../types'
import {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
} from '../../design-system'

interface SearchResultsProps {
  results: Task[]
  query: string
  isLoading: boolean
  error: string | null
  onSelectTask: (task: Task) => void
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  query,
  isLoading,
  error,
  onSelectTask,
}) => {
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing.xl,
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            border: '3px solid',
            borderColor: `${colors.primary} transparent ${colors.primary} transparent`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          padding: spacing.md,
          backgroundColor: colors.danger + '10',
          border: `1px solid ${colors.danger}30`,
          borderRadius: borderRadius.lg,
          color: colors.danger,
          textAlign: 'center',
        }}
      >
        {error}
      </div>
    )
  }

  if (results.length === 0 && query) {
    return (
      <div
        style={{
          padding: spacing.xl,
          textAlign: 'center',
          color: colors.text.secondary,
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke={colors.text.secondary}
          strokeWidth="1.5"
          style={{ margin: '0 auto 16px', display: 'block', opacity: 0.5 }}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
          <path d="M8 8l6 6M14 8l-6 6" />
        </svg>
        <p style={{ margin: 0, fontSize: typography.fontSize.md }}>
          No tasks found for "{query}"
        </p>
        <p
          style={{
            margin: `${spacing.sm} 0 0`,
            fontSize: typography.fontSize.sm,
          }}
        >
          Try different keywords or remove filters
        </p>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div
        style={{
          padding: spacing.xl,
          textAlign: 'center',
          color: colors.text.secondary,
        }}
      >
        <p style={{ margin: 0, fontSize: typography.fontSize.md }}>
          Start typing to search tasks
        </p>
        <p
          style={{
            margin: `${spacing.sm} 0 0`,
            fontSize: typography.fontSize.sm,
          }}
        >
          Use filters to narrow down results
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
      <div
        style={{
          padding: spacing.sm,
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary,
          borderBottom: `1px solid ${colors.border.subtle}`,
        }}
      >
        {results.length} result{results.length !== 1 ? 's' : ''} found
      </div>
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {results.map(task => (
          <TaskResultItem
            key={task.id}
            task={task}
            query={query}
            onClick={() => onSelectTask(task)}
          />
        ))}
      </div>
    </div>
  )
}

interface TaskResultItemProps {
  task: Task
  query: string
  onClick: () => void
}

const TaskResultItem: React.FC<TaskResultItemProps> = ({
  task,
  query,
  onClick,
}) => {
  const priorityColors: Record<string, string> = {
    critical: colors.danger,
    high: colors.warning,
    medium: colors.info,
    low: colors.secondary,
  }

  const statusColors: Record<string, { bg: string; text: string }> = {
    todo: { bg: colors.gray100, text: colors.gray700 },
    in_progress: { bg: colors.primary + '20', text: colors.primary },
    done: { bg: colors.success + '20', text: colors.success },
    cancelled: { bg: colors.gray200, text: colors.gray600 },
  }

  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text

    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
      'gi'
    )
    const parts = text.split(regex)

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark
          key={i}
          style={{
            backgroundColor: colors.warning + '40',
            padding: '0 2px',
            borderRadius: '2px',
          }}
        >
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        cursor: 'pointer',
        transition: 'background-color 0.15s',
        border: `1px solid ${colors.border.subtle}`,
        backgroundColor: colors.white,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = colors.bg.subtle
        e.currentTarget.style.boxShadow = shadows.sm
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = colors.white
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div
        style={{
          width: '4px',
          height: '100%',
          minHeight: '40px',
          backgroundColor: priorityColors[task.priority] || colors.gray400,
          borderRadius: borderRadius.full,
          flexShrink: 0,
        }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            marginBottom: spacing.xs,
          }}
        >
          <span
            style={{
              fontSize: typography.fontSize.md,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.primary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {highlightText(task.title, query)}
          </span>
        </div>

        {task.description && (
          <p
            style={{
              margin: 0,
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {highlightText(task.description, query)}
          </p>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            marginTop: spacing.sm,
          }}
        >
          <span
            style={{
              padding: `2px ${spacing.sm}`,
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium,
              backgroundColor: statusColors[task.status]?.bg || colors.gray100,
              color: statusColors[task.status]?.text || colors.gray700,
              borderRadius: borderRadius.full,
              textTransform: 'capitalize',
            }}
          >
            {task.status.replace('_', ' ')}
          </span>

          <span
            style={{
              padding: `2px ${spacing.sm}`,
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium,
              backgroundColor: priorityColors[task.priority] + '20',
              color: priorityColors[task.priority],
              borderRadius: borderRadius.full,
              textTransform: 'capitalize',
            }}
          >
            {task.priority}
          </span>

          {task.due_date && (
            <span
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.text.secondary,
              }}
            >
              Due {new Date(task.due_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke={colors.text.secondary}
        strokeWidth="2"
        style={{ flexShrink: 0, opacity: 0.5 }}
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </div>
  )
}

export default SearchResults

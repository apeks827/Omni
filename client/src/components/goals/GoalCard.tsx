import React from 'react'
import { Card, Text, Badge } from '../../design-system'
import { ProgressBar } from './ProgressBadge'
import { spacing, colors } from '../../design-system/tokens'

export interface Goal {
  id: string
  title: string
  description?: string
  status: 'draft' | 'active' | 'completed' | 'archived' | 'cancelled'
  timeframe_type: 'quarter' | 'year' | 'custom'
  start_date: string
  end_date: string
  progress_percentage: number
  created_at: string | Date
  updated_at: string | Date
}

interface GoalCardProps {
  goal: Goal
  onClick: (goalId: string) => void
}

const getStatusVariant = (
  status: Goal['status']
): 'secondary' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case 'draft':
      return 'secondary'
    case 'active':
      return 'info'
    case 'completed':
      return 'success'
    case 'archived':
      return 'warning'
    case 'cancelled':
      return 'warning'
    default:
      return 'secondary'
  }
}

const formatDate = (dateStr: string | Date): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const getTimeframeLabel = (type: Goal['timeframe_type']): string => {
  switch (type) {
    case 'quarter':
      return 'Quarter'
    case 'year':
      return 'Year'
    case 'custom':
      return 'Custom'
    default:
      return type
  }
}

const isOverdue = (endDate: string | Date): boolean => {
  return new Date(endDate) < new Date()
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onClick }) => {
  const [isHovered, setIsHovered] = React.useState(false)
  const overdue = goal.status === 'active' && isOverdue(goal.end_date)

  return (
    <Card
      padding="md"
      borderColor={isHovered ? colors.primary : colors.gray200}
      style={{
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 8px 16px rgba(0, 0, 0, 0.1)' : undefined,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(goal.id)}
    >
      <div style={{ marginBottom: spacing.md }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: spacing.sm,
          }}
        >
          <Text variant="h4" style={{ flex: 1, marginRight: spacing.sm }}>
            {goal.title}
          </Text>
          <Badge variant={getStatusVariant(goal.status)} size="sm">
            {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
          </Badge>
        </div>

        {goal.description && (
          <Text
            variant="body"
            style={{
              color: colors.gray600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              marginBottom: spacing.sm,
            }}
          >
            {goal.description}
          </Text>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: spacing.md,
          marginBottom: spacing.md,
          fontSize: '13px',
          color: colors.gray500,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: spacing.xs,
          }}
        >
          <Badge variant="secondary" size="sm">
            {getTimeframeLabel(goal.timeframe_type)}
          </Badge>
        </span>
        <span style={{ color: overdue ? colors.danger : colors.gray500 }}>
          {formatDate(goal.start_date)} - {formatDate(goal.end_date)}
          {overdue && ' (Overdue)'}
        </span>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.xs,
          }}
        >
          <Text variant="caption" style={{ color: colors.gray500 }}>
            Progress
          </Text>
          <Text
            variant="caption"
            weight="bold"
            style={{
              color:
                goal.progress_percentage >= 67
                  ? colors.success
                  : goal.progress_percentage >= 34
                    ? colors.warning
                    : colors.danger,
            }}
          >
            {Math.round(goal.progress_percentage)}%
          </Text>
        </div>
        <ProgressBar percentage={goal.progress_percentage} height={6} />
      </div>
    </Card>
  )
}

export default GoalCard

import React from 'react'
import { Text, Button, Stack } from '../design-system'
import { spacing, colors } from '../design-system/tokens'

interface EmptyStateProps {
  title?: string
  message?: string
  actionLabel?: string
  onAction?: () => void
  icon?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No tasks yet',
  message = 'Create your first task to get started!',
  actionLabel = 'Create Task',
  onAction,
  icon = '📝',
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
        textAlign: 'center',
        minHeight: '300px',
      }}
    >
      <div
        style={{
          fontSize: '64px',
          marginBottom: spacing.lg,
          opacity: 0.6,
        }}
      >
        {icon}
      </div>
      <Stack direction="vertical" spacing="md" align="center">
        <Text variant="h3" style={{ color: colors.gray700 }}>
          {title}
        </Text>
        <Text
          variant="body"
          style={{ color: colors.gray600, maxWidth: '400px' }}
        >
          {message}
        </Text>
        {onAction && (
          <Button
            variant="primary"
            onClick={onAction}
            style={{ marginTop: spacing.md }}
          >
            {actionLabel}
          </Button>
        )}
      </Stack>
    </div>
  )
}

export default EmptyState

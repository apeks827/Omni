import React from 'react'
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  typography,
} from '../../design-system/tokens'
import Button from '../../design-system/components/Button/Button'
import ContextBadge from './ContextBadge'
import { TaskSuggestion } from '../../services/contextRulesEngine'

interface ContextSuggestionProps {
  suggestion: TaskSuggestion
  onAccept: () => void
  onDismiss: () => void
}

const ContextSuggestion: React.FC<ContextSuggestionProps> = ({
  suggestion,
  onAccept,
  onDismiss,
}) => {
  const getContextBadgeType = () => {
    if (suggestion.context === 'device') {
      return 'desktop'
    }
    if (suggestion.context === 'time') {
      return 'morning'
    }
    if (suggestion.context === 'location') {
      return 'location'
    }
    return 'desktop'
  }

  return (
    <div
      style={{
        backgroundColor: colors.white,
        border: `1px solid ${colors.border.subtle}`,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        boxShadow: shadows.sm,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
        <span style={{ fontSize: '1.25rem' }}>💡</span>
        <ContextBadge context={getContextBadgeType()} />
      </div>

      <div>
        <h4
          style={{
            fontSize: typography.fontSize.md,
            fontWeight: typography.fontWeight.semibold,
            margin: 0,
            marginBottom: spacing.xs,
            color: colors.text.primary,
          }}
        >
          {suggestion.taskTitle}
        </h4>
        <p
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            margin: 0,
          }}
        >
          {suggestion.reason}
        </p>
      </div>

      <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.xs }}>
        <Button variant="primary" size="sm" onClick={onAccept}>
          Add to Today
        </Button>
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          Skip
        </Button>
      </div>
    </div>
  )
}

export default ContextSuggestion

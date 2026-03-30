import React, { useState } from 'react'
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from '../../design-system/tokens'
import ContextSuggestion from './ContextSuggestion'
import { useContextRules } from '../../hooks/useContextRules'

const ContextSuggestionsPanel: React.FC = () => {
  const { suggestions } = useContextRules()
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const visibleSuggestions = suggestions.filter(
    (s, index) => !dismissedIds.has(`${s.taskType}_${index}`)
  )

  const handleAccept = (suggestion: (typeof suggestions)[0], index: number) => {
    console.log('Accept suggestion:', suggestion)
    setDismissedIds(prev =>
      new Set(prev).add(`${suggestion.taskType}_${index}`)
    )
  }

  const handleDismiss = (
    suggestion: (typeof suggestions)[0],
    index: number
  ) => {
    setDismissedIds(prev =>
      new Set(prev).add(`${suggestion.taskType}_${index}`)
    )
  }

  if (visibleSuggestions.length === 0) {
    return null
  }

  return (
    <div
      style={{
        backgroundColor: colors.bg.subtle,
        border: `1px solid ${colors.border.subtle}`,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.md,
        }}
      >
        <span style={{ fontSize: '1.25rem' }}>💡</span>
        <h3
          style={{
            fontSize: typography.fontSize.md,
            fontWeight: typography.fontWeight.semibold,
            margin: 0,
            color: colors.text.primary,
          }}
        >
          Suggested for this context
        </h3>
      </div>

      <div
        style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}
      >
        {visibleSuggestions.slice(0, 3).map((suggestion, index) => (
          <ContextSuggestion
            key={`${suggestion.taskType}_${index}`}
            suggestion={suggestion}
            onAccept={() => handleAccept(suggestion, index)}
            onDismiss={() => handleDismiss(suggestion, index)}
          />
        ))}
      </div>
    </div>
  )
}

export default ContextSuggestionsPanel

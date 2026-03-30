import React from 'react'
import { spacing, borderRadius, typography } from '../../design-system/tokens'

interface ContextBadgeProps {
  context:
    | 'desktop'
    | 'mobile'
    | 'location'
    | 'morning'
    | 'afternoon'
    | 'evening'
    | 'night'
}

const ContextBadge: React.FC<ContextBadgeProps> = ({ context }) => {
  const getContextStyle = () => {
    switch (context) {
      case 'desktop':
        return { icon: '💻', bg: '#007bff', label: 'Desktop' }
      case 'mobile':
        return { icon: '📱', bg: '#6f42c1', label: 'Mobile' }
      case 'location':
        return { icon: '📍', bg: '#28a745', label: 'Location' }
      case 'morning':
        return { icon: '🌅', bg: '#fd7e14', label: 'Morning' }
      case 'afternoon':
        return { icon: '☀️', bg: '#ffc107', label: 'Afternoon' }
      case 'evening':
        return { icon: '🌆', bg: '#6610f2', label: 'Evening' }
      case 'night':
        return { icon: '🌙', bg: '#6c757d', label: 'Night' }
    }
  }

  const { icon, bg, label } = getContextStyle()

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing.xs,
        padding: `${spacing.xs} ${spacing.sm}`,
        backgroundColor: bg,
        color: '#ffffff',
        borderRadius: borderRadius.full,
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
      }}
      aria-label={`Context: ${label}`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  )
}

export default ContextBadge

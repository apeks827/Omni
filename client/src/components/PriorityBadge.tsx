import React from 'react'
import { Task } from '../types'

interface PriorityBadgeProps {
  priority: Task['priority']
  size?: 'sm' | 'md'
  variant?: 'badge' | 'dot'
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  size = 'md',
  variant = 'badge',
}) => {
  const getPriorityColor = (priority: Task['priority']): string => {
    switch (priority) {
      case 'low':
        return '#28a745'
      case 'medium':
        return '#ffc107'
      case 'high':
        return '#fd7e14'
      case 'critical':
        return '#dc3545'
      default:
        return '#6c757d'
    }
  }

  const getPriorityLabel = (priority: Task['priority']): string => {
    switch (priority) {
      case 'low':
        return 'Low'
      case 'medium':
        return 'Medium'
      case 'high':
        return 'High'
      case 'critical':
        return 'Critical'
      default:
        return priority
    }
  }

  if (variant === 'dot') {
    const dotSize = size === 'sm' ? '8px' : '10px'
    return (
      <span
        style={{
          display: 'inline-block',
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          backgroundColor: getPriorityColor(priority),
        }}
        title={getPriorityLabel(priority)}
        aria-label={`Priority: ${getPriorityLabel(priority)}`}
      />
    )
  }

  const fontSize = size === 'sm' ? '0.75rem' : '0.875rem'
  const padding = size === 'sm' ? '2px 6px' : '4px 8px'
  const color = getPriorityColor(priority)
  const textColor = priority === 'medium' ? '#343a40' : '#ffffff'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding,
        fontSize,
        fontWeight: 500,
        borderRadius: '9999px',
        backgroundColor: color,
        color: textColor,
        whiteSpace: 'nowrap',
      }}
    >
      {getPriorityLabel(priority)}
    </span>
  )
}

export default PriorityBadge

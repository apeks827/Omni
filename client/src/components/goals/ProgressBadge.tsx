import React from 'react'
import { spacing } from '../../design-system/tokens'

interface ProgressBadgeProps {
  percentage: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export const ProgressBadge: React.FC<ProgressBadgeProps> = ({
  percentage,
  size = 'md',
  showLabel = true,
}) => {
  const getColor = () => {
    if (percentage >= 67) return '#22c55e'
    if (percentage >= 34) return '#eab308'
    return '#ef4444'
  }

  const getBgColor = () => {
    if (percentage >= 67) return 'rgba(34, 197, 94, 0.1)'
    if (percentage >= 34) return 'rgba(234, 179, 8, 0.1)'
    return 'rgba(239, 68, 68, 0.1)'
  }

  const sizeStyles = {
    sm: { fontSize: '12px', padding: '2px 8px', barHeight: '4px' },
    md: { fontSize: '14px', padding: '4px 12px', barHeight: '6px' },
    lg: { fontSize: '16px', padding: '6px 16px', barHeight: '8px' },
  }

  const styles = sizeStyles[size]
  const color = getColor()
  const bgColor = getBgColor()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
      {showLabel && (
        <span
          style={{
            fontSize: styles.fontSize,
            fontWeight: 600,
            color: color,
          }}
        >
          {Math.round(percentage)}%
        </span>
      )}
      <div
        style={{
          width: '100%',
          height: styles.barHeight,
          backgroundColor: bgColor,
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.min(100, Math.max(0, percentage))}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: '4px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  )
}

export const ProgressBar: React.FC<{
  percentage: number
  height?: number
  color?: string
}> = ({ percentage, height = 8, color }) => {
  const getColor = () => {
    if (color) return color
    if (percentage >= 67) return '#22c55e'
    if (percentage >= 34) return '#eab308'
    return '#ef4444'
  }

  return (
    <div
      style={{
        width: '100%',
        height: `${height}px`,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${Math.min(100, Math.max(0, percentage))}%`,
          height: '100%',
          backgroundColor: getColor(),
          borderRadius: '4px',
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  )
}

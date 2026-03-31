import React from 'react'
import { colors, spacing, borderRadius, shadows } from '../../tokens'

interface CardProps {
  children: React.ReactNode
  padding?: keyof typeof spacing
  shadow?: keyof typeof shadows
  borderRadius?: keyof typeof borderRadius
  borderColor?: string
  style?: React.CSSProperties
  className?: string
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  shadow = 'sm',
  borderRadius: radius = 'md',
  borderColor,
  style,
  className,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const baseStyles: React.CSSProperties = {
    backgroundColor: colors.white,
    padding: spacing[padding],
    boxShadow: shadows[shadow],
    borderRadius: borderRadius[radius],
    border: `1px solid ${borderColor || colors.gray200}`,
    ...style,
  }

  return (
    <div
      style={baseStyles}
      className={className}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  )
}

export default Card

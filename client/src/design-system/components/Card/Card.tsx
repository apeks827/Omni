import React from 'react'
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../tokens'

interface CardProps {
  children: React.ReactNode
  padding?: keyof typeof spacing
  shadow?: keyof typeof shadows
  borderRadius?: keyof typeof borderRadius
  style?: React.CSSProperties
  className?: string
}

const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  shadow = 'sm',
  borderRadius: radius = 'md',
  style,
  className,
}) => {
  const baseStyles: React.CSSProperties = {
    backgroundColor: colors.white,
    padding: spacing[padding],
    boxShadow: shadows[shadow],
    borderRadius: borderRadius[radius],
    border: `1px solid ${colors.gray200}`,
    ...style,
  }

  return (
    <div style={baseStyles} className={className}>
      {children}
    </div>
  )
}

export default Card

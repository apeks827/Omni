import React from 'react'
import { colors, spacing, borderRadius, typography } from '../../tokens'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
  size?: 'sm' | 'md'
  style?: React.CSSProperties
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  style,
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary,
          color: colors.white,
        }
      case 'secondary':
        return {
          backgroundColor: colors.secondary,
          color: colors.white,
        }
      case 'success':
        return {
          backgroundColor: colors.success,
          color: colors.white,
        }
      case 'danger':
        return {
          backgroundColor: colors.danger,
          color: colors.white,
        }
      case 'warning':
        return {
          backgroundColor: colors.warning,
          color: colors.dark,
        }
      case 'info':
        return {
          backgroundColor: colors.info,
          color: colors.white,
        }
      default:
        return {}
    }
  }

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return {
          padding: `2px ${spacing.xs}`,
          fontSize: typography.fontSize.xs,
        }
      case 'md':
      default:
        return {
          padding: `${spacing.xs} ${spacing.sm}`,
          fontSize: typography.fontSize.sm,
        }
    }
  }

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    fontWeight: typography.fontWeight.medium,
    whiteSpace: 'nowrap',
    ...getVariantStyles(),
    ...getSizeStyles(),
    ...style,
  }

  return <span style={baseStyles}>{children}</span>
}

export default Badge

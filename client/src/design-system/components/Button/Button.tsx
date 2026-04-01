import React from 'react'
import { colors, spacing, borderRadius, typography } from '../../tokens'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'danger'
    | 'warning'
    | 'outline'
    | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  style,
  disabled,
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary,
          color: colors.white,
          border: 'none',
        }
      case 'secondary':
        return {
          backgroundColor: colors.secondary,
          color: colors.white,
          border: 'none',
        }
      case 'success':
        return {
          backgroundColor: colors.success,
          color: colors.white,
          border: 'none',
        }
      case 'danger':
        return {
          backgroundColor: colors.danger,
          color: colors.white,
          border: 'none',
        }
      case 'warning':
        return {
          backgroundColor: colors.warning,
          color: colors.dark,
          border: 'none',
        }
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: colors.primary,
          border: `1px solid ${colors.primary}`,
        }
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: colors.primary,
          border: 'none',
        }
      default:
        return {}
    }
  }

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return {
          padding: `${spacing.xs} ${spacing.sm}`,
          fontSize: typography.fontSize.sm,
        }
      case 'lg':
        return {
          padding: `${spacing.md} ${spacing.lg}`,
          fontSize: typography.fontSize.lg,
        }
      case 'md':
      default:
        return {
          padding: `${spacing.sm} ${spacing.md}`,
          fontSize: typography.fontSize.md,
        }
    }
  }

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.6 : 1,
    transition: 'all 0.2s ease',
    fontWeight: typography.fontWeight.medium,
    fontFamily: 'inherit',
    ...getVariantStyles(),
    ...getSizeStyles(),
    ...style,
  }

  return (
    <button style={baseStyles} disabled={disabled || isLoading} {...props}>
      {isLoading && <span className="loader">...</span>}
      {!isLoading && leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  )
}

export default Button

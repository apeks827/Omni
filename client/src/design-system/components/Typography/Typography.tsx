import React from 'react'
import { typography, colors } from '../../tokens'

type Variant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'body1'
  | 'body2'
  | 'caption'
  | 'overline'
type Color =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'dark'
  | 'light'
  | 'inherit'
type Align = 'left' | 'center' | 'right' | 'justify'

interface TypographyProps {
  variant?: Variant
  color?: Color
  align?: Align
  gutterBottom?: boolean
  noWrap?: boolean
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  h1: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
  },
  h2: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
  },
  h3: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.tight,
  },
  h4: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.normal,
  },
  h5: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.normal,
  },
  h6: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.normal,
  },
  body1: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal,
  },
  body2: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal,
  },
  caption: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal,
  },
  overline: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
}

const colorMapping: Record<Color, string> = {
  primary: colors.primary,
  secondary: colors.secondary,
  success: colors.success,
  danger: colors.danger,
  dark: colors.dark,
  light: colors.light,
  inherit: 'inherit',
}

const Typography: React.FC<TypographyProps> = ({
  variant = 'body1',
  color = 'inherit',
  align = 'left',
  gutterBottom = false,
  noWrap = false,
  children,
  className = '',
  style = {},
}) => {
  const combinedStyle: React.CSSProperties = {
    ...variantStyles[variant],
    color: colorMapping[color],
    textAlign: align,
    marginBottom: gutterBottom ? '0.5em' : 0,
    whiteSpace: noWrap ? 'nowrap' : 'normal',
    overflow: noWrap ? 'hidden' : 'visible',
    textOverflow: noWrap ? 'ellipsis' : 'clip',
    margin: 0,
    ...style,
  }

  if (variant === 'h1')
    return (
      <h1 className={className} style={combinedStyle}>
        {children}
      </h1>
    )
  if (variant === 'h2')
    return (
      <h2 className={className} style={combinedStyle}>
        {children}
      </h2>
    )
  if (variant === 'h3')
    return (
      <h3 className={className} style={combinedStyle}>
        {children}
      </h3>
    )
  if (variant === 'h4')
    return (
      <h4 className={className} style={combinedStyle}>
        {children}
      </h4>
    )
  if (variant === 'h5')
    return (
      <h5 className={className} style={combinedStyle}>
        {children}
      </h5>
    )
  if (variant === 'h6')
    return (
      <h6 className={className} style={combinedStyle}>
        {children}
      </h6>
    )
  if (variant === 'caption' || variant === 'overline')
    return (
      <span className={className} style={combinedStyle}>
        {children}
      </span>
    )
  return (
    <p className={className} style={combinedStyle}>
      {children}
    </p>
  )
}

export default Typography

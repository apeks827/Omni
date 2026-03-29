import React from 'react'
import { colors, typography } from '../../tokens'

interface TextProps {
  children: React.ReactNode
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption' | 'overline'
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 'white' | 'gray100' | 'gray200' | 'gray300' | 'gray400' | 'gray500' | 'gray600' | 'gray700' | 'gray800' | 'gray900' | 'focus' | 'bg' | 'border'
  weight?: keyof typeof typography.fontWeight
  align?: 'left' | 'center' | 'right' | 'justify'
  truncate?: boolean
  style?: React.CSSProperties
}

const Text: React.FC<TextProps> = ({
  children,
  variant = 'body',
  color = 'dark',
  weight = 'normal',
  align = 'left',
  truncate = false,
  style,
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      color: typeof colors[color] === 'string' ? colors[color] as string : colors.dark,
      fontWeight: typography.fontWeight[weight],
      textAlign: align,
      overflow: truncate ? 'hidden' : 'visible',
      textOverflow: truncate ? 'ellipsis' : 'clip',
      whiteSpace: truncate ? 'nowrap' : 'normal',
    }

    switch (variant) {
      case 'h1':
        return {
          ...base,
          fontSize: typography.fontSize.xxl,
          lineHeight: typography.lineHeight.tight,
        }
      case 'h2':
        return {
          ...base,
          fontSize: typography.fontSize.xl,
          lineHeight: typography.lineHeight.tight,
        }
      case 'h3':
        return {
          ...base,
          fontSize: typography.fontSize.lg,
          lineHeight: typography.lineHeight.normal,
        }
      case 'h4':
        return {
          ...base,
          fontSize: typography.fontSize.md,
          lineHeight: typography.lineHeight.normal,
          fontWeight: typography.fontWeight.semibold,
        }
      case 'h5':
        return {
          ...base,
          fontSize: typography.fontSize.sm,
          lineHeight: typography.lineHeight.normal,
          fontWeight: typography.fontWeight.semibold,
        }
      case 'h6':
        return {
          ...base,
          fontSize: typography.fontSize.xs,
          lineHeight: typography.lineHeight.normal,
          fontWeight: typography.fontWeight.medium,
        }
      case 'body':
        return {
          ...base,
          fontSize: typography.fontSize.md,
          lineHeight: typography.lineHeight.relaxed,
        }
      case 'caption':
        return {
          ...base,
          fontSize: typography.fontSize.sm,
          lineHeight: typography.lineHeight.normal,
          opacity: 0.8,
        }
      case 'overline':
        return {
          ...base,
          fontSize: typography.fontSize.xs,
          lineHeight: typography.lineHeight.normal,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }
      default:
        return base
    }
  }

  const baseStyles: React.CSSProperties = {
    display: 'block',
    margin: 0,
    ...getVariantStyles(),
    ...style,
  }

  return <span style={baseStyles}>{children}</span>
}

export default Text

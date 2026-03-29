import React from 'react'
import { colors, spacing, borderRadius, typography } from '../../tokens'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  style,
  disabled,
  ...props
}) => {
  const inputStyles: React.CSSProperties = {
    width: fullWidth ? '100%' : 'auto',
    padding: `${spacing.sm} ${spacing.md}`,
    fontSize: typography.fontSize.md,
    lineHeight: typography.lineHeight.normal,
    color: colors.dark,
    backgroundColor: disabled ? colors.gray100 : colors.white,
    border: `1px solid ${error ? colors.danger : colors.gray300}`,
    borderRadius: borderRadius.md,
    outline: 'none',
    transition: 'border-color 0.2s ease',
    fontFamily: 'inherit',
    ...style,
  }

  const labelStyles: React.CSSProperties = {
    display: 'block',
    marginBottom: spacing.xs,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.dark,
  }

  const helperStyles: React.CSSProperties = {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.xs,
    color: error ? colors.danger : colors.gray600,
  }

  return (
    <div style={{ marginBottom: spacing.md }}>
      {label && <label style={labelStyles}>{label}</label>}
      <input style={inputStyles} disabled={disabled} {...props} />
      {(error || helperText) && (
        <div style={helperStyles}>{error || helperText}</div>
      )}
    </div>
  )
}

export default Input

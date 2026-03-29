import React from 'react'
import { colors, spacing } from '../../tokens'

interface DurationInputProps {
  value: number
  onChange: (minutes: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  error?: string
}

export const DurationInput: React.FC<DurationInputProps> = ({
  value,
  onChange,
  min = 5,
  max = 1440,
  step = 5,
  label = 'Duration',
  error,
}) => {
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10)
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
      {label && (
        <label
          style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: colors.gray700,
          }}
        >
          {label}
        </label>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
        <input
          type="number"
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          style={{
            width: '100px',
            padding: spacing.sm,
            border: `1px solid ${error ? colors.danger : colors.border.default}`,
            borderRadius: '4px',
            fontSize: '0.875rem',
            outline: 'none',
          }}
        />
        <span
          style={{
            fontSize: '0.875rem',
            color: colors.gray600,
            minWidth: '80px',
          }}
        >
          {formatDuration(value)}
        </span>
      </div>
      {error && (
        <span
          style={{
            fontSize: '0.75rem',
            color: colors.danger,
          }}
        >
          {error}
        </span>
      )}
    </div>
  )
}

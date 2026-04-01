import React, { useState, useCallback } from 'react'
import { colors, spacing, borderRadius, transitions } from '../../tokens'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  label?: string
  description?: string
}

const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  label,
  description,
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = useCallback(() => {
    if (!disabled) {
      onChange(!checked)
    }
  }, [checked, disabled, onChange])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === ' ' || e.key === 'Enter') && !disabled) {
        e.preventDefault()
        onChange(!checked)
      }
    },
    [checked, disabled, onChange]
  )

  const getSizes = () => {
    switch (size) {
      case 'sm':
        return {
          track: { width: 32, height: 18 },
          thumb: { size: 14, offset: 2 },
        }
      case 'lg':
        return {
          track: { width: 56, height: 28 },
          thumb: { size: 24, offset: 2 },
        }
      case 'md':
      default:
        return {
          track: { width: 44, height: 24 },
          thumb: { size: 20, offset: 2 },
        }
    }
  }

  const { track, thumb } = getSizes()
  const thumbOffset = checked
    ? track.width - thumb.size - thumb.offset
    : thumb.offset

  const trackBg = disabled
    ? colors.gray300
    : checked
      ? colors.primary
      : isHovered
        ? colors.gray400
        : colors.gray200

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.sm }}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <div
          role="switch"
          aria-checked={checked}
          tabIndex={disabled ? -1 : 0}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            width: track.width,
            height: track.height,
            borderRadius: borderRadius.full,
            backgroundColor: trackBg,
            transition: transitions.normal,
            cursor: disabled ? 'not-allowed' : 'pointer',
            position: 'relative',
            opacity: disabled ? 0.5 : 1,
            outline: 'none',
          }}
          onFocus={e => {
            e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.focus}`
          }}
          onBlur={e => {
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div
            style={{
              width: thumb.size,
              height: thumb.size,
              borderRadius: borderRadius.full,
              backgroundColor: colors.white,
              position: 'absolute',
              top: '50%',
              left: thumbOffset,
              transform: 'translateY(-50%)',
              transition: transitions.normal,
              boxShadow: shadows.sm,
            }}
          />
        </div>
      </div>
      {(label || description) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {label && (
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: disabled ? colors.gray500 : colors.text.primary,
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
              onClick={disabled ? undefined : handleClick}
            >
              {label}
            </span>
          )}
          {description && (
            <span
              style={{
                fontSize: '0.75rem',
                color: colors.text.secondary,
              }}
            >
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
}

export default Toggle

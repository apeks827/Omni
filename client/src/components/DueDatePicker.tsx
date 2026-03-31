import React, { useState } from 'react'
import { colors, spacing, borderRadius } from '../design-system/tokens'

interface DueDatePickerProps {
  value: Date | null
  onChange: (date: Date | undefined) => void
}

const DueDatePicker: React.FC<DueDatePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const formatDateValue = (date: Date | null): string => {
    if (!date) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    if (e.target.value) {
      const date = new Date(e.target.value)
      onChange(date)
    }
  }

  const handleClear = () => {
    setInputValue('')
    onChange(undefined)
    setIsOpen(false)
  }

  const quickOptions = [
    {
      label: 'Today',
      getValue: () => {
        const d = new Date()
        d.setHours(12, 0, 0, 0)
        return d
      },
    },
    {
      label: 'Tomorrow',
      getValue: () => {
        const d = new Date()
        d.setDate(d.getDate() + 1)
        d.setHours(12, 0, 0, 0)
        return d
      },
    },
    {
      label: 'Next Week',
      getValue: () => {
        const d = new Date()
        d.setDate(d.getDate() + 7)
        d.setHours(12, 0, 0, 0)
        return d
      },
    },
  ]

  const containerStyles: React.CSSProperties = {
    position: 'relative',
  }

  const inputWrapperStyles: React.CSSProperties = {
    position: 'relative',
  }

  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: '8px',
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.border.default}`,
    fontSize: '14px',
    backgroundColor: colors.white,
    cursor: 'pointer',
  }

  const clearButtonStyles: React.CSSProperties = {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    color: colors.gray500,
    padding: '4px',
  }

  const dropdownStyles: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '4px',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    border: `1px solid ${colors.border.default}`,
    zIndex: 100,
    overflow: 'hidden',
  }

  const quickOptionStyles: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.md}`,
    cursor: 'pointer',
    borderBottom: `1px solid ${colors.border.subtle}`,
    fontSize: '14px',
    transition: 'background-color 0.15s',
  }

  return (
    <div style={containerStyles}>
      <div style={inputWrapperStyles}>
        <input
          type="datetime-local"
          value={inputValue || formatDateValue(value)}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          style={inputStyles}
          aria-label="Due date and time"
        />
        {(value || inputValue) && (
          <button
            onClick={handleClear}
            style={clearButtonStyles}
            aria-label="Clear due date"
            type="button"
          >
            ×
          </button>
        )}
      </div>

      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99,
            }}
            onClick={() => setIsOpen(false)}
          />
          <div style={dropdownStyles}>
            <div
              style={{
                padding: spacing.sm,
                borderBottom: `1px solid ${colors.border.subtle}`,
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  color: colors.gray600,
                  fontWeight: 500,
                }}
              >
                Quick select
              </span>
            </div>
            {quickOptions.map((option, index) => (
              <div
                key={index}
                style={quickOptionStyles}
                onClick={() => {
                  const date = option.getValue()
                  setInputValue(formatDateValue(date))
                  onChange(date)
                  setIsOpen(false)
                }}
                onMouseEnter={e => {
                  ;(e.currentTarget as HTMLElement).style.backgroundColor =
                    colors.gray100
                }}
                onMouseLeave={e => {
                  ;(e.currentTarget as HTMLElement).style.backgroundColor =
                    'transparent'
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default DueDatePicker

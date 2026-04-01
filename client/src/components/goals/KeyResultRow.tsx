import React, { useState } from 'react'
import { spacing } from '../../design-system/tokens'
import { Button } from '../../design-system'
import { ProgressBadge, ProgressBar } from './ProgressBadge'

interface KeyResult {
  id: string
  title: string
  target_value: number
  current_value: number
  measurement_type: 'numeric' | 'percentage' | 'boolean'
  unit?: string
  progress_percentage: number
}

interface KeyResultRowProps {
  keyResult: KeyResult
  onDelete: (id: string) => void
  onUpdateProgress: (id: string, current_value: number) => void
}

export const KeyResultRow: React.FC<KeyResultRowProps> = ({
  keyResult,
  onDelete,
  onUpdateProgress,
}) => {
  const [showProgressInput, setShowProgressInput] = useState(false)
  const [progressInput, setProgressInput] = useState(
    keyResult.current_value.toString()
  )

  const formatValue = (value: number, type: string, unit?: string) => {
    if (type === 'boolean') return value >= 1 ? 'Yes' : 'No'
    const unitStr = unit ? ` ${unit}` : ''
    return `${value}${unitStr}`
  }

  const handleProgressSave = () => {
    const value = parseFloat(progressInput) || 0
    onUpdateProgress(keyResult.id, value)
    setShowProgressInput(false)
  }

  return (
    <div
      style={{
        padding: spacing.md,
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 500 }}>{keyResult.title}</span>
          <div
            style={{
              fontSize: '14px',
              color: 'rgba(0, 0, 0, 0.6)',
              marginTop: spacing.xs,
            }}
          >
            {formatValue(
              keyResult.current_value,
              keyResult.measurement_type,
              keyResult.unit
            )}
            {' / '}
            {formatValue(
              keyResult.target_value,
              keyResult.measurement_type,
              keyResult.unit
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <ProgressBadge percentage={keyResult.progress_percentage} size="sm" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowProgressInput(!showProgressInput)}
          >
            Update
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(keyResult.id)}
          >
            Delete
          </Button>
        </div>
      </div>

      {showProgressInput && (
        <div
          style={{
            display: 'flex',
            gap: spacing.sm,
            alignItems: 'center',
            padding: spacing.sm,
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            borderRadius: '4px',
          }}
        >
          <input
            type="number"
            value={progressInput}
            onChange={e => setProgressInput(e.target.value)}
            style={{
              padding: spacing.sm,
              borderRadius: '4px',
              border: '1px solid #ccc',
              width: '100px',
            }}
            min={0}
          />
          <Button variant="primary" size="sm" onClick={handleProgressSave}>
            Save
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowProgressInput(false)}
          >
            Cancel
          </Button>
        </div>
      )}

      <ProgressBar percentage={keyResult.progress_percentage} height={4} />
    </div>
  )
}

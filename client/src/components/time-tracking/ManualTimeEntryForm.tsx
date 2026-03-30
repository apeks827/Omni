import React, { useState } from 'react'
import {
  colors,
  spacing,
  typography,
  borderRadius,
} from '../../design-system/tokens'
import Button from '../../design-system/components/Button'
import Card from '../../design-system/components/Card'
import Input from '../../design-system/components/Input'
import { DurationInput } from '../../design-system/components/DurationInput'

interface TimeEntry {
  id: string
  taskId: string
  taskTitle: string
  date: string
  duration: number
  description?: string
}

interface ManualTimeEntryFormProps {
  taskId?: string
  taskTitle?: string
  onSubmit: (entry: Omit<TimeEntry, 'id'>) => void
  onCancel?: () => void
}

const ManualTimeEntryForm: React.FC<ManualTimeEntryFormProps> = ({
  taskId,
  taskTitle,
  onSubmit,
  onCancel,
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [duration, setDuration] = useState(30)
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      taskId: taskId || '',
      taskTitle: taskTitle || '',
      date,
      duration,
      description: description || undefined,
    })
  }

  return (
    <Card padding="md" shadow="sm">
      <form onSubmit={handleSubmit}>
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}
        >
          <h4
            style={{
              margin: 0,
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold,
              color: colors.gray800,
            }}
          >
            Log Time Manually
          </h4>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: spacing.md,
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: typography.fontSize.sm,
                  fontWeight: 500,
                  color: colors.gray700,
                  marginBottom: spacing.xs,
                }}
              >
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: `1px solid ${colors.border.default}`,
                  borderRadius: borderRadius.md,
                  fontSize: typography.fontSize.md,
                  outline: 'none',
                  cursor: 'pointer',
                }}
                required
              />
            </div>

            <DurationInput
              value={duration}
              onChange={setDuration}
              min={5}
              max={480}
              step={5}
              label="Duration"
            />
          </div>

          <Input
            label="Description (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What did you work on?"
          />

          <div
            style={{
              display: 'flex',
              gap: spacing.sm,
              justifyContent: 'flex-end',
            }}
          >
            {onCancel && (
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button variant="primary" type="submit">
              Log Time
            </Button>
          </div>
        </div>
      </form>
    </Card>
  )
}

export default ManualTimeEntryForm

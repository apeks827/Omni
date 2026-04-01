import React, { useState } from 'react'
import {
  Routine,
  RoutineStep,
  CreateRoutineInput,
  TimeWindow,
} from '../../../../shared/types/habits'
import { Card, Button, Text } from '../../design-system'
import { spacing } from '../../design-system/tokens'

interface RoutineBuilderProps {
  routine?: Routine
  onSave: (data: CreateRoutineInput) => void
  onCancel: () => void
}

const RoutineBuilder: React.FC<RoutineBuilderProps> = ({
  routine,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(routine?.name || '')
  const [timeWindow, setTimeWindow] = useState<TimeWindow | undefined>(
    routine?.time_window
  )
  const [steps, setSteps] = useState<RoutineStep[]>(routine?.steps || [])

  const addStep = () => {
    setSteps([
      ...steps,
      {
        id: `temp-${Date.now()}`,
        routine_id: routine?.id || '',
        name: '',
        duration_minutes: 15,
        order_index: steps.length,
        created_at: new Date(),
      },
    ])
  }

  const updateStep = (
    index: number,
    field: keyof RoutineStep,
    value: string | number
  ) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setSteps(newSteps)
  }

  const removeStep = (index: number) => {
    setSteps(
      steps
        .filter((_, i) => i !== index)
        .map((step, i) => ({ ...step, order_index: i }))
    )
  }

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newSteps.length) return
    ;[newSteps[index], newSteps[targetIndex]] = [
      newSteps[targetIndex],
      newSteps[index],
    ]
    newSteps.forEach((step, i) => (step.order_index = i))
    setSteps(newSteps)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name,
      time_window: timeWindow,
      steps: steps.map(s => ({
        name: s.name,
        duration_minutes: s.duration_minutes,
      })),
    })
  }

  const totalDuration = steps.reduce(
    (sum, step) => sum + step.duration_minutes,
    0
  )

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}
    >
      <div>
        <label
          style={{
            display: 'block',
            marginBottom: spacing.xs,
            fontWeight: 600,
          }}
        >
          Routine Name
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          style={{
            width: '100%',
            padding: spacing.sm,
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        />
      </div>

      <div>
        <label
          style={{
            display: 'block',
            marginBottom: spacing.xs,
            fontWeight: 600,
          }}
        >
          Time Window
        </label>
        <select
          value={timeWindow || ''}
          onChange={e =>
            setTimeWindow((e.target.value as TimeWindow) || undefined)
          }
          style={{
            width: '100%',
            padding: spacing.sm,
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        >
          <option value="">Any time</option>
          <option value="morning">Morning</option>
          <option value="afternoon">Afternoon</option>
          <option value="evening">Evening</option>
        </select>
      </div>

      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.sm,
          }}
        >
          <label style={{ fontWeight: 600 }}>Steps ({steps.length})</label>
          <Text style={{ color: '#666', fontSize: '14px' }}>
            Total: {totalDuration} min
          </Text>
        </div>
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}
        >
          {steps.map((step, index) => (
            <Card key={step.id} padding="sm">
              <div
                style={{
                  display: 'flex',
                  gap: spacing.sm,
                  alignItems: 'center',
                }}
              >
                <span style={{ color: '#999', fontSize: '12px' }}>
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={step.name}
                  onChange={e => updateStep(index, 'name', e.target.value)}
                  placeholder="Step name"
                  required
                  style={{
                    flex: 1,
                    padding: spacing.xs,
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                  }}
                />
                <input
                  type="number"
                  value={step.duration_minutes}
                  onChange={e =>
                    updateStep(
                      index,
                      'duration_minutes',
                      parseInt(e.target.value)
                    )
                  }
                  min={1}
                  style={{
                    width: '80px',
                    padding: spacing.xs,
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                  }}
                />
                <span style={{ color: '#999', fontSize: '12px' }}>min</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => moveStep(index, 'up')}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => moveStep(index, 'down')}
                    disabled={index === steps.length - 1}
                  >
                    ↓
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    onClick={() => removeStep(index)}
                  >
                    ×
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={addStep}
          style={{ marginTop: spacing.sm }}
        >
          + Add Step
        </Button>
      </div>

      <div
        style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}
      >
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Save Routine
        </Button>
      </div>
    </form>
  )
}

export default RoutineBuilder

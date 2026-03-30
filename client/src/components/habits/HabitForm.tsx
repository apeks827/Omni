import React, { useState } from 'react'
import {
  CreateHabitInput,
  FrequencyType,
  EnergyLevel,
} from '../../../../shared/types/habits'
import { Button } from '../../design-system'
import { spacing } from '../../design-system/tokens'

interface HabitFormProps {
  initialData?: Partial<CreateHabitInput>
  onSubmit: (data: CreateHabitInput) => void
  onCancel: () => void
}

const HabitForm: React.FC<HabitFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<CreateHabitInput>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    frequency_type: initialData?.frequency_type || 'daily',
    frequency_value: initialData?.frequency_value || '',
    preferred_time_start: initialData?.preferred_time_start || '',
    preferred_time_end: initialData?.preferred_time_end || '',
    duration_minutes: initialData?.duration_minutes || 30,
    energy_level: initialData?.energy_level || 'medium',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

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
          Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
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
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={e =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
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
          Frequency
        </label>
        <select
          value={formData.frequency_type}
          onChange={e =>
            setFormData({
              ...formData,
              frequency_type: e.target.value as FrequencyType,
            })
          }
          style={{
            width: '100%',
            padding: spacing.sm,
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {formData.frequency_type === 'weekly' && (
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: spacing.xs,
              fontWeight: 600,
            }}
          >
            Days of Week
          </label>
          <input
            type="text"
            value={formData.frequency_value}
            onChange={e =>
              setFormData({ ...formData, frequency_value: e.target.value })
            }
            placeholder="e.g., Mon,Wed,Fri"
            style={{
              width: '100%',
              padding: spacing.sm,
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          />
        </div>
      )}

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
              marginBottom: spacing.xs,
              fontWeight: 600,
            }}
          >
            Start Time
          </label>
          <input
            type="time"
            value={formData.preferred_time_start}
            onChange={e =>
              setFormData({ ...formData, preferred_time_start: e.target.value })
            }
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
            End Time
          </label>
          <input
            type="time"
            value={formData.preferred_time_end}
            onChange={e =>
              setFormData({ ...formData, preferred_time_end: e.target.value })
            }
            style={{
              width: '100%',
              padding: spacing.sm,
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          />
        </div>
      </div>

      <div>
        <label
          style={{
            display: 'block',
            marginBottom: spacing.xs,
            fontWeight: 600,
          }}
        >
          Duration (minutes)
        </label>
        <input
          type="number"
          value={formData.duration_minutes}
          onChange={e =>
            setFormData({
              ...formData,
              duration_minutes: parseInt(e.target.value),
            })
          }
          min={1}
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
          Energy Level
        </label>
        <select
          value={formData.energy_level}
          onChange={e =>
            setFormData({
              ...formData,
              energy_level: e.target.value as EnergyLevel,
            })
          }
          style={{
            width: '100%',
            padding: spacing.sm,
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div
        style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}
      >
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Save Habit
        </Button>
      </div>
    </form>
  )
}

export default HabitForm

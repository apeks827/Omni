import React, { useState } from 'react'
import { Button } from '../../design-system'
import { spacing } from '../../design-system/tokens'

interface GoalFormData {
  title: string
  description: string
  status: 'draft' | 'active' | 'completed' | 'archived' | 'cancelled'
  timeframe_type: 'quarter' | 'year' | 'custom'
  start_date: string
  end_date: string
}

interface GoalFormProps {
  initialData?: Partial<GoalFormData>
  onSubmit: (data: GoalFormData) => void
  onCancel: () => void
  isLoading?: boolean
}

export const GoalForm: React.FC<GoalFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const today = new Date().toISOString().split('T')[0]
  const threeMonthsLater = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const [formData, setFormData] = useState<GoalFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    status: initialData?.status || 'draft',
    timeframe_type: initialData?.timeframe_type || 'quarter',
    start_date: initialData?.start_date || today,
    end_date: initialData?.end_date || threeMonthsLater,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const inputStyle = {
    width: '100%',
    padding: spacing.sm,
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '14px',
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
            fontSize: '14px',
          }}
        >
          Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
          required
          style={inputStyle}
          placeholder="Enter goal title"
        />
      </div>

      <div>
        <label
          style={{
            display: 'block',
            marginBottom: spacing.xs,
            fontWeight: 600,
            fontSize: '14px',
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
          style={{ ...inputStyle, resize: 'vertical' }}
          placeholder="Describe the goal"
        />
      </div>

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
              fontSize: '14px',
            }}
          >
            Status
          </label>
          <select
            value={formData.status}
            onChange={e =>
              setFormData({
                ...formData,
                status: e.target.value as GoalFormData['status'],
              })
            }
            style={inputStyle}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              marginBottom: spacing.xs,
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            Timeframe
          </label>
          <select
            value={formData.timeframe_type}
            onChange={e =>
              setFormData({
                ...formData,
                timeframe_type: e.target
                  .value as GoalFormData['timeframe_type'],
              })
            }
            style={inputStyle}
          >
            <option value="quarter">Quarter</option>
            <option value="year">Year</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>

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
              fontSize: '14px',
            }}
          >
            Start Date *
          </label>
          <input
            type="date"
            value={formData.start_date}
            onChange={e =>
              setFormData({ ...formData, start_date: e.target.value })
            }
            required
            style={inputStyle}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              marginBottom: spacing.xs,
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            End Date *
          </label>
          <input
            type="date"
            value={formData.end_date}
            onChange={e =>
              setFormData({ ...formData, end_date: e.target.value })
            }
            required
            style={inputStyle}
          />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: spacing.sm,
          marginTop: spacing.md,
        }}
      >
        <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading
            ? 'Saving...'
            : initialData?.title
              ? 'Update Goal'
              : 'Create Goal'}
        </Button>
      </div>
    </form>
  )
}

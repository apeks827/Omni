import React, { useState } from 'react'
import {
  spacing,
  borderRadius,
  typography,
  colors,
} from '../../design-system/tokens'

interface TaskContextEditorProps {
  preferredDevice?: string[]
  preferredTimeOfDay?: string[]
  contextTags?: string[]
  onSave: (data: {
    preferred_device?: string[]
    preferred_time_of_day?: string[]
    context_tags?: string[]
  }) => void
  onCancel: () => void
  compact?: boolean
}

const DEVICE_OPTIONS = [
  { value: 'desktop', label: 'Desktop', icon: '💻' },
  { value: 'mobile', label: 'Mobile', icon: '📱' },
  { value: 'tablet', label: 'Tablet', icon: '📲' },
]

const TIME_OPTIONS = [
  { value: 'morning', label: 'Morning (5am-12pm)', icon: '🌅' },
  { value: 'afternoon', label: 'Afternoon (12pm-5pm)', icon: '☀️' },
  { value: 'evening', label: 'Evening (5pm-9pm)', icon: '🌆' },
  { value: 'night', label: 'Night (9pm-5am)', icon: '🌙' },
]

const SUGGESTED_TAGS = [
  'computer work',
  'mobile-friendly',
  'quick task',
  'deep work',
  'meeting prep',
  'admin',
  'errands',
  'flexible',
]

const TaskContextEditor: React.FC<TaskContextEditorProps> = ({
  preferredDevice = [],
  preferredTimeOfDay = [],
  contextTags = [],
  onSave,
  onCancel,
  compact = false,
}) => {
  const [selectedDevices, setSelectedDevices] =
    useState<string[]>(preferredDevice)
  const [selectedTimes, setSelectedTimes] =
    useState<string[]>(preferredTimeOfDay)
  const [tags, setTags] = useState<string[]>(contextTags)
  const [newTag, setNewTag] = useState('')

  const toggleDevice = (device: string) => {
    setSelectedDevices(prev =>
      prev.includes(device) ? prev.filter(d => d !== device) : [...prev, device]
    )
  }

  const toggleTime = (time: string) => {
    setSelectedTimes(prev =>
      prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]
    )
  }

  const addTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim()
    if (normalizedTag && !tags.includes(normalizedTag)) {
      setTags(prev => [...prev, normalizedTag])
    }
    setNewTag('')
  }

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag))
  }

  const handleSave = () => {
    onSave({
      preferred_device: selectedDevices,
      preferred_time_of_day: selectedTimes,
      context_tags: tags,
    })
  }

  if (compact) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.sm,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
          {selectedDevices.map(device => {
            const option = DEVICE_OPTIONS.find(d => d.value === device)
            return (
              <button
                key={device}
                type="button"
                onClick={() => toggleDevice(device)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  padding: `${spacing.xs} ${spacing.sm}`,
                  backgroundColor: colors.primary,
                  color: colors.white,
                  border: 'none',
                  borderRadius: borderRadius.full,
                  fontSize: typography.fontSize.xs,
                  cursor: 'pointer',
                }}
              >
                <span>{option?.icon}</span>
                <span>{option?.label}</span>
                <span style={{ marginLeft: spacing.xs }}>×</span>
              </button>
            )
          })}
          {selectedTimes.map(time => {
            const option = TIME_OPTIONS.find(t => t.value === time)
            return (
              <button
                key={time}
                type="button"
                onClick={() => toggleTime(time)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  padding: `${spacing.xs} ${spacing.sm}`,
                  backgroundColor: colors.secondary,
                  color: colors.white,
                  border: 'none',
                  borderRadius: borderRadius.full,
                  fontSize: typography.fontSize.xs,
                  cursor: 'pointer',
                }}
              >
                <span>{option?.icon}</span>
                <span>{option?.label}</span>
                <span style={{ marginLeft: spacing.xs }}>×</span>
              </button>
            )
          })}
        </div>
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
            {tags.map(tag => (
              <span
                key={tag}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  padding: `${spacing.xs} ${spacing.sm}`,
                  backgroundColor: colors.gray200,
                  borderRadius: borderRadius.md,
                  fontSize: typography.fontSize.xs,
                }}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: typography.fontSize.sm,
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.lg,
        padding: spacing.md,
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        border: `1px solid ${colors.border.default}`,
      }}
    >
      <div>
        <label
          style={{
            display: 'block',
            marginBottom: spacing.sm,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
          }}
        >
          Preferred Device
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.sm }}>
          {DEVICE_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleDevice(option.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                padding: `${spacing.sm} ${spacing.md}`,
                backgroundColor: selectedDevices.includes(option.value)
                  ? colors.primary
                  : colors.gray200,
                color: selectedDevices.includes(option.value)
                  ? colors.white
                  : colors.text.primary,
                border: 'none',
                borderRadius: borderRadius.md,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
        <p
          style={{
            marginTop: spacing.xs,
            fontSize: typography.fontSize.xs,
            color: colors.gray600,
          }}
        >
          Leave empty for any device
        </p>
      </div>

      <div>
        <label
          style={{
            display: 'block',
            marginBottom: spacing.sm,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
          }}
        >
          Preferred Time of Day
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.sm }}>
          {TIME_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleTime(option.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                padding: `${spacing.sm} ${spacing.md}`,
                backgroundColor: selectedTimes.includes(option.value)
                  ? colors.secondary
                  : colors.gray200,
                color: selectedTimes.includes(option.value)
                  ? colors.white
                  : colors.text.primary,
                border: 'none',
                borderRadius: borderRadius.md,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
        <p
          style={{
            marginTop: spacing.xs,
            fontSize: typography.fontSize.xs,
            color: colors.gray600,
          }}
        >
          Leave empty for any time
        </p>
      </div>

      <div>
        <label
          style={{
            display: 'block',
            marginBottom: spacing.sm,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
          }}
        >
          Context Tags
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.sm }}>
          {SUGGESTED_TAGS.filter(tag => !tags.includes(tag)).map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              style={{
                padding: `${spacing.xs} ${spacing.sm}`,
                backgroundColor: colors.gray200,
                border: '1px dashed',
                borderColor: colors.gray400,
                borderRadius: borderRadius.md,
                fontSize: typography.fontSize.xs,
                cursor: 'pointer',
              }}
            >
              + {tag}
            </button>
          ))}
        </div>

        <div style={{ marginTop: spacing.sm }}>
          <input
            type="text"
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTag(newTag)
              }
            }}
            placeholder="Add custom tag..."
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              border: `1px solid ${colors.border.default}`,
              borderRadius: borderRadius.md,
              fontSize: typography.fontSize.sm,
              width: '100%',
              maxWidth: '200px',
            }}
          />
        </div>

        {tags.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: spacing.sm,
              marginTop: spacing.md,
            }}
          >
            {tags.map(tag => (
              <span
                key={tag}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  padding: `${spacing.xs} ${spacing.sm}`,
                  backgroundColor: colors.info,
                  color: colors.white,
                  borderRadius: borderRadius.md,
                  fontSize: typography.fontSize.sm,
                }}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.white,
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: typography.fontSize.md,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: spacing.sm,
          marginTop: spacing.md,
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: `${spacing.sm} ${spacing.md}`,
            backgroundColor: 'transparent',
            border: `1px solid ${colors.border.default}`,
            borderRadius: borderRadius.md,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          style={{
            padding: `${spacing.sm} ${spacing.md}`,
            backgroundColor: colors.primary,
            color: colors.white,
            border: 'none',
            borderRadius: borderRadius.md,
            cursor: 'pointer',
          }}
        >
          Save Context
        </button>
      </div>
    </div>
  )
}

export default TaskContextEditor

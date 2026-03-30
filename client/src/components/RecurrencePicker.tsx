import { useState } from 'react'
import { RecurrenceRule, RecurrenceFrequency, WeekDay } from '../types'
import { Input, Stack } from '../design-system'
import { colors, spacing } from '../design-system/tokens'

interface RecurrencePickerProps {
  value: RecurrenceRule | null
  onChange: (rule: RecurrenceRule | null) => void
}

const WEEKDAYS: { value: WeekDay; label: string }[] = [
  { value: 'sun', label: 'Sun' },
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
  { value: 'sat', label: 'Sat' },
]

export default function RecurrencePicker({
  value,
  onChange,
}: RecurrencePickerProps) {
  const [isEnabled, setIsEnabled] = useState(!!value)
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(
    value?.frequency || 'daily'
  )
  const [interval, setInterval] = useState(value?.interval || 1)
  const [daysOfWeek, setDaysOfWeek] = useState<WeekDay[]>(
    value?.days_of_week || []
  )
  const [endType, setEndType] = useState<'never' | 'count' | 'until'>(
    value?.end_type || 'never'
  )
  const [endCount, setEndCount] = useState(value?.end_count || 10)
  const [endDate, setEndDate] = useState(
    value?.end_date ? new Date(value.end_date).toISOString().split('T')[0] : ''
  )

  const handleToggle = () => {
    const newEnabled = !isEnabled
    setIsEnabled(newEnabled)
    if (!newEnabled) {
      onChange(null)
    } else {
      updateRule()
    }
  }

  const updateRule = () => {
    const rule: RecurrenceRule = {
      frequency,
      interval: frequency === 'custom' ? interval : undefined,
      days_of_week: frequency === 'weekly' ? daysOfWeek : undefined,
      end_type: endType,
      end_count: endType === 'count' ? endCount : undefined,
      end_date: endType === 'until' && endDate ? new Date(endDate) : undefined,
    }
    onChange(rule)
  }

  const handleFrequencyChange = (newFrequency: RecurrenceFrequency) => {
    setFrequency(newFrequency)
    if (newFrequency === 'weekly' && daysOfWeek.length === 0) {
      setDaysOfWeek(['mon'])
    }
  }

  const toggleWeekday = (day: WeekDay) => {
    const newDays = daysOfWeek.includes(day)
      ? daysOfWeek.filter(d => d !== day)
      : [...daysOfWeek, day]
    setDaysOfWeek(newDays)
  }

  return (
    <div
      style={{
        padding: spacing.md,
        border: `1px solid ${colors.gray300}`,
        borderRadius: '8px',
        backgroundColor: colors.white,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.md,
        }}
      >
        <input
          type="checkbox"
          checked={isEnabled}
          onChange={handleToggle}
          style={{ cursor: 'pointer' }}
        />
        <label style={{ fontWeight: 600, cursor: 'pointer' }}>
          Repeat this task
        </label>
      </div>

      {isEnabled && (
        <Stack direction="vertical" spacing="md">
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: spacing.xs,
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Frequency
            </label>
            <select
              value={frequency}
              onChange={e => {
                handleFrequencyChange(e.target.value as RecurrenceFrequency)
                setTimeout(updateRule, 0)
              }}
              style={{
                width: '100%',
                padding: spacing.sm,
                border: `1px solid ${colors.gray300}`,
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {frequency === 'custom' && (
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: spacing.xs,
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Repeat every
              </label>
              <div style={{ display: 'flex', gap: spacing.sm }}>
                <Input
                  type="number"
                  min="1"
                  value={interval}
                  onChange={e => {
                    setInterval(Number(e.target.value))
                    setTimeout(updateRule, 0)
                  }}
                  style={{ width: '80px' }}
                />
                <span style={{ alignSelf: 'center' }}>days</span>
              </div>
            </div>
          )}

          {frequency === 'weekly' && (
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: spacing.xs,
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Repeat on
              </label>
              <div
                style={{ display: 'flex', gap: spacing.xs, flexWrap: 'wrap' }}
              >
                {WEEKDAYS.map(day => {
                  const isSelected = daysOfWeek.includes(day.value)
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => {
                        toggleWeekday(day.value)
                        setTimeout(updateRule, 0)
                      }}
                      style={{
                        padding: `${spacing.xs} ${spacing.sm}`,
                        border: `1px solid ${colors.gray300}`,
                        borderRadius: '4px',
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.white,
                        color: isSelected ? colors.white : colors.dark,
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                      }}
                    >
                      {day.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: spacing.xs,
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Ends
            </label>
            <select
              value={endType}
              onChange={e => {
                setEndType(e.target.value as 'never' | 'count' | 'until')
                setTimeout(updateRule, 0)
              }}
              style={{
                width: '100%',
                padding: spacing.sm,
                border: `1px solid ${colors.gray300}`,
                borderRadius: '4px',
                fontSize: '14px',
                marginBottom: spacing.sm,
              }}
            >
              <option value="never">Never</option>
              <option value="count">After number of occurrences</option>
              <option value="until">On date</option>
            </select>

            {endType === 'count' && (
              <div style={{ display: 'flex', gap: spacing.sm }}>
                <Input
                  type="number"
                  min="1"
                  value={endCount}
                  onChange={e => {
                    setEndCount(Number(e.target.value))
                    setTimeout(updateRule, 0)
                  }}
                  style={{ width: '100px' }}
                />
                <span style={{ alignSelf: 'center' }}>occurrences</span>
              </div>
            )}

            {endType === 'until' && (
              <Input
                type="date"
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value)
                  setTimeout(updateRule, 0)
                }}
              />
            )}
          </div>

          <div
            style={{
              padding: spacing.sm,
              backgroundColor: colors.gray100,
              borderRadius: '4px',
              fontSize: '14px',
              color: colors.gray700,
            }}
          >
            {getSummary()}
          </div>
        </Stack>
      )}
    </div>
  )

  function getSummary(): string {
    if (!isEnabled) return ''

    let summary = 'Repeats '

    if (frequency === 'daily') {
      summary += 'every day'
    } else if (frequency === 'weekly') {
      if (daysOfWeek.length === 0) {
        summary += 'weekly (select days)'
      } else {
        const dayLabels = daysOfWeek
          .map(d => WEEKDAYS.find(wd => wd.value === d)?.label)
          .join(', ')
        summary += `every ${dayLabels}`
      }
    } else if (frequency === 'monthly') {
      summary += 'every month'
    } else if (frequency === 'custom') {
      summary += `every ${interval} day${interval > 1 ? 's' : ''}`
    }

    if (endType === 'count') {
      summary += `, ${endCount} times`
    } else if (endType === 'until' && endDate) {
      summary += `, until ${new Date(endDate).toLocaleDateString()}`
    }

    return summary
  }
}

import React, { useState } from 'react'
import {
  colors,
  spacing,
  typography,
  borderRadius,
} from '../../design-system/tokens'
import Button from '../../design-system/components/Button'
import Card from '../../design-system/components/Card'

interface TimeExportProps {
  logs: {
    date: string
    taskTitle: string
    duration: number
    description?: string
  }[]
  onExport: (format: 'csv' | 'json' | 'pdf') => void
}

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) {
    return `${mins}m`
  }
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

const TimeExport: React.FC<TimeExportProps> = ({ logs, onExport }) => {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'custom'>(
    'week'
  )
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>(
    'csv'
  )

  const getTotalDuration = (): number => {
    return logs.reduce((sum, log) => sum + log.duration, 0)
  }

  const handleExport = () => {
    onExport(exportFormat)
  }

  return (
    <Card padding="md" shadow="sm">
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}
      >
        <h4
          style={{
            margin: 0,
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: colors.gray800,
          }}
        >
          Export Time Data
        </h4>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
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
              Date Range
            </label>
            <div
              style={{
                display: 'flex',
                gap: spacing.sm,
              }}
            >
              {(['week', 'month', 'custom'] as const).map(range => (
                <Button
                  key={range}
                  variant={dateRange === range ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange(range)}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {dateRange === 'custom' && (
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
                    color: colors.gray600,
                    marginBottom: spacing.xs,
                  }}
                >
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    border: `1px solid ${colors.border.default}`,
                    borderRadius: borderRadius.md,
                    fontSize: typography.fontSize.md,
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: typography.fontSize.sm,
                    color: colors.gray600,
                    marginBottom: spacing.xs,
                  }}
                >
                  End Date
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    border: `1px solid ${colors.border.default}`,
                    borderRadius: borderRadius.md,
                    fontSize: typography.fontSize.md,
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

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
              Export Format
            </label>
            <div
              style={{
                display: 'flex',
                gap: spacing.sm,
              }}
            >
              {(['csv', 'json', 'pdf'] as const).map(format => (
                <Button
                  key={format}
                  variant={exportFormat === format ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setExportFormat(format)}
                >
                  {format.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: spacing.md,
            backgroundColor: colors.gray100,
            borderRadius: borderRadius.md,
          }}
        >
          <div>
            <span
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.gray600,
              }}
            >
              {logs.length} time entries
            </span>
            <span
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.gray600,
                marginLeft: spacing.md,
              }}
            >
              Total: {formatDuration(getTotalDuration())}
            </span>
          </div>
          <Button variant="primary" onClick={handleExport}>
            Export
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default TimeExport

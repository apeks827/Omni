import React, { useMemo } from 'react'
import {
  colors,
  spacing,
  typography,
  borderRadius,
} from '../../design-system/tokens'
import Button from '../../design-system/components/Button'
import Card from '../../design-system/components/Card'
import Badge from '../../design-system/components/Badge'

interface TimeLog {
  id: string
  taskId: string
  taskTitle: string
  date: string
  duration: number
  description?: string
  type: 'tracked' | 'manual'
}

interface TimeLogListProps {
  logs: TimeLog[]
  onEdit: (log: TimeLog) => void
  onDelete: (logId: string) => void
  onAddManual?: () => void
}

const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (dateStr === today.toISOString().split('T')[0]) {
    return 'Today'
  } else if (dateStr === yesterday.toISOString().split('T')[0]) {
    return 'Yesterday'
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

const groupByDate = (logs: TimeLog[]): Record<string, TimeLog[]> => {
  return logs.reduce(
    (acc, log) => {
      const date = log.date
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(log)
      return acc
    },
    {} as Record<string, TimeLog[]>
  )
}

const sanitizeText = (text: string): string => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

const TimeLogList: React.FC<TimeLogListProps> = ({
  logs,
  onEdit,
  onDelete,
  onAddManual,
}) => {
  const groupedLogs = useMemo(() => groupByDate(logs), [logs])

  const getTotalForDate = (dateLogs: TimeLog[]): number => {
    return dateLogs.reduce((sum, log) => sum + log.duration, 0)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: colors.gray800,
          }}
        >
          Time Log History
        </h3>
        {onAddManual && (
          <Button variant="outline" size="sm" onClick={onAddManual}>
            + Add Manual Entry
          </Button>
        )}
      </div>

      {logs.length === 0 ? (
        <Card padding="lg" shadow="sm">
          <div
            style={{
              textAlign: 'center',
              color: colors.gray500,
              padding: spacing.xl,
            }}
          >
            <p style={{ margin: 0 }}>No time logged yet</p>
            <p
              style={{
                fontSize: typography.fontSize.sm,
                marginTop: spacing.sm,
              }}
            >
              Start tracking time to see your logs here
            </p>
          </div>
        </Card>
      ) : (
        Object.entries(groupedLogs)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([date, dateLogs]) => (
            <Card key={date} padding="md" shadow="sm">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: spacing.md,
                  paddingBottom: spacing.sm,
                  borderBottom: `1px solid ${colors.gray200}`,
                }}
              >
                <span
                  style={{
                    fontSize: typography.fontSize.md,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.gray700,
                  }}
                >
                  {formatDate(date)}
                </span>
                <span
                  style={{
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.primary,
                  }}
                >
                  {formatDuration(getTotalForDate(dateLogs))}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing.sm,
                }}
              >
                {dateLogs.map(log => (
                  <div
                    key={log.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: spacing.md,
                      padding: spacing.sm,
                      backgroundColor: colors.gray100,
                      borderRadius: borderRadius.md,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.sm,
                          marginBottom: spacing.xs,
                        }}
                      >
                        <span
                          style={{
                            fontSize: typography.fontSize.md,
                            fontWeight: 500,
                            color: colors.gray800,
                          }}
                        >
                          {log.taskTitle}
                        </span>
                        <Badge
                          variant={
                            log.type === 'tracked' ? 'primary' : 'secondary'
                          }
                          size="sm"
                        >
                          {log.type}
                        </Badge>
                      </div>
                      {log.description && (
                        <p
                          style={{
                            margin: 0,
                            fontSize: typography.fontSize.sm,
                            color: colors.gray600,
                          }}
                        >
                          {sanitizeText(log.description)}
                        </p>
                      )}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.sm,
                      }}
                    >
                      <span
                        style={{
                          fontSize: typography.fontSize.md,
                          fontWeight: typography.fontWeight.medium,
                          color: colors.gray700,
                          fontFamily: 'monospace',
                        }}
                      >
                        {formatDuration(log.duration)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(log)}
                        style={{ padding: spacing.xs }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(log.id)}
                        style={{ padding: spacing.xs, color: colors.danger }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))
      )}
    </div>
  )
}

export default TimeLogList

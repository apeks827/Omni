import React, { useState } from 'react'
import {
  colors,
  spacing,
  typography,
  borderRadius,
} from '../../design-system/tokens'
import Card from '../../design-system/components/Card'
import Button from '../../design-system/components/Button'

interface TimeAnalyticsProps {
  totalToday: number
  totalThisWeek: number
  totalThisMonth: number
  dailyData: { date: string; minutes: number }[]
  taskBreakdown: { taskTitle: string; minutes: number; percentage: number }[]
}

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) {
    return `${mins}m`
  }
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

const TimeAnalytics: React.FC<TimeAnalyticsProps> = ({
  totalToday,
  totalThisWeek,
  totalThisMonth,
  dailyData,
  taskBreakdown,
}) => {
  const [view, setView] = useState<'today' | 'week' | 'month'>('week')

  const getMaxMinutes = (): number => {
    if (dailyData.length === 0) return 60
    return Math.max(...dailyData.map(d => d.minutes), 60)
  }

  const chartHeight = 120
  const maxMinutes = getMaxMinutes()

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
          Time Analytics
        </h3>
        <div
          style={{
            display: 'flex',
            gap: spacing.xs,
            backgroundColor: colors.gray100,
            padding: spacing.xs,
            borderRadius: borderRadius.md,
          }}
        >
          {(['today', 'week', 'month'] as const).map(period => (
            <Button
              key={period}
              variant={view === period ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setView(period)}
              style={{
                padding: `${spacing.xs} ${spacing.sm}`,
                fontSize: typography.fontSize.xs,
              }}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: spacing.md,
        }}
      >
        <Card padding="md" shadow="sm">
          <div style={{ textAlign: 'center' }}>
            <span
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.gray500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Today
            </span>
            <div
              style={{
                fontSize: typography.fontSize.xxl,
                fontWeight: typography.fontWeight.bold,
                color: colors.primary,
                marginTop: spacing.xs,
              }}
            >
              {formatDuration(totalToday)}
            </div>
          </div>
        </Card>

        <Card padding="md" shadow="sm">
          <div style={{ textAlign: 'center' }}>
            <span
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.gray500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              This Week
            </span>
            <div
              style={{
                fontSize: typography.fontSize.xxl,
                fontWeight: typography.fontWeight.bold,
                color: colors.success,
                marginTop: spacing.xs,
              }}
            >
              {formatDuration(totalThisWeek)}
            </div>
          </div>
        </Card>

        <Card padding="md" shadow="sm">
          <div style={{ textAlign: 'center' }}>
            <span
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.gray500,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              This Month
            </span>
            <div
              style={{
                fontSize: typography.fontSize.xxl,
                fontWeight: typography.fontWeight.bold,
                color: colors.info,
                marginTop: spacing.xs,
              }}
            >
              {formatDuration(totalThisMonth)}
            </div>
          </div>
        </Card>
      </div>

      <Card padding="md" shadow="sm">
        <h4
          style={{
            margin: `0 0 ${spacing.md} 0`,
            fontSize: typography.fontSize.md,
            fontWeight: typography.fontWeight.semibold,
            color: colors.gray700,
          }}
        >
          Daily Activity
        </h4>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: spacing.xs,
            height: `${chartHeight}px`,
            paddingTop: spacing.md,
          }}
        >
          {dailyData.slice(-7).map((day, index) => {
            const heightPercent = (day.minutes / maxMinutes) * 100
            return (
              <div
                key={day.date}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: spacing.xs,
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: `${Math.max(heightPercent, 4)}px`,
                    backgroundColor:
                      index === dailyData.slice(-7).length - 1
                        ? colors.primary
                        : colors.gray300,
                    borderRadius: borderRadius.sm,
                    transition: 'height 0.3s ease',
                  }}
                  title={`${day.date}: ${formatDuration(day.minutes)}`}
                />
                <span
                  style={{
                    fontSize: typography.fontSize.xs,
                    color: colors.gray500,
                  }}
                >
                  {new Date(day.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                  })}
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      <Card padding="md" shadow="sm">
        <h4
          style={{
            margin: `0 0 ${spacing.md} 0`,
            fontSize: typography.fontSize.md,
            fontWeight: typography.fontWeight.semibold,
            color: colors.gray700,
          }}
        >
          Time by Task
        </h4>
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}
        >
          {taskBreakdown.length === 0 ? (
            <p
              style={{
                margin: 0,
                fontSize: typography.fontSize.sm,
                color: colors.gray500,
                textAlign: 'center',
                padding: spacing.md,
              }}
            >
              No data available
            </p>
          ) : (
            taskBreakdown.map((task, index) => (
              <div key={index}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: spacing.xs,
                  }}
                >
                  <span
                    style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.gray700,
                    }}
                  >
                    {task.taskTitle}
                  </span>
                  <span
                    style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.gray600,
                      fontFamily: 'monospace',
                    }}
                  >
                    {formatDuration(task.minutes)} ({task.percentage}%)
                  </span>
                </div>
                <div
                  style={{
                    height: '8px',
                    backgroundColor: colors.gray200,
                    borderRadius: borderRadius.full,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${task.percentage}%`,
                      backgroundColor: [
                        colors.primary,
                        colors.success,
                        colors.warning,
                        colors.info,
                        colors.secondary,
                      ][index % 5],
                      borderRadius: borderRadius.full,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}

export default TimeAnalytics

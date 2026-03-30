import React, { useEffect, useState } from 'react'
import { Text, Card, colors, spacing } from '../design-system'
import { apiClient } from '../services/api'

interface AnalyticsData {
  tasksCompleted: number
  completionRate: number
  avgTimePerTask: number
  productivityTrends: {
    daily: Array<{ date: string; completed: number }>
    weekly: Array<{ week: string; completed: number }>
    monthly: Array<{ month: string; completed: number }>
  }
  taskDistribution: {
    byProject: Array<{ project: string; count: number }>
    byPriority: Array<{ priority: string; count: number }>
    byStatus: Array<{ status: string; count: number }>
  }
  timePatterns: {
    hourly: Array<{ hour: number; completed: number }>
    bestHours: number[]
  }
  streakData: {
    currentStreak: number
    longestStreak: number
    productiveDays: number
  }
  insights: Array<{
    type: 'success' | 'warning' | 'info'
    message: string
  }>
}

const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week')

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const analyticsData = await apiClient.getAnalytics(timeRange)
        setData(analyticsData)
        setError(null)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load analytics'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [timeRange])

  if (loading && !data) {
    return (
      <div style={{ padding: spacing.xl, textAlign: 'center' }}>
        <Text variant="body">Loading analytics...</Text>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: spacing.xl, textAlign: 'center' }}>
        <Text variant="body" style={{ color: colors.danger }}>
          {error}
        </Text>
      </div>
    )
  }

  if (!data) return null

  return (
    <div style={{ padding: spacing.xl }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.lg,
        }}
      >
        <Text variant="h2">Analytics & Insights</Text>
        <div style={{ display: 'flex', gap: spacing.sm }}>
          <button
            onClick={() => setTimeRange('week')}
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              backgroundColor:
                timeRange === 'week' ? colors.primary : colors.gray200,
              color: timeRange === 'week' ? colors.white : colors.gray700,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              backgroundColor:
                timeRange === 'month' ? colors.primary : colors.gray200,
              color: timeRange === 'month' ? colors.white : colors.gray700,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Month
          </button>
          <button
            onClick={() => setTimeRange('all')}
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              backgroundColor:
                timeRange === 'all' ? colors.primary : colors.gray200,
              color: timeRange === 'all' ? colors.white : colors.gray700,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            All Time
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: spacing.lg,
          marginBottom: spacing.xl,
        }}
      >
        <MetricCard
          title="Tasks Completed"
          value={data.tasksCompleted}
          subtitle={`${data.completionRate}% completion rate`}
        />
        <MetricCard
          title="Avg Time Per Task"
          value={`${data.avgTimePerTask}m`}
          subtitle="Average completion time"
        />
        <MetricCard
          title="Current Streak"
          value={data.streakData.currentStreak}
          subtitle={`Longest: ${data.streakData.longestStreak} days`}
        />
        <MetricCard
          title="Productive Days"
          value={data.streakData.productiveDays}
          subtitle="Days with completed tasks"
        />
      </div>

      {data.insights.length > 0 && (
        <Card style={{ marginBottom: spacing.lg, padding: spacing.lg }}>
          <Text variant="h3" style={{ marginBottom: spacing.md }}>
            Personalized Insights
          </Text>
          {data.insights.map((insight, idx) => (
            <div
              key={idx}
              style={{
                padding: spacing.md,
                marginBottom: spacing.sm,
                backgroundColor:
                  insight.type === 'success'
                    ? colors.success + '20'
                    : insight.type === 'warning'
                      ? colors.warning + '20'
                      : colors.info + '20',
                borderRadius: '4px',
                borderLeft: `4px solid ${
                  insight.type === 'success'
                    ? colors.success
                    : insight.type === 'warning'
                      ? colors.warning
                      : colors.info
                }`,
              }}
            >
              <Text variant="body">{insight.message}</Text>
            </div>
          ))}
        </Card>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: spacing.lg,
        }}
      >
        <Card style={{ padding: spacing.lg }}>
          <Text variant="h3" style={{ marginBottom: spacing.md }}>
            Task Distribution by Priority
          </Text>
          {data.taskDistribution.byPriority.map(item => (
            <div
              key={item.priority}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: `${spacing.sm} 0`,
                borderBottom: `1px solid ${colors.border.subtle}`,
              }}
            >
              <Text variant="body">{item.priority}</Text>
              <Text variant="body" style={{ fontWeight: 600 }}>
                {item.count}
              </Text>
            </div>
          ))}
        </Card>

        <Card style={{ padding: spacing.lg }}>
          <Text variant="h3" style={{ marginBottom: spacing.md }}>
            Best Productivity Hours
          </Text>
          <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
            {data.timePatterns.bestHours.map(hour => (
              <div
                key={hour}
                style={{
                  padding: spacing.sm,
                  backgroundColor: colors.primary + '20',
                  borderRadius: '4px',
                  border: `1px solid ${colors.primary}`,
                }}
              >
                <Text variant="body" style={{ fontWeight: 600 }}>
                  {hour}:00
                </Text>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  subtitle: string
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle }) => (
  <Card style={{ padding: spacing.lg }}>
    <Text variant="body" color="gray600" style={{ marginBottom: spacing.xs }}>
      {title}
    </Text>
    <Text
      variant="h1"
      style={{
        fontSize: '2.5rem',
        marginBottom: spacing.xs,
        color: colors.primary,
      }}
    >
      {value}
    </Text>
    <Text variant="caption" style={{ color: colors.gray500 }}>
      {subtitle}
    </Text>
  </Card>
)

export default Analytics

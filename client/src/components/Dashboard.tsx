import React, { useEffect, useState } from 'react'
import { apiClient } from '../services/api'
import { DashboardData } from '../types'
import { Text, colors, spacing } from '../design-system'

const COMPANY_ID = 'c7ecff56-aed4-4103-bb75-af2b584b06a4'

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        const dashboardData = await apiClient.getDashboard(COMPANY_ID)
        setData(dashboardData)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
    const interval = setInterval(fetchDashboard, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !data) {
    return (
      <div style={{ padding: spacing.xl, textAlign: 'center' }}>
        <Text variant="body">Loading dashboard...</Text>
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

  const errorRate = data.agents.active > 0 
    ? ((data.agents.error / data.agents.active) * 100).toFixed(1)
    : '0.0'

  return (
    <div style={{ padding: spacing.xl }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: spacing.lg,
        marginBottom: spacing.xl
      }}>
        <MetricCard
          title="Agent Error State"
          value={data.agents.error}
          subtitle={`${errorRate}% of active agents`}
          trend={data.agents.error > 0 ? 'critical' : 'healthy'}
        />
        <MetricCard
          title="Running Agents"
          value={data.agents.running}
          subtitle={`${data.agents.active} total active`}
          trend="neutral"
        />
        <MetricCard
          title="Tasks In Progress"
          value={data.tasks.inProgress}
          subtitle={`${data.tasks.blocked} blocked`}
          trend={data.tasks.blocked > 0 ? 'warning' : 'neutral'}
        />
        <MetricCard
          title="Completed Tasks"
          value={data.tasks.done}
          subtitle={`${data.tasks.open} open`}
          trend="neutral"
        />
      </div>

      {data.agents.error > 0 && (
        <div style={{
          backgroundColor: colors.light,
          border: `2px solid ${colors.danger}`,
          borderRadius: '8px',
          padding: spacing.lg,
          marginBottom: spacing.lg
        }}>
          <Text variant="h3" style={{ marginBottom: spacing.sm, color: colors.danger }}>
            Error State Alert
          </Text>
          <Text variant="body" style={{ color: colors.danger }}>
            {data.agents.error} agent{data.agents.error !== 1 ? 's are' : ' is'} currently in error state. 
            This may impact task completion and delivery metrics.
          </Text>
        </div>
      )}

      <div style={{
        backgroundColor: colors.bg.subtle,
        borderRadius: '8px',
        padding: spacing.lg,
        border: `1px solid ${colors.border.subtle}`
      }}>
        <Text variant="h3" style={{ marginBottom: spacing.md }}>
          System Overview
        </Text>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
          <StatRow label="Active Agents" value={data.agents.active} />
          <StatRow label="Paused Agents" value={data.agents.paused} />
          <StatRow label="Open Tasks" value={data.tasks.open} />
          <StatRow label="Blocked Tasks" value={data.tasks.blocked} />
          <StatRow label="Pending Approvals" value={data.pendingApprovals} />
          <StatRow label="Active Incidents" value={data.budgets.activeIncidents} />
        </div>
      </div>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: number
  subtitle: string
  trend: 'healthy' | 'warning' | 'critical' | 'neutral'
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, trend }) => {
  const trendColors = {
    healthy: colors.success,
    warning: colors.warning,
    critical: colors.danger,
    neutral: colors.gray500
  }

  return (
    <div style={{
      backgroundColor: colors.white,
      border: `1px solid ${colors.border.subtle}`,
      borderRadius: '8px',
      padding: spacing.lg,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <Text variant="body" color="gray600" style={{ marginBottom: spacing.xs }}>
        {title}
      </Text>
      <Text variant="h1" style={{ 
        fontSize: '2.5rem', 
        marginBottom: spacing.xs,
        color: trendColors[trend]
      }}>
        {value}
      </Text>
      <Text variant="caption" style={{ color: colors.gray500 }}>
        {subtitle}
      </Text>
    </div>
  )
}

interface StatRowProps {
  label: string
  value: number
}

const StatRow: React.FC<StatRowProps> = ({ label, value }) => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'space-between',
    padding: `${spacing.sm} 0`,
    borderBottom: `1px solid ${colors.border.subtle}`
  }}>
    <Text variant="body" color="gray700">{label}</Text>
    <Text variant="body" style={{ fontWeight: 600 }}>{value}</Text>
  </div>
)

export default Dashboard

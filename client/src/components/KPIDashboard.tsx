import React, { useEffect, useState } from 'react'
import { Text, colors, spacing } from '../design-system'

interface KPIData {
  velocity: { current: number; target: number; status: string }
  fluidity: { current: number; target: number; status: string }
  quality: { current: number; target: number; status: string }
  proactivity: { current: number; target: number; status: string }
}

const KPIDashboard: React.FC = () => {
  const [kpis, setKpis] = useState<KPIData | null>(null)
  const [period, setPeriod] = useState('7d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/metrics/kpi?period=${period}`)
        const data = await response.json()
        setKpis(data)
      } catch (error) {
        console.error('Failed to fetch KPIs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchKPIs()
    const interval = setInterval(fetchKPIs, 60000)
    return () => clearInterval(interval)
  }, [period])

  if (loading && !kpis) {
    return (
      <div style={{ padding: spacing.xl }}>
        <Text variant="body">Loading KPIs...</Text>
      </div>
    )
  }

  if (!kpis) return null

  const statusColors = {
    healthy: colors.success,
    warning: colors.warning,
    critical: colors.danger,
  }

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
        <Text variant="h2">KPI Dashboard</Text>
        <select
          value={period}
          onChange={e => setPeriod(e.target.value)}
          style={{
            padding: `${spacing.sm} ${spacing.md}`,
            borderRadius: '4px',
            border: `1px solid ${colors.border.subtle}`,
          }}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: spacing.lg,
        }}
      >
        <KPICard
          title="Velocity (Speed)"
          current={kpis.velocity.current}
          target={kpis.velocity.target}
          unit="hours"
          status={kpis.velocity.status}
          statusColors={statusColors}
          description="Avg lead time: in_progress → done"
        />
        <KPICard
          title="Fluidity (Handoff)"
          current={kpis.fluidity.current}
          target={kpis.fluidity.target}
          unit="hours"
          status={kpis.fluidity.status}
          statusColors={statusColors}
          description="Avg handoff latency"
        />
        <KPICard
          title="Quality Rate"
          current={kpis.quality.current}
          target={kpis.quality.target}
          unit="%"
          status={kpis.quality.status}
          statusColors={statusColors}
          description="Tasks passing review"
        />
        <KPICard
          title="Proactivity Index"
          current={kpis.proactivity.current}
          target={kpis.proactivity.target}
          unit="%"
          status={kpis.proactivity.status}
          statusColors={statusColors}
          description="Self-initiated work"
        />
      </div>
    </div>
  )
}

interface KPICardProps {
  title: string
  current: number
  target: number
  unit: string
  status: string
  statusColors: Record<string, string>
  description: string
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  current,
  target,
  unit,
  status,
  statusColors,
  description,
}) => {
  const statusColor = statusColors[status] || colors.gray500

  return (
    <div
      style={{
        backgroundColor: colors.white,
        border: `2px solid ${statusColor}`,
        borderRadius: '8px',
        padding: spacing.lg,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <Text
        variant="body"
        style={{ marginBottom: spacing.xs, fontWeight: 600 }}
      >
        {title}
      </Text>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: spacing.xs,
          marginBottom: spacing.sm,
        }}
      >
        <Text variant="h1" style={{ fontSize: '2rem', color: statusColor }}>
          {current.toFixed(1)}
        </Text>
        <Text variant="body" style={{ color: colors.gray500 }}>
          {unit}
        </Text>
      </div>
      <Text
        variant="caption"
        style={{ color: colors.gray600, marginBottom: spacing.xs }}
      >
        Target: {target}
        {unit}
      </Text>
      <Text variant="caption" style={{ color: colors.gray500 }}>
        {description}
      </Text>
    </div>
  )
}

export default KPIDashboard

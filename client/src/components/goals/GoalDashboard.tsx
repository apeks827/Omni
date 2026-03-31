import React, { useEffect, useState, useMemo } from 'react'
import { apiClient } from '../../services/api'
import { Button, Stack, Text } from '../../design-system'
import { spacing, colors } from '../../design-system/tokens'
import { GoalCard, Goal } from './GoalCard'

type LevelFilter = 'all' | 'quarter' | 'year' | 'custom'
type StatusFilter = 'all' | 'active' | 'draft'
type SortOption = 'progress' | 'due_date' | 'title'

interface GoalDashboardProps {
  onSelectGoal: (goalId: string) => void
  onCreateGoal: () => void
}

export const GoalDashboard: React.FC<GoalDashboardProps> = ({
  onSelectGoal,
  onCreateGoal,
}) => {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('progress')

  useEffect(() => {
    loadGoals()
  }, [])

  const loadGoals = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.getGoals()
      setGoals(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goals')
      console.error('Failed to load goals:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedGoals = useMemo(() => {
    let filtered = goals

    if (statusFilter !== 'all') {
      filtered = filtered.filter(goal => goal.status === statusFilter)
    }

    if (levelFilter !== 'all') {
      filtered = filtered.filter(goal => {
        return goal.timeframe_type === levelFilter
      })
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'progress':
          return b.progress_percentage - a.progress_percentage
        case 'due_date':
          return new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
        case 'title':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

    return sorted
  }, [goals, levelFilter, statusFilter, sortBy])

  const handleRefresh = () => {
    loadGoals()
  }

  if (loading) {
    return (
      <div
        style={{
          padding: spacing.xl,
          textAlign: 'center',
        }}
      >
        <Text variant="body">Loading goals...</Text>
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          padding: spacing.xl,
          textAlign: 'center',
        }}
      >
        <Text variant="body" style={{ color: colors.danger }}>
          {error}
        </Text>
        <Button
          variant="primary"
          onClick={handleRefresh}
          style={{ marginTop: spacing.md }}
        >
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div style={{ padding: spacing.lg }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.lg,
        }}
      >
        <Text variant="h3">Goals Dashboard</Text>
        <Stack direction="horizontal" spacing="sm">
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            Refresh
          </Button>
          <Button variant="primary" onClick={onCreateGoal}>
            + New Goal
          </Button>
        </Stack>
      </div>

      <div
        style={{
          display: 'flex',
          gap: spacing.lg,
          marginBottom: spacing.lg,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <Text variant="caption" style={{ color: colors.gray500 }}>
            Level
          </Text>
          <Stack
            direction="horizontal"
            spacing="xs"
            style={{ marginTop: spacing.xs }}
          >
            {(['all', 'quarter', 'year', 'custom'] as LevelFilter[]).map(
              level => (
                <button
                  key={level}
                  onClick={() => setLevelFilter(level)}
                  style={{
                    padding: `${spacing.xs} ${spacing.sm}`,
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor:
                      levelFilter === level ? colors.primary : colors.gray100,
                    color:
                      levelFilter === level ? colors.white : colors.gray700,
                    fontSize: '13px',
                    fontWeight: levelFilter === level ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              )
            )}
          </Stack>
        </div>

        <div>
          <Text variant="caption" style={{ color: colors.gray500 }}>
            Status
          </Text>
          <Stack
            direction="horizontal"
            spacing="xs"
            style={{ marginTop: spacing.xs }}
          >
            {(['all', 'active', 'draft'] as StatusFilter[]).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: `${spacing.xs} ${spacing.sm}`,
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor:
                    statusFilter === status ? colors.primary : colors.gray100,
                  color:
                    statusFilter === status ? colors.white : colors.gray700,
                  fontSize: '13px',
                  fontWeight: statusFilter === status ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </Stack>
        </div>

        <div>
          <Text variant="caption" style={{ color: colors.gray500 }}>
            Sort By
          </Text>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            style={{
              marginTop: spacing.xs,
              padding: `${spacing.xs} ${spacing.sm}`,
              borderRadius: '6px',
              border: `1px solid ${colors.gray200}`,
              backgroundColor: colors.white,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <option value="progress">Progress</option>
            <option value="due_date">Due Date</option>
            <option value="title">Title</option>
          </select>
        </div>
      </div>

      {filteredAndSortedGoals.length === 0 ? (
        <div
          style={{
            padding: spacing.xl,
            textAlign: 'center',
            backgroundColor: colors.gray100,
            borderRadius: '8px',
          }}
        >
          <Text variant="body" style={{ color: colors.gray500 }}>
            {goals.length === 0
              ? 'No goals found. Create your first goal to get started!'
              : 'No goals match the current filters.'}
          </Text>
          {goals.length === 0 && (
            <Button
              variant="primary"
              onClick={onCreateGoal}
              style={{ marginTop: spacing.md }}
            >
              Create Goal
            </Button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: spacing.md,
          }}
        >
          {filteredAndSortedGoals.map(goal => (
            <GoalCard key={goal.id} goal={goal} onClick={onSelectGoal} />
          ))}
        </div>
      )}
    </div>
  )
}

export default GoalDashboard

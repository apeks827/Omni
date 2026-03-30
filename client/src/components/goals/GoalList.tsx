import React, { useEffect, useState } from 'react'
import { apiClient } from '../../services/api'
import { Button } from '../../design-system'
import { spacing } from '../../design-system/tokens'
import { ProgressBadge } from './ProgressBadge'

interface Goal {
  id: string
  title: string
  description?: string
  status: string
  timeframe_type: string
  start_date: string
  end_date: string
  progress_percentage: number
  created_at: Date
  updated_at: Date
}

interface GoalListProps {
  onSelectGoal: (goalId: string) => void
  onCreateGoal: () => void
}

export const GoalList: React.FC<GoalListProps> = ({
  onSelectGoal,
  onCreateGoal,
}) => {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadGoals()
  }, [filter])

  const loadGoals = async () => {
    try {
      setLoading(true)
      const statusFilter = filter === 'all' ? undefined : filter
      const data = await apiClient.getGoals(statusFilter)
      setGoals(data)
    } catch (error) {
      console.error('Failed to load goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: '#6b7280',
      active: '#3b82f6',
      completed: '#22c55e',
      archived: '#9ca3af',
      cancelled: '#ef4444',
    }

    return (
      <span
        style={{
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 600,
          backgroundColor: `${colors[status] || '#6b7280'}20`,
          color: colors[status] || '#6b7280',
        }}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div style={{ padding: spacing.lg, textAlign: 'center' }}>
        Loading goals...
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
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>Goals</h2>
        <Button variant="primary" onClick={onCreateGoal}>
          + New Goal
        </Button>
      </div>

      <div
        style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.lg }}
      >
        {['all', 'active', 'draft', 'completed'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border:
                filter === status ? '2px solid #3b82f6' : '1px solid #ccc',
              backgroundColor: filter === status ? '#eff6ff' : 'white',
              color: filter === status ? '#3b82f6' : '#6b7280',
              fontWeight: filter === status ? 600 : 400,
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {goals.length === 0 ? (
        <div
          style={{
            padding: spacing.xl,
            textAlign: 'center',
            color: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <p>No goals found. Create your first goal to get started!</p>
          <Button
            variant="primary"
            onClick={onCreateGoal}
            style={{ marginTop: spacing.md }}
          >
            Create Goal
          </Button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: spacing.md,
          }}
        >
          {goals.map(goal => (
            <div
              key={goal.id}
              onClick={() => onSelectGoal(goal.id)}
              style={{
                padding: spacing.md,
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: 'white',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow =
                  '0 4px 12px rgba(0, 0, 0, 0.1)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: spacing.sm,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: 600,
                    flex: 1,
                  }}
                >
                  {goal.title}
                </h3>
                {getStatusBadge(goal.status)}
              </div>

              {goal.description && (
                <p
                  style={{
                    margin: `${spacing.sm} 0`,
                    fontSize: '14px',
                    color: 'rgba(0, 0, 0, 0.6)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {goal.description}
                </p>
              )}

              <div
                style={{
                  fontSize: '12px',
                  color: 'rgba(0, 0, 0, 0.5)',
                  marginBottom: spacing.sm,
                }}
              >
                {formatDate(goal.start_date)} - {formatDate(goal.end_date)}
              </div>

              <ProgressBadge
                percentage={goal.progress_percentage}
                size="md"
                showLabel={true}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { apiClient } from '../../services/api'
import { Button } from '../../design-system'
import { spacing } from '../../design-system/tokens'
import { ProgressBar } from './ProgressBadge'
import { KeyResultRow } from './KeyResultRow'

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
  key_results: KeyResult[]
}

interface KeyResult {
  id: string
  goal_id: string
  title: string
  target_value: number
  current_value: number
  measurement_type: 'numeric' | 'percentage' | 'boolean'
  unit?: string
  progress_percentage: number
}

interface LinkedTask {
  id: string
  title: string
  status: string
  key_result_id?: string
  key_result_title?: string
}

interface GoalDetailProps {
  goalId: string
  onBack: () => void
  onEdit: (goalId: string) => void
}

export const GoalDetail: React.FC<GoalDetailProps> = ({
  goalId,
  onBack,
  onEdit,
}) => {
  const [goal, setGoal] = useState<Goal | null>(null)
  const [linkedTasks, setLinkedTasks] = useState<LinkedTask[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddKR, setShowAddKR] = useState(false)
  const [newKR, setNewKR] = useState({
    title: '',
    target_value: '',
    measurement_type: 'numeric',
    unit: '',
  })

  useEffect(() => {
    loadGoal()
    loadLinkedTasks()
  }, [goalId])

  const loadGoal = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getGoal(goalId)
      setGoal(data)
    } catch (error) {
      console.error('Failed to load goal:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLinkedTasks = async () => {
    try {
      const tasks = await apiClient.getGoalTasks(goalId)
      setLinkedTasks(tasks)
    } catch (error) {
      console.error('Failed to load linked tasks:', error)
    }
  }

  const handleAddKR = async () => {
    try {
      await apiClient.createKeyResult(goalId, {
        title: newKR.title,
        target_value: parseFloat(newKR.target_value) || 0,
        measurement_type: newKR.measurement_type as
          | 'numeric'
          | 'percentage'
          | 'currency'
          | 'boolean',
        unit: newKR.unit || undefined,
      })
      setNewKR({
        title: '',
        target_value: '',
        measurement_type: 'numeric',
        unit: '',
      })
      setShowAddKR(false)
      loadGoal()
    } catch (error) {
      console.error('Failed to add key result:', error)
    }
  }

  const handleUpdateKRProgress = async (krId: string, currentValue: number) => {
    try {
      await apiClient.updateKeyResultProgress(krId, currentValue)
      loadGoal()
    } catch (error) {
      console.error('Failed to update progress:', error)
    }
  }

  const handleDeleteKR = async (krId: string) => {
    try {
      await apiClient.deleteKeyResult(krId)
      loadGoal()
    } catch (error) {
      console.error('Failed to delete key result:', error)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getDaysRemaining = () => {
    if (!goal) return 0
    const end = new Date(goal.end_date)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  if (loading || !goal) {
    return (
      <div style={{ padding: spacing.lg, textAlign: 'center' }}>
        Loading goal details...
      </div>
    )
  }

  return (
    <div style={{ padding: spacing.lg, maxWidth: '800px', margin: '0 auto' }}>
      <Button
        variant="ghost"
        onClick={onBack}
        style={{ marginBottom: spacing.md }}
      >
        ← Back to Goals
      </Button>

      <div
        style={{
          backgroundColor: 'white',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
          padding: spacing.lg,
          marginBottom: spacing.lg,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: spacing.md,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>
              {goal.title}
            </h1>
            <div
              style={{
                display: 'flex',
                gap: spacing.sm,
                marginTop: spacing.sm,
                fontSize: '14px',
                color: 'rgba(0, 0, 0, 0.6)',
              }}
            >
              <span
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '4px',
                }}
              >
                {goal.timeframe_type}
              </span>
              <span>
                {formatDate(goal.start_date)} - {formatDate(goal.end_date)}
              </span>
              <span
                style={{
                  color: getDaysRemaining() < 0 ? '#ef4444' : '#22c55e',
                }}
              >
                {getDaysRemaining() < 0
                  ? `${Math.abs(getDaysRemaining())} days overdue`
                  : `${getDaysRemaining()} days remaining`}
              </span>
            </div>
          </div>
          <Button variant="secondary" onClick={() => onEdit(goal.id)}>
            Edit Goal
          </Button>
        </div>

        {goal.description && (
          <p style={{ marginTop: spacing.md, color: 'rgba(0, 0, 0, 0.7)' }}>
            {goal.description}
          </p>
        )}

        <div style={{ marginTop: spacing.lg }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: spacing.sm,
            }}
          >
            <span style={{ fontWeight: 600 }}>Overall Progress</span>
            <span style={{ fontWeight: 600 }}>
              {Math.round(goal.progress_percentage)}%
            </span>
          </div>
          <ProgressBar percentage={goal.progress_percentage} height={12} />
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'white',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: spacing.lg,
        }}
      >
        <div
          style={{
            padding: spacing.md,
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            Key Results ({goal.key_results?.length || 0})
          </h2>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddKR(!showAddKR)}
          >
            + Add Key Result
          </Button>
        </div>

        {showAddKR && (
          <div
            style={{
              padding: spacing.md,
              backgroundColor: '#f9fafb',
              borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.sm,
              }}
            >
              <input
                type="text"
                placeholder="Key Result title"
                value={newKR.title}
                onChange={e => setNewKR({ ...newKR, title: e.target.value })}
                style={{
                  padding: spacing.sm,
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                }}
              />
              <div style={{ display: 'flex', gap: spacing.sm }}>
                <input
                  type="number"
                  placeholder="Target value"
                  value={newKR.target_value}
                  onChange={e =>
                    setNewKR({ ...newKR, target_value: e.target.value })
                  }
                  style={{
                    flex: 1,
                    padding: spacing.sm,
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                  }}
                />
                <select
                  value={newKR.measurement_type}
                  onChange={e =>
                    setNewKR({ ...newKR, measurement_type: e.target.value })
                  }
                  style={{
                    padding: spacing.sm,
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                  }}
                >
                  <option value="numeric">Numeric</option>
                  <option value="percentage">Percentage</option>
                  <option value="boolean">Yes/No</option>
                </select>
                <input
                  type="text"
                  placeholder="Unit (optional)"
                  value={newKR.unit}
                  onChange={e => setNewKR({ ...newKR, unit: e.target.value })}
                  style={{
                    width: '100px',
                    padding: spacing.sm,
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: spacing.sm,
                  justifyContent: 'flex-end',
                }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddKR(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleAddKR}>
                  Add
                </Button>
              </div>
            </div>
          </div>
        )}

        {goal.key_results?.length === 0 && !showAddKR ? (
          <div
            style={{
              padding: spacing.lg,
              textAlign: 'center',
              color: 'rgba(0, 0, 0, 0.5)',
            }}
          >
            No key results yet. Add your first key result to track progress.
          </div>
        ) : (
          goal.key_results?.map(kr => (
            <KeyResultRow
              key={kr.id}
              keyResult={kr}
              onDelete={handleDeleteKR}
              onUpdateProgress={handleUpdateKRProgress}
            />
          ))
        )}
      </div>

      <div
        style={{
          backgroundColor: 'white',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
          padding: spacing.md,
        }}
      >
        <h2
          style={{
            margin: `0 0 ${spacing.md} 0`,
            fontSize: '18px',
            fontWeight: 600,
          }}
        >
          Linked Tasks ({linkedTasks.length})
        </h2>

        {linkedTasks.length === 0 ? (
          <p style={{ color: 'rgba(0, 0, 0, 0.5)', textAlign: 'center' }}>
            No tasks linked to this goal yet.
          </p>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.sm,
            }}
          >
            {linkedTasks.map(task => (
              <div
                key={task.id}
                style={{
                  padding: spacing.sm,
                  backgroundColor: '#f9fafb',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontWeight: 500 }}>{task.title}</span>
                  {task.key_result_title && (
                    <span
                      style={{
                        marginLeft: spacing.sm,
                        fontSize: '12px',
                        color: 'rgba(0, 0, 0, 0.5)',
                      }}
                    >
                      → {task.key_result_title}
                    </span>
                  )}
                </div>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor:
                      task.status === 'done' ? '#22c55e20' : '#f59e0b20',
                    color: task.status === 'done' ? '#22c55e' : '#f59e0b',
                  }}
                >
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

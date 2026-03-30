import React, { useEffect, useState } from 'react'
import { apiClient } from '../../services/api'
import { Button } from '../../design-system'
import { spacing } from '../../design-system/tokens'
import { ProgressBadge } from './ProgressBadge'

interface Goal {
  id: string
  title: string
  status: string
  progress_percentage: number
  key_results?: KeyResult[]
}

interface KeyResult {
  id: string
  title: string
  progress_percentage: number
}

interface LinkedGoal {
  goal_id: string
  goal_title: string
  goal_status: string
  key_result_id?: string
  key_result_title?: string
  kr_progress?: number
}

interface TaskGoalLinkingWidgetProps {
  taskId: string
}

export const TaskGoalLinkingWidget: React.FC<TaskGoalLinkingWidgetProps> = ({
  taskId,
}) => {
  const [linkedGoals, setLinkedGoals] = useState<LinkedGoal[]>([])
  const [availableGoals, setAvailableGoals] = useState<Goal[]>([])
  const [showGoalSelector, setShowGoalSelector] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedGoalId, setSelectedGoalId] = useState<string>('')
  const [selectedKRId, setSelectedKRId] = useState<string>('')

  useEffect(() => {
    loadLinkedGoals()
    loadAvailableGoals()
  }, [taskId])

  const loadLinkedGoals = async () => {
    try {
      setLoading(true)
      const goals = await apiClient.getTaskGoals(taskId)
      setLinkedGoals(goals)
    } catch (error) {
      console.error('Failed to load linked goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableGoals = async () => {
    try {
      const goals = await apiClient.getGoals('active')
      setAvailableGoals(goals)
    } catch (error) {
      console.error('Failed to load available goals:', error)
    }
  }

  const handleLinkGoal = async () => {
    if (!selectedGoalId) return

    try {
      await apiClient.linkTaskToGoal(
        taskId,
        selectedGoalId,
        selectedKRId || undefined
      )
      setShowGoalSelector(false)
      setSelectedGoalId('')
      setSelectedKRId('')
      loadLinkedGoals()
    } catch (error) {
      console.error('Failed to link goal:', error)
    }
  }

  const handleUnlinkGoal = async (goalId: string) => {
    try {
      await apiClient.unlinkTaskFromGoal(taskId, goalId)
      loadLinkedGoals()
    } catch (error) {
      console.error('Failed to unlink goal:', error)
    }
  }

  const selectedGoal = availableGoals.find(g => g.id === selectedGoalId)

  return (
    <div
      style={{
        padding: spacing.md,
        borderTop: '1px solid rgba(0, 0, 0, 0.1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.sm,
        }}
      >
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
          Linked Goals
        </h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowGoalSelector(!showGoalSelector)}
        >
          + Link Goal
        </Button>
      </div>

      {showGoalSelector && (
        <div
          style={{
            padding: spacing.sm,
            backgroundColor: '#f9fafb',
            borderRadius: '4px',
            marginBottom: spacing.sm,
          }}
        >
          <div style={{ marginBottom: spacing.sm }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: spacing.xs,
              }}
            >
              Select Goal
            </label>
            <select
              value={selectedGoalId}
              onChange={e => {
                setSelectedGoalId(e.target.value)
                setSelectedKRId('')
              }}
              style={{
                width: '100%',
                padding: spacing.sm,
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '14px',
              }}
            >
              <option value="">Select a goal...</option>
              {availableGoals
                .filter(g => !linkedGoals.some(lg => lg.goal_id === g.id))
                .map(goal => (
                  <option key={goal.id} value={goal.id}>
                    {goal.title}
                  </option>
                ))}
            </select>
          </div>

          {selectedGoal &&
            selectedGoal.key_results &&
            selectedGoal.key_results.length > 0 && (
              <div style={{ marginBottom: spacing.sm }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: spacing.xs,
                  }}
                >
                  Key Result (optional)
                </label>
                <select
                  value={selectedKRId}
                  onChange={e => setSelectedKRId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    fontSize: '14px',
                  }}
                >
                  <option value="">None</option>
                  {selectedGoal.key_results.map(kr => (
                    <option key={kr.id} value={kr.id}>
                      {kr.title} ({kr.progress_percentage}%)
                    </option>
                  ))}
                </select>
              </div>
            )}

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
              onClick={() => {
                setShowGoalSelector(false)
                setSelectedGoalId('')
                setSelectedKRId('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleLinkGoal}
              disabled={!selectedGoalId}
            >
              Link
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.5)' }}>
          Loading...
        </p>
      ) : linkedGoals.length === 0 ? (
        <p style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.5)' }}>
          No goals linked. Link a goal to track how this task contributes to
          your objectives.
        </p>
      ) : (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}
        >
          {linkedGoals.map(link => (
            <div
              key={link.goal_id}
              style={{
                padding: spacing.sm,
                backgroundColor: '#eff6ff',
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: '14px' }}>
                  {link.goal_title}
                </div>
                {link.key_result_title && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'rgba(0, 0, 0, 0.6)',
                      marginTop: '2px',
                    }}
                  >
                    KR: {link.key_result_title}
                    {link.kr_progress !== undefined && (
                      <span style={{ marginLeft: spacing.sm }}>
                        <ProgressBadge
                          percentage={link.kr_progress}
                          size="sm"
                          showLabel={false}
                        />
                      </span>
                    )}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUnlinkGoal(link.goal_id)}
              >
                Unlink
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

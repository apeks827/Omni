import React from 'react'
import { Habit, HabitCompletion } from '../../../../shared/types/habits'
import { Card, Button, Badge, Text } from '../../design-system'
import { colors, spacing } from '../../design-system/tokens'

interface HabitListProps {
  habits: Habit[]
  completions: HabitCompletion[]
  onComplete: (habitId: string) => void
  onSkip: (habitId: string) => void
  onEdit: (habitId: string) => void
}

const HabitList: React.FC<HabitListProps> = ({
  habits,
  completions,
  onComplete,
  onSkip,
  onEdit,
}) => {
  const getCompletionStatus = (
    habitId: string
  ): 'completed' | 'skipped' | 'pending' => {
    const today = new Date().toDateString()
    const todayCompletion = completions.find(
      c =>
        c.habit_id === habitId &&
        new Date(c.completed_at).toDateString() === today
    )
    if (!todayCompletion) return 'pending'
    return todayCompletion.skipped ? 'skipped' : 'completed'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      {habits.map(habit => {
        const status = getCompletionStatus(habit.id)
        return (
          <Card key={habit.id}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
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
                  <Text style={{ fontWeight: 600, fontSize: '16px' }}>
                    {habit.name}
                  </Text>
                  <Badge
                    variant={
                      status === 'completed'
                        ? 'success'
                        : status === 'skipped'
                          ? 'warning'
                          : 'primary'
                    }
                  >
                    {status}
                  </Badge>
                </div>
                {habit.description && (
                  <Text
                    style={{
                      color: colors.gray600,
                      fontSize: '14px',
                      marginBottom: spacing.sm,
                    }}
                  >
                    {habit.description}
                  </Text>
                )}
                <div
                  style={{
                    display: 'flex',
                    gap: spacing.md,
                    fontSize: '14px',
                    color: colors.gray600,
                  }}
                >
                  <span>🔥 {habit.current_streak} day streak</span>
                  <span>⏱️ {habit.duration_minutes}m</span>
                  {habit.energy_level && <span>⚡ {habit.energy_level}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: spacing.sm }}>
                {status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => onComplete(habit.id)}
                    >
                      ✓ Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSkip(habit.id)}
                    >
                      Skip
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(habit.id)}
                >
                  Edit
                </Button>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

export default HabitList

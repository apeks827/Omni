import React from 'react'
import { Routine } from '../../../../shared/types/habits'
import { Card, Button, Badge, Text } from '../../design-system'
import { spacing, colors } from '../../design-system/tokens'

interface RoutineListProps {
  routines: Routine[]
  onPlay: (routineId: string) => void
  onEdit: (routineId: string) => void
}

const RoutineList: React.FC<RoutineListProps> = ({
  routines,
  onPlay,
  onEdit,
}) => {
  const getTimeWindowLabel = (window?: string) => {
    switch (window) {
      case 'morning':
        return '🌅 Morning'
      case 'afternoon':
        return '☀️ Afternoon'
      case 'evening':
        return '🌙 Evening'
      default:
        return null
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      {routines.map(routine => {
        const totalDuration = (routine.steps || []).reduce(
          (sum, step) => sum + step.duration_minutes,
          0
        )

        return (
          <Card key={routine.id}>
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
                    {routine.name}
                  </Text>
                  {routine.time_window && (
                    <Badge variant="primary">
                      {getTimeWindowLabel(routine.time_window)}
                    </Badge>
                  )}
                </div>
                <div style={{ fontSize: '14px', color: colors.gray600 }}>
                  {(routine.steps || []).length} steps • {totalDuration} min
                  total
                </div>
                <div
                  style={{
                    marginTop: spacing.sm,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: spacing.xs,
                  }}
                >
                  {(routine.steps || []).slice(0, 3).map((step, index) => (
                    <span
                      key={step.id}
                      style={{
                        fontSize: '12px',
                        padding: '2px 8px',
                        backgroundColor: colors.gray100,
                        borderRadius: '4px',
                        color: colors.gray700,
                      }}
                    >
                      {index + 1}. {step.name}
                    </span>
                  ))}
                  {(routine.steps || []).length > 3 && (
                    <span style={{ fontSize: '12px', color: colors.gray500 }}>
                      +{(routine.steps || []).length - 3} more
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: spacing.sm }}>
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => onPlay(routine.id)}
                >
                  ▶ Play
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(routine.id)}
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

export default RoutineList

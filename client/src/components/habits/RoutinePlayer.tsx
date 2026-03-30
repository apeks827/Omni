import React, { useState } from 'react'
import { Routine } from '../../../../shared/types/habits'
import { Card, Button, Text, Badge } from '../../design-system'
import { colors, spacing } from '../../design-system/tokens'

interface RoutinePlayerProps {
  routine: Routine
  onComplete: (routineId: string, completedSteps: number) => void
  onCancel: () => void
}

const RoutinePlayer: React.FC<RoutinePlayerProps> = ({
  routine,
  onComplete,
  onCancel,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const steps = routine.steps || []
  const currentStep = steps[currentStepIndex]
  const progress = (completedSteps.size / steps.length) * 100

  const handleStepComplete = () => {
    const newCompleted = new Set(completedSteps)
    newCompleted.add(currentStepIndex)
    setCompletedSteps(newCompleted)

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    } else {
      onComplete(routine.id, newCompleted.size)
    }
  }

  const handleSkipStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    } else {
      onComplete(routine.id, completedSteps.size)
    }
  }

  const goToStep = (index: number) => {
    setCurrentStepIndex(index)
  }

  return (
    <Card>
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}
      >
        <div>
          <Text
            style={{
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: spacing.xs,
            }}
          >
            {routine.name}
          </Text>
          {routine.time_window && (
            <Badge variant="primary">{routine.time_window}</Badge>
          )}
        </div>

        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: spacing.xs,
            }}
          >
            <Text style={{ fontSize: '14px', color: colors.gray600 }}>
              Progress: {completedSteps.size} / {steps.length} steps
            </Text>
            <Text style={{ fontSize: '14px', color: colors.gray600 }}>
              {Math.round(progress)}%
            </Text>
          </div>
          <div
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: colors.gray200,
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: colors.success,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {currentStep && (
          <Card padding="md" style={{ backgroundColor: colors.gray100 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing.sm,
              }}
            >
              <Text style={{ fontSize: '12px', color: colors.gray600 }}>
                Step {currentStepIndex + 1} of {steps.length}
              </Text>
              <Badge
                variant={
                  completedSteps.has(currentStepIndex) ? 'success' : 'primary'
                }
              >
                {completedSteps.has(currentStepIndex) ? 'Completed' : 'Current'}
              </Badge>
            </div>
            <Text
              style={{
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: spacing.xs,
              }}
            >
              {currentStep.name}
            </Text>
            <Text style={{ fontSize: '14px', color: colors.gray600 }}>
              ⏱️ {currentStep.duration_minutes} minutes
            </Text>
          </Card>
        )}

        <div style={{ display: 'flex', gap: spacing.sm }}>
          <Button
            variant="success"
            onClick={handleStepComplete}
            disabled={completedSteps.has(currentStepIndex)}
            style={{ flex: 1 }}
          >
            ✓ Complete Step
          </Button>
          <Button
            variant="outline"
            onClick={handleSkipStep}
            disabled={completedSteps.has(currentStepIndex)}
          >
            Skip
          </Button>
        </div>

        <div
          style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}
        >
          <Text
            style={{ fontSize: '14px', fontWeight: 600, color: colors.gray700 }}
          >
            All Steps
          </Text>
          {steps.map((step, index) => (
            <div
              key={step.id}
              onClick={() => goToStep(index)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: spacing.sm,
                borderRadius: '4px',
                backgroundColor:
                  index === currentStepIndex
                    ? colors.primary + '20'
                    : 'transparent',
                cursor: 'pointer',
                border: `1px solid ${index === currentStepIndex ? colors.primary : 'transparent'}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}
              >
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: completedSteps.has(index)
                      ? colors.success
                      : colors.gray300,
                    color: completedSteps.has(index)
                      ? colors.white
                      : colors.gray600,
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {completedSteps.has(index) ? '✓' : index + 1}
                </span>
                <Text style={{ fontSize: '14px' }}>{step.name}</Text>
              </div>
              <Text style={{ fontSize: '12px', color: colors.gray600 }}>
                {step.duration_minutes}m
              </Text>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            gap: spacing.sm,
            justifyContent: 'flex-end',
            paddingTop: spacing.md,
            borderTop: `1px solid ${colors.gray200}`,
          }}
        >
          <Button variant="outline" onClick={onCancel}>
            Exit Routine
          </Button>
          {completedSteps.size === steps.length && (
            <Button
              variant="success"
              onClick={() => onComplete(routine.id, completedSteps.size)}
            >
              Finish Routine
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

export default RoutinePlayer

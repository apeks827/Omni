import { useState } from 'react'
import { ScheduleExplanation, SchedulingFactor } from '../../../shared/types/scheduling'
import { Button, Card, Text, Stack } from '../design-system'
import { colors, spacing } from '../design-system/tokens'

interface ScheduleExplanationTooltipProps {
  taskId: string
  onAccept: () => void
  onReject: () => void
  onManualEdit: (time: string) => void
}

export default function ScheduleExplanationTooltip({
  taskId,
  onAccept,
  onReject,
  onManualEdit,
}: ScheduleExplanationTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [explanation, setExplanation] = useState<ScheduleExplanation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [manualTime, setManualTime] = useState('')

  const fetchExplanation = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tasks/${taskId}/schedule-explanation`)
      const data = await response.json()
      setExplanation(data)
    } catch (error) {
      console.error('Failed to fetch schedule explanation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpen = () => {
    setIsOpen(true)
    if (!explanation) {
      fetchExplanation()
    }
  }

  const getFactorIcon = (type: SchedulingFactor['type']) => {
    const icons = {
      deadline: '⏰',
      priority: '⭐',
      energy: '⚡',
      available_time: '📅',
      user_preference: '👤',
      context: '🎯',
    }
    return icons[type]
  }

  const getWeightColor = (weight: number) => {
    if (weight >= 70) return colors.success
    if (weight >= 40) return colors.warning
    return colors.gray500
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={handleOpen}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: spacing.xs,
          color: colors.primary,
          fontSize: '14px',
        }}
        aria-label="Why this time?"
      >
        ❓ Why this time?
      </button>

      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.3)',
              zIndex: 999,
            }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: spacing.sm,
              zIndex: 1000,
              minWidth: '320px',
              maxWidth: '400px',
            }}
          >
            <Card>
              <Stack direction="vertical" spacing="md">
                <Text variant="h3" weight="semibold">
                  Why this time?
                </Text>

                {isLoading && <Text>Loading...</Text>}

                {explanation && (
                  <>
                    <div>
                      <Text variant="caption" color="gray600">
                        Suggested time
                      </Text>
                      <Text weight="medium">
                        {new Date(explanation.suggestedTime.start).toLocaleString()} -{' '}
                        {new Date(explanation.suggestedTime.end).toLocaleTimeString()}
                      </Text>
                      <Text variant="caption" color="gray600">
                        ({explanation.suggestedTime.duration} minutes)
                      </Text>
                    </div>

                    <div>
                      <Text variant="caption" weight="medium" style={{ marginBottom: spacing.sm }}>
                        Decision factors:
                      </Text>
                      <Stack direction="vertical" spacing="sm">
                        {explanation.factors.map((factor, index) => (
                          <div
                            key={index}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: spacing.sm,
                            }}
                          >
                            <span style={{ fontSize: '18px' }}>{getFactorIcon(factor.type)}</span>
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <Text variant="caption" weight="medium">
                                  {factor.type.replace('_', ' ')}
                                </Text>
                                <Text
                                  variant="caption"
                                  weight="semibold"
                                  style={{ color: getWeightColor(factor.weight) }}
                                >
                                  {factor.weight}%
                                </Text>
                              </div>
                              <Text variant="caption" color="gray600">
                                {factor.reason}
                              </Text>
                            </div>
                          </div>
                        ))}
                      </Stack>
                    </div>

                    <Stack direction="vertical" spacing="sm">
                      <Stack direction="horizontal" spacing="sm">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => {
                            onAccept()
                            setIsOpen(false)
                          }}
                          style={{ flex: 1 }}
                        >
                          ✓ Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onReject()
                            setIsOpen(false)
                          }}
                          style={{ flex: 1 }}
                        >
                          ↻ Resuggest
                        </Button>
                      </Stack>

                      <div>
                        <Text variant="caption" style={{ marginBottom: spacing.xs }}>
                          Or set specific time:
                        </Text>
                        <Stack direction="horizontal" spacing="sm">
                          <input
                            type="datetime-local"
                            value={manualTime}
                            onChange={(e) => setManualTime(e.target.value)}
                            style={{
                              flex: 1,
                              padding: spacing.sm,
                              border: `1px solid ${colors.border.default}`,
                              borderRadius: '4px',
                            }}
                          />
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              if (manualTime) {
                                onManualEdit(manualTime)
                                setIsOpen(false)
                              }
                            }}
                            disabled={!manualTime}
                          >
                            Set
                          </Button>
                        </Stack>
                      </div>
                    </Stack>
                  </>
                )}
              </Stack>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

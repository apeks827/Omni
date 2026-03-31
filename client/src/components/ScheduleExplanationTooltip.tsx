import { useState, useEffect } from 'react'
import {
  ScheduleExplanation,
  SchedulingFactor,
} from '../../../shared/types/scheduling'
import { Button, Text, Stack } from '../design-system'
import { colors, spacing, borderRadius, shadows } from '../design-system/tokens'

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
  const [explanation, setExplanation] = useState<ScheduleExplanation | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(false)
  const [manualTime, setManualTime] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = isMobile ? 'hidden' : 'auto'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'auto'
    }
  }, [isOpen, isMobile])

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

  const handleClose = () => {
    setIsOpen(false)
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

  const getFactorLabel = (type: SchedulingFactor['type']) => {
    const labels = {
      deadline: 'Deadline proximity',
      priority: 'Priority level',
      energy: 'Energy alignment',
      available_time: 'Available time slot',
      user_preference: 'Your preferences',
      context: 'Task context',
    }
    return labels[type]
  }

  const getWeightColor = (weight: number) => {
    if (weight >= 70) return colors.success
    if (weight >= 40) return colors.warning
    return colors.gray500
  }

  const getWeightBarWidth = (weight: number) => `${weight}%`

  const triggerButtonStyles: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: spacing.xs,
    color: colors.primary,
    fontSize: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'opacity 0.2s',
  }

  const overlayStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
    display: 'flex',
    alignItems: isMobile ? 'flex-end' : 'center',
    justifyContent: 'center',
  }

  const modalStyles: React.CSSProperties = isMobile
    ? {
        backgroundColor: colors.white,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: shadows.lg,
      }
    : {
        position: 'absolute',
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        boxShadow: shadows.lg,
        minWidth: '320px',
        maxWidth: '400px',
        width: '90vw',
        maxHeight: '80vh',
        overflowY: 'auto',
      }

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottom: `1px solid ${colors.gray200}`,
  }

  const closeButtonStyles: React.CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: colors.gray600,
    padding: 0,
    lineHeight: 1,
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  const contentStyles: React.CSSProperties = {
    padding: spacing.lg,
  }

  const factorItemStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
  }

  const weightBarContainerStyles: React.CSSProperties = {
    width: '100%',
    height: '6px',
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginTop: '4px',
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={handleOpen}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        style={triggerButtonStyles}
        aria-label="Why this time?"
        aria-expanded={isOpen}
      >
        <span style={{ fontSize: '16px' }}>💡</span>
        <span>Why now?</span>
      </button>

      {isOpen && (
        <div
          style={overlayStyles}
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="explanation-title"
        >
          <div style={modalStyles} onClick={e => e.stopPropagation()}>
            <div style={headerStyles}>
              <h2
                id="explanation-title"
                style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}
              >
                Why this time?
              </h2>
              <button
                onClick={handleClose}
                style={closeButtonStyles}
                aria-label="Close explanation"
              >
                ×
              </button>
            </div>

            <div style={contentStyles}>
              <Stack direction="vertical" spacing="lg">
                {isLoading && (
                  <div style={{ textAlign: 'center', padding: spacing.lg }}>
                    <Text color="gray600">Loading explanation...</Text>
                  </div>
                )}

                {explanation && (
                  <>
                    <div>
                      <Text
                        variant="caption"
                        color="gray600"
                        style={{ marginBottom: '4px' }}
                      >
                        Suggested time
                      </Text>
                      <Text weight="semibold" style={{ fontSize: '16px' }}>
                        {new Date(
                          explanation.suggestedTime.start
                        ).toLocaleString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                      <Text variant="caption" color="gray600">
                        {explanation.suggestedTime.duration} minutes
                      </Text>
                    </div>

                    <div>
                      <Text
                        variant="body"
                        weight="medium"
                        style={{ marginBottom: spacing.sm }}
                      >
                        Decision factors
                      </Text>
                      <Stack direction="vertical" spacing="sm">
                        {explanation.factors
                          .sort((a, b) => b.weight - a.weight)
                          .map((factor, index) => (
                            <div key={index} style={factorItemStyles}>
                              <span
                                style={{ fontSize: '20px', flexShrink: 0 }}
                                role="img"
                                aria-label={getFactorLabel(factor.type)}
                              >
                                {getFactorIcon(factor.type)}
                              </span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '4px',
                                  }}
                                >
                                  <Text variant="body" weight="medium">
                                    {getFactorLabel(factor.type)}
                                  </Text>
                                  <Text
                                    variant="body"
                                    weight="semibold"
                                    style={{
                                      color: getWeightColor(factor.weight),
                                      marginLeft: spacing.sm,
                                    }}
                                  >
                                    {factor.weight}%
                                  </Text>
                                </div>
                                <div style={weightBarContainerStyles}>
                                  <div
                                    style={{
                                      width: getWeightBarWidth(factor.weight),
                                      height: '100%',
                                      backgroundColor: getWeightColor(
                                        factor.weight
                                      ),
                                      transition: 'width 0.3s ease',
                                    }}
                                  />
                                </div>
                                <Text
                                  variant="caption"
                                  color="gray600"
                                  style={{ marginTop: '4px' }}
                                >
                                  {factor.reason}
                                </Text>
                              </div>
                            </div>
                          ))}
                      </Stack>
                    </div>

                    <div
                      style={{
                        borderTop: `1px solid ${colors.gray200}`,
                        paddingTop: spacing.md,
                      }}
                    >
                      <Stack direction="vertical" spacing="sm">
                        <Stack direction="horizontal" spacing="sm">
                          <Button
                            variant="success"
                            size="md"
                            onClick={() => {
                              onAccept()
                              handleClose()
                            }}
                            style={{ flex: 1 }}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="md"
                            onClick={() => {
                              onReject()
                              handleClose()
                            }}
                            style={{ flex: 1 }}
                          >
                            Re-suggest
                          </Button>
                        </Stack>

                        <div>
                          <Text
                            variant="caption"
                            color="gray600"
                            style={{ marginBottom: spacing.xs }}
                          >
                            Or choose a different time
                          </Text>
                          <Stack direction="horizontal" spacing="sm">
                            <input
                              type="datetime-local"
                              value={manualTime}
                              onChange={e => setManualTime(e.target.value)}
                              style={{
                                flex: 1,
                                padding: spacing.sm,
                                border: `1px solid ${colors.border.default}`,
                                borderRadius: borderRadius.md,
                                fontSize: '14px',
                              }}
                              aria-label="Select custom time"
                            />
                            <Button
                              variant="primary"
                              size="md"
                              onClick={() => {
                                if (manualTime) {
                                  onManualEdit(manualTime)
                                  handleClose()
                                }
                              }}
                              disabled={!manualTime}
                            >
                              Set
                            </Button>
                          </Stack>
                        </div>
                      </Stack>
                    </div>
                  </>
                )}
              </Stack>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

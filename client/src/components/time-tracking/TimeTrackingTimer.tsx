import React, { useState, useEffect, useRef } from 'react'
import { colors, spacing, typography } from '../../design-system/tokens'
import Button from '../../design-system/components/Button'
import Card from '../../design-system/components/Card'

interface TimeTrackingTimerProps {
  taskId: string
  taskTitle: string
  onStart: (taskId: string) => void
  onPause: (taskId: string) => void
  onStop: (taskId: string, duration: number) => void
  isRunning: boolean
  initialSeconds?: number
}

const formatTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const TimeTrackingTimer: React.FC<TimeTrackingTimerProps> = ({
  taskId,
  taskTitle,
  onStart,
  onPause,
  onStop,
  isRunning,
  initialSeconds = 0,
}) => {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [running, setRunning] = useState(isRunning)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = window.setInterval(() => {
        setSeconds(prev => prev + 1)
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [running])

  const handleStart = () => {
    setRunning(true)
    onStart(taskId)
  }

  const handlePause = () => {
    setRunning(false)
    onPause(taskId)
  }

  const handleStop = () => {
    setRunning(false)
    const durationMinutes = Math.ceil(seconds / 60)
    onStop(taskId, durationMinutes)
    setSeconds(0)
  }

  const handleReset = () => {
    setRunning(false)
    setSeconds(0)
  }

  return (
    <Card padding="md" shadow="sm">
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: running ? colors.success : colors.gray400,
              boxShadow: running ? `0 0 8px ${colors.success}` : 'none',
              animation: running ? 'pulse 2s infinite' : 'none',
            }}
          />
          <span
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.gray600,
            }}
          >
            {running ? 'Recording' : 'Paused'}
          </span>
        </div>

        <div style={{ textAlign: 'center' }}>
          <span
            style={{
              fontSize: '3rem',
              fontWeight: typography.fontWeight.bold,
              fontFamily: 'monospace',
              color: running ? colors.primary : colors.gray800,
              letterSpacing: '2px',
            }}
          >
            {formatTime(seconds)}
          </span>
        </div>

        <div style={{ textAlign: 'center' }}>
          <span
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.gray600,
              display: 'block',
              marginBottom: spacing.xs,
            }}
          >
            {taskTitle}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            gap: spacing.sm,
            justifyContent: 'center',
          }}
        >
          {!running ? (
            <Button variant="success" onClick={handleStart}>
              Start
            </Button>
          ) : (
            <Button variant="warning" onClick={handlePause}>
              Pause
            </Button>
          )}
          <Button
            variant="danger"
            onClick={handleStop}
            disabled={seconds === 0}
          >
            Stop & Save
          </Button>
          {seconds > 0 && !running && (
            <Button variant="ghost" onClick={handleReset}>
              Reset
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

export default TimeTrackingTimer

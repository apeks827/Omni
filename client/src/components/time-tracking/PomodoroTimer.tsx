import React, { useState, useEffect, useRef } from 'react'
import {
  colors,
  spacing,
  typography,
  borderRadius,
} from '../../design-system/tokens'
import Button from '../../design-system/components/Button'
import Card from '../../design-system/components/Card'

interface PomodoroSettings {
  workDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  sessionsBeforeLongBreak: number
}

interface PomodoroTimerProps {
  taskId: string
  taskTitle: string
  onComplete: (taskId: string, completedSessions: number) => void
  settings?: Partial<PomodoroSettings>
}

type TimerMode = 'work' | 'shortBreak' | 'longBreak'

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  taskId,
  taskTitle,
  onComplete,
  settings: customSettings,
}) => {
  const defaultSettings: PomodoroSettings = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4,
    ...customSettings,
  }

  const [mode, setMode] = useState<TimerMode>('work')
  const [timeLeft, setTimeLeft] = useState(defaultSettings.workDuration * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [completedWorkSessions, setCompletedWorkSessions] = useState(0)
  const intervalRef = useRef<number | null>(null)

  const getCurrentDuration = (): number => {
    switch (mode) {
      case 'work':
        return defaultSettings.workDuration * 60
      case 'shortBreak':
        return defaultSettings.shortBreakDuration * 60
      case 'longBreak':
        return defaultSettings.longBreakDuration * 60
    }
  }

  useEffect(() => {
    setTimeLeft(getCurrentDuration())
  }, [mode])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      handleTimerComplete()
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft])

  const handleTimerComplete = () => {
    setIsRunning(false)

    if (mode === 'work') {
      const newCompletedSessions = completedWorkSessions + 1
      setCompletedWorkSessions(newCompletedSessions)
      setSessions(s => s + 1)

      if (
        newCompletedSessions % defaultSettings.sessionsBeforeLongBreak ===
        0
      ) {
        setMode('longBreak')
        onComplete(taskId, newCompletedSessions)
      } else {
        setMode('shortBreak')
      }
    } else {
      setMode('work')
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStart = () => setIsRunning(true)
  const handlePause = () => setIsRunning(false)
  const handleReset = () => {
    setIsRunning(false)
    setTimeLeft(getCurrentDuration())
  }
  const handleSkip = () => {
    setIsRunning(false)
    handleTimerComplete()
  }

  const getModeColor = (): string => {
    switch (mode) {
      case 'work':
        return colors.danger
      case 'shortBreak':
        return colors.success
      case 'longBreak':
        return colors.info
    }
  }

  const getModeLabel = (): string => {
    switch (mode) {
      case 'work':
        return 'Focus Time'
      case 'shortBreak':
        return 'Short Break'
      case 'longBreak':
        return 'Long Break'
    }
  }

  const progress =
    ((getCurrentDuration() - timeLeft) / getCurrentDuration()) * 100

  return (
    <Card padding="md" shadow="sm">
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-block',
              padding: `${spacing.xs} ${spacing.md}`,
              backgroundColor: `${getModeColor()}15`,
              borderRadius: borderRadius.full,
              marginBottom: spacing.md,
            }}
          >
            <span
              style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                color: getModeColor(),
              }}
            >
              {getModeLabel()}
            </span>
          </div>

          <div
            style={{
              position: 'relative',
              width: '200px',
              height: '200px',
              margin: '0 auto',
            }}
          >
            <svg
              width="200"
              height="200"
              style={{ transform: 'rotate(-90deg)' }}
            >
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke={colors.gray200}
                strokeWidth="8"
              />
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke={getModeColor()}
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 90}`}
                strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '2.5rem',
                  fontWeight: typography.fontWeight.bold,
                  fontFamily: 'monospace',
                  color: colors.gray800,
                }}
              >
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              margin: 0,
              fontSize: typography.fontSize.sm,
              color: colors.gray600,
            }}
          >
            {taskTitle}
          </p>
        </div>

        <div
          style={{ display: 'flex', justifyContent: 'center', gap: spacing.sm }}
        >
          {!isRunning ? (
            <Button variant="primary" onClick={handleStart}>
              Start
            </Button>
          ) : (
            <Button variant="warning" onClick={handlePause}>
              Pause
            </Button>
          )}
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button variant="ghost" onClick={handleSkip}>
            Skip
          </Button>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: spacing.sm,
          }}
        >
          {Array.from({ length: defaultSettings.sessionsBeforeLongBreak }).map(
            (_, i) => (
              <div
                key={i}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor:
                    i < sessions % defaultSettings.sessionsBeforeLongBreak
                      ? getModeColor()
                      : colors.gray300,
                  transition: 'background-color 0.3s ease',
                }}
                title={`Session ${i + 1}`}
              />
            )
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: spacing.lg,
            fontSize: typography.fontSize.xs,
            color: colors.gray500,
          }}
        >
          <span>Sessions today: {completedWorkSessions}</span>
          <span>
            Total focused:{' '}
            {Math.floor(
              (completedWorkSessions * defaultSettings.workDuration) / 60
            )}
            h {(completedWorkSessions * defaultSettings.workDuration) % 60}m
          </span>
        </div>
      </div>
    </Card>
  )
}

export default PomodoroTimer

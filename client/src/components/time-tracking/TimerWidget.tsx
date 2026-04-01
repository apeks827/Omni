import React, { useState, useEffect, useRef, memo } from 'react'
import { colors, spacing, typography } from '../../design-system/tokens'
import Button from '../../design-system/components/Button'
import Card from '../../design-system/components/Card'
import timeTrackingApi from '../../services/timeTrackingApi'
import { TimerState } from '../../../../shared/types/time-tracking'
import TimerSyncIndicator from './TimerSyncIndicator'

interface TimerWidgetProps {
  onExpand?: () => void
}

const formatElapsedTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const TimerWidget: React.FC<TimerWidgetProps> = memo(
  ({ onExpand }: TimerWidgetProps) => {
    const [timerState, setTimerState] = useState<TimerState | null>(null)
    const [elapsedSeconds, setElapsedSeconds] = useState(0)
    const [syncStatus, setSyncStatus] = useState<
      'synced' | 'syncing' | 'offline' | 'conflict'
    >('synced')
    const [isMinimized, setIsMinimized] = useState(false)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [strategy, setStrategy] = useState<'auto' | 'manual' | 'pomodoro'>(
      'auto'
    )
    const [taskTitle, setTaskTitle] = useState('')
    const dragStartRef = useRef<{ x: number; y: number } | null>(null)

    // Load initial timer state and set up polling
    useEffect(() => {
      loadTimerState()
      const interval = setInterval(loadTimerState, 30000) // Poll every 30s
      return () => clearInterval(interval)
    }, [])

    // Fetch task title when timerState changes
    useEffect(() => {
      if (timerState?.task_id) {
        const fetchTaskTitle = async () => {
          try {
            // Get task title from store or API - replace with actual implementation
            const mockTitle = `Task ${timerState.task_id}` // Placeholder for now
            setTaskTitle(mockTitle)
          } catch (error) {
            setTaskTitle('Task Unavailable')
          }
        }
        fetchTaskTitle()
      }
    }, [timerState?.task_id])

    // Update elapsed time every second when timer is running
    useEffect(() => {
      let interval: number
      if (timerState?.status === 'running') {
        interval = window.setInterval(() => {
          const startTime = new Date(timerState.start_time).getTime()
          const elapsed = Math.floor((Date.now() - startTime) / 1000)
          if (timerState.elapsed_seconds) {
            setElapsedSeconds(elapsed + timerState.elapsed_seconds)
          } else {
            setElapsedSeconds(elapsed)
          }
        }, 1000)
      }
      return () => {
        if (interval) clearInterval(interval)
        setElapsedSeconds(timerState?.elapsed_seconds || 0)
      }
    }, [timerState])

    const loadTimerState = async () => {
      try {
        const timer = await timeTrackingApi.getCurrentTimer()
        if (timer) {
          setTimerState(timer)
          setElapsedSeconds(timer.elapsed_seconds || 0)
          setSyncStatus('synced')
        } else {
          setTimerState(null)
          setElapsedSeconds(0)
        }
      } catch (err) {
        console.error('Failed to load timer state:', err)
        setSyncStatus('offline')
      }
    }

    const handleStart = async (taskId: string) => {
      try {
        const timer = await timeTrackingApi.startTimer(taskId)
        setTimerState(timer)
        setElapsedSeconds(0)
        setSyncStatus('syncing')
        setTimeout(() => setSyncStatus('synced'), 500)
      } catch (err) {
        console.error('Failed to start timer:', err)
      }
    }

    const handlePause = async () => {
      if (!timerState) return
      try {
        const timer = await timeTrackingApi.pauseTimer(timerState.id)
        setTimerState(timer)
        setSyncStatus('syncing')
        setTimeout(() => setSyncStatus('synced'), 500)
      } catch (err) {
        console.error('Failed to pause timer:', err)
      }
    }

    const handleStop = async () => {
      if (!timerState) return
      try {
        await timeTrackingApi.stopTimer(timerState.id)
        setTimerState(null)
        setElapsedSeconds(0)
        setSyncStatus('syncing')
        setTimeout(() => setSyncStatus('synced'), 500)
      } catch (err) {
        console.error('Failed to stop timer:', err)
      }
    }

    useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !dragStartRef.current) return
        setPosition({
          x: e.clientX - dragStartRef.current.x,
          y: e.clientY - dragStartRef.current.y,
        })
      }

      const handleMouseUp = () => {
        setIsDragging(false)
      }

      if (isDragging) {
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
        return () => {
          window.removeEventListener('mousemove', handleMouseMove)
          window.removeEventListener('mouseup', handleMouseUp)
        }
      }
    }, [isDragging])

    const formatElapsedTime = (totalSeconds: number): string => {
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = totalSeconds % 60
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }

    const getStatusColor = () => {
      switch (timerState?.status) {
        case 'running':
          return colors.success
        case 'paused':
          return colors.warning
        default:
          return colors.gray400
      }
    }

    const getStatusLabel = () => {
      switch (timerState?.status) {
        case 'running':
          return 'Recording'
        case 'paused':
          return 'Paused'
        default:
          return 'No timer'
      }
    }

    if (!timerState) {
      return null // Hide widget when no timer is active
    }

    return (
      <div
        role="region"
        aria-label="Active timer"
        style={{
          position: 'fixed',
          top: isMinimized ? 'auto' : `${position.y}px`,
          right: isMinimized ? '0' : '16px',
          bottom: isMinimized ? '0' : 'auto',
          left: isMinimized ? '0' : 'auto',
          width: isMinimized ? 'auto' : '320px',
          zIndex: 9999,
          cursor: isMinimized ? 'default' : 'grab',
          transform: isMinimized ? 'translateX(-100%)' : 'none',
          transition: isDragging ? 'none' : 'transform 0.2s ease',
        }}
      >
        <Card
          padding="md"
          shadow="lg"
          style={{
            borderLeft: `3px solid ${getStatusColor()}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.sm,
            }}
          >
            {/* Header with sync status */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}
                role="status"
                aria-live="polite"
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: getStatusColor(),
                    boxShadow:
                      timerState.status === 'running'
                        ? `0 0 8px ${getStatusColor()}`
                        : 'none',
                    animation:
                      timerState.status === 'running'
                        ? 'pulse 2s infinite'
                        : 'none',
                  }}
                  aria-label={
                    timerState?.status === 'running'
                      ? 'Timer is running'
                      : 'Timer is inactive'
                  }
                  aria-hidden="false"
                />
                <span
                  style={{
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    color: getStatusColor(),
                  }}
                >
                  {getStatusLabel()}
                </span>
              </div>
              <div
                onClick={() => setIsMinimized(!isMinimized)}
                style={{ cursor: 'pointer' }}
              >
                <TimerSyncIndicator status={syncStatus} />
              </div>
            </div>

            {/* Timer Display */}
            <div style={{ textAlign: 'center' }}>
              <span
                role="timer"
                aria-live="polite"
                aria-atomic="true"
                style={{
                  fontSize: '2rem',
                  fontWeight: typography.fontWeight.bold,
                  fontFamily: 'monospace',
                  color: colors.gray800,
                  letterSpacing: '1px',
                }}
              >
                {formatElapsedTime(elapsedSeconds)}
              </span>
            </div>

            {/* Task Title */}
            <div style={{ textAlign: 'center' }}>
              <span
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.gray600,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {taskTitle || 'No task selected'}
              </span>
            </div>
            <p id="timer-strategy-description" className="sr-only">
              Select timer strategy: Auto tracks time automatically, Manual
              requires manual start/stop, Pomodoro uses timed intervals
            </p>

            {/* Strategy Selector */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: spacing.sm,
                marginBottom: spacing.md,
              }}
            >
              <select
                value={strategy}
                onChange={e =>
                  setStrategy(e.target.value as 'auto' | 'manual' | 'pomodoro')
                }
                aria-label="Timer strategy"
                aria-describedby="timer-strategy-description"
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: colors.gray100,
                  border: `1px solid ${colors.border.subtle}`,
                  minWidth: '120px',
                }}
              >
                <option value="auto">Auto</option>
                <option value="manual">Manual</option>
                <option value="pomodoro">Pomodoro</option>
              </select>
            </div>

            {/* Controls */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: spacing.xs,
                marginTop: spacing.xs,
              }}
            >
              {timerState.status !== 'running' ? (
                <Button
                  variant="success"
                  size="md" /* Increased from sm to md for 44px target */
                  onClick={() => handleStart(timerState.task_id)}
                  aria-label="Resume timer"
                  style={{ minHeight: '44px', minWidth: '44px' }}
                >
                  ▶ Start
                </Button>
              ) : (
                <Button
                  variant="warning"
                  size="md" /* Increased from sm to md for 44px target */
                  onClick={handlePause}
                  aria-label="Pause timer"
                  style={{ minHeight: '44px', minWidth: '44px' }}
                >
                  ⏸ Pause
                </Button>
              )}
              <Button
                variant="danger"
                size="md" /* Increased from sm to md for 44px target */
                onClick={handleStop}
                aria-label="Stop timer and save"
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                ⏹ Stop
              </Button>
            </div>

            {/* Expand/Collapse */}
            <div style={{ textAlign: 'center', marginTop: spacing.xs }}>
              <Button
                variant="ghost"
                size="md" /* Increased from sm to md for 44px target */
                onClick={onExpand}
                style={{
                  padding: `${spacing.xs} ${spacing.sm}`,
                  minHeight: '44px',
                  minWidth: '44px',
                }}
              >
                {isMinimized ? 'Expand ▶' : '▼ Details'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }
)

export default TimerWidget

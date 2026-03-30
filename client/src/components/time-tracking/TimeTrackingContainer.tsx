import React, { useState, useEffect } from 'react'
import { spacing } from '../../design-system/tokens'
import TimeTrackingTimer from './TimeTrackingTimer'
import TimeLogList from './TimeLogList'
import ManualTimeEntryForm from './ManualTimeEntryForm'
import TimeAnalytics from './TimeAnalytics'
import TimeExport from './TimeExport'
import timeTrackingApi from '../../services/timeTrackingApi'

interface TimeEntry {
  id: string
  task_id: string
  workspace_id: string
  user_id: string
  start_time: Date
  end_time?: Date
  duration_seconds: number
  type: 'manual' | 'timer' | 'pomodoro'
  description?: string
}

interface TimerState {
  id: string
  user_id: string
  task_id: string
  workspace_id: string
  status: 'running' | 'paused' | 'stopped'
  start_time: Date
  elapsed_seconds: number
}

interface TimeTrackingContainerProps {
  taskId: string
  taskTitle: string
  userId: string
  workspaceId: string
}

const TimeTrackingContainer: React.FC<TimeTrackingContainerProps> = ({
  taskId,
  taskTitle,
  userId,
  workspaceId,
}) => {
  const [timerState, setTimerState] = useState<TimerState | null>(null)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [showManualEntry, setShowManualEntry] = useState(false)

  useEffect(() => {
    loadTimerState()
    loadTimeEntries()
  }, [taskId])

  useEffect(() => {
    const savedTimer = localStorage.getItem(`timer_${userId}`)
    if (savedTimer) {
      const parsed = JSON.parse(savedTimer)
      if (parsed.task_id === taskId && parsed.status === 'running') {
        setTimerState(parsed)
      }
    }
  }, [taskId, userId])

  const loadTimerState = async () => {
    try {
      const timer = await timeTrackingApi.getCurrentTimer()
      if (timer && timer.task_id === taskId) {
        setTimerState(timer)
      }
    } catch (error) {
      console.error('Failed to load timer state:', error)
    }
  }

  const loadTimeEntries = async () => {
    try {
      const { entries } = await timeTrackingApi.getTaskTimeEntries(taskId, {
        workspace_id: workspaceId,
        limit: 100,
      })
      setTimeEntries(entries)
    } catch (error) {
      console.error('Failed to load time entries:', error)
    }
  }

  const handleStart = async () => {
    try {
      const timer = await timeTrackingApi.startTimer(taskId)
      setTimerState(timer)
      localStorage.setItem(`timer_${userId}`, JSON.stringify(timer))
    } catch (error) {
      console.error('Failed to start timer:', error)
    }
  }

  const handlePause = async () => {
    if (!timerState) return
    try {
      const timer = await timeTrackingApi.pauseTimer(timerState.id)
      setTimerState(timer)
      localStorage.setItem(`timer_${userId}`, JSON.stringify(timer))
    } catch (error) {
      console.error('Failed to pause timer:', error)
    }
  }

  const handleStop = async () => {
    if (!timerState) return
    try {
      const { timeEntry } = await timeTrackingApi.stopTimer(timerState.id)
      setTimerState(null)
      localStorage.removeItem(`timer_${userId}`)
      setTimeEntries([timeEntry, ...timeEntries])
    } catch (error) {
      console.error('Failed to stop timer:', error)
    }
  }

  const handleManualEntry = async (entry: {
    taskId: string
    taskTitle: string
    date: string
    duration: number
    description?: string
  }) => {
    try {
      const startDate = new Date(entry.date)
      const newEntry = await timeTrackingApi.createTimeEntry({
        task_id: taskId,
        workspace_id: workspaceId,
        user_id: userId,
        type: 'manual',
        source: 'client',
        duration_seconds: entry.duration * 60,
        start_time: startDate,
      })
      setTimeEntries([newEntry, ...timeEntries])
      setShowManualEntry(false)
    } catch (error) {
      console.error('Failed to create manual entry:', error)
    }
  }

  const handleEditEntry = async (log: {
    id: string
    taskId: string
    taskTitle: string
    date: string
    duration: number
    description?: string
    type: 'manual' | 'tracked'
  }) => {
    console.log('Edit entry:', log)
  }

  const handleDeleteEntry = async (logId: string) => {
    try {
      await timeTrackingApi.deleteTimeEntry(logId)
      setTimeEntries(timeEntries.filter(e => e.id !== logId))
    } catch (error) {
      console.error('Failed to delete entry:', error)
    }
  }

  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    try {
      if (format === 'pdf') {
        console.warn('PDF export not yet implemented')
        return
      }
      const blob = await timeTrackingApi.exportTimeData(format, {
        task_id: taskId,
        workspace_id: workspaceId,
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `time-tracking-${taskId}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export:', error)
    }
  }

  const formatLogsForDisplay = (): Array<{
    id: string
    taskId: string
    taskTitle: string
    date: string
    duration: number
    description?: string
    type: 'manual' | 'tracked'
  }> => {
    return timeEntries.map(entry => ({
      id: entry.id,
      taskId: entry.task_id,
      taskTitle,
      date: new Date(entry.start_time).toISOString().split('T')[0],
      duration: Math.ceil(entry.duration_seconds / 60),
      description: entry.description,
      type: entry.type === 'manual' ? 'manual' : 'tracked',
    }))
  }

  const calculateAnalytics = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const totalToday =
      timeEntries
        .filter(e => new Date(e.start_time) >= today)
        .reduce((sum, e) => sum + e.duration_seconds, 0) / 60

    const totalThisWeek =
      timeEntries
        .filter(e => new Date(e.start_time) >= weekStart)
        .reduce((sum, e) => sum + e.duration_seconds, 0) / 60

    const totalThisMonth =
      timeEntries
        .filter(e => new Date(e.start_time) >= monthStart)
        .reduce((sum, e) => sum + e.duration_seconds, 0) / 60

    const dailyData: { date: string; minutes: number }[] = []
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today)
      date.setDate(today.getDate() - (6 - i))
      return date.toISOString().split('T')[0]
    })

    last7Days.forEach(date => {
      const dayEntries = timeEntries.filter(
        e => new Date(e.start_time).toISOString().split('T')[0] === date
      )
      const minutes =
        dayEntries.reduce((sum, e) => sum + e.duration_seconds, 0) / 60
      dailyData.push({ date, minutes })
    })

    const taskBreakdown = [
      {
        taskTitle,
        minutes:
          timeEntries.reduce((sum, e) => sum + e.duration_seconds, 0) / 60,
        percentage: 100,
      },
    ]

    return {
      totalToday,
      totalThisWeek,
      totalThisMonth,
      dailyData,
      taskBreakdown,
    }
  }

  const analytics = calculateAnalytics()
  const logs = formatLogsForDisplay()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
      <TimeTrackingTimer
        taskId={taskId}
        taskTitle={taskTitle}
        onStart={handleStart}
        onPause={handlePause}
        onStop={handleStop}
        isRunning={timerState?.status === 'running'}
        initialSeconds={timerState?.elapsed_seconds || 0}
      />

      {showManualEntry ? (
        <ManualTimeEntryForm
          taskId={taskId}
          taskTitle={taskTitle}
          onSubmit={handleManualEntry}
          onCancel={() => setShowManualEntry(false)}
        />
      ) : null}

      <TimeLogList
        logs={logs}
        onEdit={handleEditEntry}
        onDelete={handleDeleteEntry}
        onAddManual={() => setShowManualEntry(true)}
      />

      <TimeAnalytics
        totalToday={analytics.totalToday}
        totalThisWeek={analytics.totalThisWeek}
        totalThisMonth={analytics.totalThisMonth}
        dailyData={analytics.dailyData}
        taskBreakdown={analytics.taskBreakdown}
      />

      <TimeExport logs={logs} onExport={handleExport} />
    </div>
  )
}

export default TimeTrackingContainer

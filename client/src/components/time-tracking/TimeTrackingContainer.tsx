import React, { useState, useEffect, useMemo } from 'react'
import { spacing } from '../../design-system/tokens'
import TimeTrackingTimer from './TimeTrackingTimer'
import TimeLogList from './TimeLogList'
import ManualTimeEntryForm from './ManualTimeEntryForm'
import TimeAnalytics from './TimeAnalytics'
import TimeExport from './TimeExport'
import timeTrackingApi from '../../services/timeTrackingApi'
import Toast from '../Toast'
import { TimeEntry, TimerState } from '../../../../shared/types/time-tracking'

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
  const [toast, setToast] = useState<{ message: string } | null>(null)

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
    } catch {
      setToast({ message: 'Failed to load timer state' })
    }
  }

  const loadTimeEntries = async () => {
    try {
      const { entries } = await timeTrackingApi.getTaskTimeEntries(taskId, {
        limit: 100,
      })
      setTimeEntries(entries)
    } catch {
      setToast({ message: 'Failed to load time entries' })
    }
  }

  const handleStart = async () => {
    try {
      const timer = await timeTrackingApi.startTimer(taskId)
      setTimerState(timer)
      localStorage.setItem(`timer_${userId}`, JSON.stringify(timer))
    } catch {
      setToast({ message: 'Failed to start timer' })
    }
  }

  const handlePause = async () => {
    if (!timerState) return
    try {
      const timer = await timeTrackingApi.pauseTimer(timerState.id)
      setTimerState(timer)
      localStorage.setItem(`timer_${userId}`, JSON.stringify(timer))
    } catch {
      setToast({ message: 'Failed to pause timer' })
    }
  }

  const handleStop = async () => {
    if (!timerState) return
    try {
      const { timeEntry } = await timeTrackingApi.stopTimer(timerState.id)
      setTimerState(null)
      localStorage.removeItem(`timer_${userId}`)
      setTimeEntries([timeEntry, ...timeEntries])
    } catch {
      setToast({ message: 'Failed to stop timer' })
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
        description: entry.description,
      })
      setTimeEntries([newEntry, ...timeEntries])
      setShowManualEntry(false)
      setToast({ message: 'Time entry created' })
    } catch {
      setToast({ message: 'Failed to create time entry' })
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
    try {
      const updated = await timeTrackingApi.updateTimeEntry(log.id, {
        duration_seconds: log.duration * 60,
        description: log.description,
      })
      setTimeEntries(timeEntries.map(e => (e.id === log.id ? updated : e)))
      setToast({ message: 'Time entry updated' })
    } catch {
      setToast({ message: 'Failed to update time entry' })
    }
  }

  const handleDeleteEntry = async (logId: string) => {
    try {
      await timeTrackingApi.deleteTimeEntry(logId)
      setTimeEntries(timeEntries.filter(e => e.id !== logId))
      setToast({ message: 'Time entry deleted' })
    } catch {
      setToast({ message: 'Failed to delete time entry' })
    }
  }

  const handleExport = async (
    format: 'csv' | 'json',
    dateRange: { start?: Date; end?: Date } = {}
  ) => {
    try {
      const blob = await timeTrackingApi.exportTimeData(format, {
        task_id: taskId,
        start_date: dateRange.start,
        end_date: dateRange.end,
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `time-tracking-${taskId}.${format}`
      a.click()
      URL.revokeObjectURL(url)
      setToast({ message: `Exported as ${format.toUpperCase()}` })
    } catch {
      setToast({ message: 'Failed to export time data' })
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

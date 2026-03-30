import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Task, TaskStatus, EnergyPattern } from '../types'
import { Text, Button, Card, Stack } from '../design-system'
import { apiClient } from '../services/api'
import LowEnergyModeButton from './LowEnergyModeButton'

type ViewMode = 'day' | 'week' | 'month'

interface DragState {
  taskId: string
  originalDate: Date
  currentDate: Date
}

interface RescheduleConflict {
  task: Task
  reason: string
  affectedTasks: Task[]
}

const STATUS_COLORS = {
  pending: { bg: '#f5f5f5', border: '#9e9e9e', text: '#666666' },
  in_progress: { bg: '#e3f2fd', border: '#1976d2', text: '#0d47a1' },
  completed: { bg: '#e8f5e9', border: '#4caf50', text: '#2e7d32' },
  done: { bg: '#e8f5e9', border: '#4caf50', text: '#2e7d32' },
  missed: { bg: '#ffebee', border: '#d32f2f', text: '#c62828' },
  todo: { bg: '#f5f5f5', border: '#9e9e9e', text: '#666666' },
}

const ENERGY_COLORS = {
  peak: { bg: '#fff8e1', border: '#ffc107', label: 'Peak Energy' },
  low: { bg: '#e8eaf6', border: '#7986cb', label: 'Low Energy' },
  neutral: { bg: '#ffffff', border: '#e0e0e0', label: '' },
}

const DEFAULT_ENERGY_PATTERN: EnergyPattern = {
  peak_hours: [9, 10, 11, 14, 15],
  low_hours: [13, 16, 17],
}

function getTaskComputedStatus(task: Task): TaskStatus {
  const status = task.status as string
  if (status === 'done' || status === 'completed') {
    return 'completed'
  }
  if (status === 'in_progress') {
    return 'in_progress'
  }
  if (task.due_date) {
    const now = new Date()
    const dueDate = new Date(task.due_date)
    const isOverdue = dueDate < now
    const isNotCompleted = status !== 'done' && status !== 'completed'
    if (isOverdue && isNotCompleted) {
      return 'missed'
    }
  }
  return 'pending'
}

function getStatusColors(task: Task) {
  const computedStatus = getTaskComputedStatus(task)
  return STATUS_COLORS[computedStatus] || STATUS_COLORS.pending
}

function isPeakHour(hour: number, energyPattern: EnergyPattern): boolean {
  return energyPattern.peak_hours.includes(hour)
}

function isLowHour(hour: number, energyPattern: EnergyPattern): boolean {
  return energyPattern.low_hours.includes(hour)
}

function getEnergyColors(hour: number, energyPattern: EnergyPattern) {
  if (isPeakHour(hour, energyPattern)) {
    return ENERGY_COLORS.peak
  }
  if (isLowHour(hour, energyPattern)) {
    return ENERGY_COLORS.low
  }
  return ENERGY_COLORS.neutral
}

const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [conflicts, setConflicts] = useState<RescheduleConflict[]>([])
  const [showConflictModal, setShowConflictModal] = useState(false)
  const [lowEnergyMode, setLowEnergyMode] = useState(false)
  const [energyPattern] = useState<EnergyPattern>(DEFAULT_ENERGY_PATTERN)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [taskToReschedule, setTaskToReschedule] = useState<Task | null>(null)
  const draggedTaskRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    void loadTasks()
  }, [lowEnergyMode])

  const loadTasks = async () => {
    try {
      const result = await apiClient.getTasks()
      const fetchedTasks = result.tasks || result
      const processedTasks = fetchedTasks.map((task: Task) => ({
        ...task,
        due_date: task.due_date ? new Date(task.due_date) : undefined,
      }))
      setTasks(processedTasks)
    } catch (err) {
      console.error('Failed to load tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  const detectConflicts = (task: Task, newDate: Date): RescheduleConflict[] => {
    const conflicts: RescheduleConflict[] = []
    const newStartTime = newDate.getTime()
    const newEndTime = newStartTime + (task.duration_minutes || 60) * 60 * 1000

    tasks.forEach(otherTask => {
      if (otherTask.id === task.id || !otherTask.due_date) return

      const otherStart = new Date(otherTask.due_date).getTime()
      const otherEnd =
        otherStart + (otherTask.duration_minutes || 60) * 60 * 1000

      if (newStartTime < otherEnd && newEndTime > otherStart) {
        conflicts.push({
          task: otherTask,
          reason: `Time overlap: ${task.title} conflicts with ${otherTask.title}`,
          affectedTasks: [otherTask],
        })
      }

      const dayDiff = Math.abs(
        Math.floor(
          (newDate.getTime() - new Date(otherTask.due_date).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
      if (dayDiff === 0 && otherTask.id !== task.id) {
        const existingConflict = conflicts.find(c => c.task.id === otherTask.id)
        if (!existingConflict) {
          conflicts.push({
            task: otherTask,
            reason: `Same day: ${otherTask.title} scheduled on same day`,
            affectedTasks: [otherTask],
          })
        }
      }
    })

    return conflicts
  }

  const handleDragStart = (task: Task, e: React.DragEvent) => {
    if (!task.due_date) return
    draggedTaskRef.current = e.currentTarget as HTMLDivElement
    setDragState({
      taskId: task.id,
      originalDate: new Date(task.due_date),
      currentDate: new Date(task.due_date),
    })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', task.id)
  }

  const handleDragOver = (date: Date, e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (targetDate: Date, e: React.DragEvent) => {
    e.preventDefault()
    if (!dragState) return

    const draggedTask = tasks.find(t => t.id === dragState.taskId)
    if (!draggedTask) return

    const newDate = new Date(targetDate)
    newDate.setHours(newDate.getHours() + 9)

    const detectedConflicts = detectConflicts(draggedTask, newDate)

    if (detectedConflicts.length > 0) {
      setConflicts(detectedConflicts)
      setShowConflictModal(true)
    } else {
      await performReschedule(draggedTask, newDate)
    }

    if (draggedTaskRef.current) {
      draggedTaskRef.current.style.opacity = '1'
    }
    setDragState(null)
  }

  const handleDragEnd = () => {
    if (draggedTaskRef.current) {
      draggedTaskRef.current.style.opacity = '1'
    }
    setDragState(null)
  }

  const performReschedule = async (task: Task, newDate: Date) => {
    try {
      await apiClient.updateTask(task.id, {
        due_date: newDate,
      })
      setTasks(prevTasks =>
        prevTasks.map(t => (t.id === task.id ? { ...t, due_date: newDate } : t))
      )
    } catch (err) {
      console.error('Failed to reschedule task:', err)
    }
  }

  const confirmRescheduleWithConflicts = async () => {
    if (!dragState) return
    const draggedTask = tasks.find(t => t.id === dragState.taskId)
    if (!draggedTask) return

    const newDate = new Date(
      tasks.find(t => t.id === dragState.taskId)?.due_date || new Date()
    )
    newDate.setHours(9)

    const mainTask = tasks.find(t => t.id === dragState.taskId)
    if (mainTask && mainTask.due_date) {
      const targetDate = new Date(mainTask.due_date)
      await performReschedule(draggedTask, targetDate)
    }

    for (const conflict of conflicts) {
      if (conflict.task.due_date) {
        const conflictDate = new Date(conflict.task.due_date)
        conflictDate.setDate(conflictDate.getDate() + 1)
        await performReschedule(conflict.task, conflictDate)
      }
    }

    setShowConflictModal(false)
    setConflicts([])
  }

  const cancelReschedule = () => {
    setShowConflictModal(false)
    setConflicts([])
    if (draggedTaskRef.current) {
      draggedTaskRef.current.style.opacity = '1'
    }
  }

  const handleRescheduleMissed = (task: Task) => {
    setTaskToReschedule(task)
    setShowRescheduleModal(true)
  }

  const handleConfirmReschedule = async () => {
    if (!taskToReschedule) return
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    await performReschedule(taskToReschedule, tomorrow)
    setShowRescheduleModal(false)
    setTaskToReschedule(null)
  }

  const handleLowEnergyToggle = async (enabled: boolean) => {
    setLowEnergyMode(enabled)
    try {
      await apiClient.toggleLowEnergyMode(enabled)
    } catch (err) {
      console.error('Failed to sync low energy mode:', err)
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const navigatePrevious = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as EventTarget & { tagName?: string }
      const isInputField =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'

      if (
        e.key === 't' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !isInputField
      ) {
        e.preventDefault()
        goToToday()
      } else if (e.key === 'ArrowLeft' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        navigatePrevious()
      } else if (e.key === 'ArrowRight' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        navigateNext()
      } else if (
        e.key === 'd' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !isInputField
      ) {
        e.preventDefault()
        setViewMode('day')
      } else if (
        e.key === 'w' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !isInputField
      ) {
        e.preventDefault()
        setViewMode('week')
      } else if (
        e.key === 'm' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !isInputField
      ) {
        e.preventDefault()
        setViewMode('month')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewMode])

  const filteredTasks = useMemo(() => {
    let result = tasks.filter(task => task.due_date)
    if (lowEnergyMode) {
      result = result.filter(
        task => task.priority === 'critical' || task.priority === 'high'
      )
    }
    return result
  }, [tasks, lowEnergyMode])

  const getTasksForDate = (date: Date) => {
    return filteredTasks.filter(task => {
      if (!task.due_date) return false
      const taskDate = new Date(task.due_date)
      return (
        taskDate.getFullYear() === date.getFullYear() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getDate() === date.getDate()
      )
    })
  }

  const formatDateHeader = () => {
    const options: Intl.DateTimeFormatOptions =
      viewMode === 'month'
        ? { year: 'numeric', month: 'long' }
        : { year: 'numeric', month: 'long', day: 'numeric' }
    return currentDate.toLocaleDateString('en-US', options)
  }

  const renderStatusBadge = (task: Task) => {
    const status = getTaskComputedStatus(task)
    const statusColors = getStatusColors(task)

    const statusLabels: Record<TaskStatus, string> = {
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
      done: 'Completed',
      missed: 'Missed',
      todo: 'Todo',
    }

    return (
      <span
        style={{
          display: 'inline-block',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: 600,
          backgroundColor: statusColors.bg,
          color: statusColors.text,
          border: `1px solid ${statusColors.border}`,
        }}
      >
        {statusLabels[status]}
      </span>
    )
  }

  const renderTaskCard = (task: Task, compact = false) => {
    const isDragging = dragState?.taskId === task.id
    const statusColors = getStatusColors(task)
    const isMissed = getTaskComputedStatus(task) === 'missed'

    return (
      <div
        draggable={!!task.due_date}
        onDragStart={e => handleDragStart(task, e)}
        onDragEnd={handleDragEnd}
        style={{
          cursor: task.due_date ? 'grab' : 'default',
          backgroundColor: statusColors.bg,
          borderLeft: `4px solid ${statusColors.border}`,
          padding: compact ? '2px 4px' : '8px',
          borderRadius: '4px',
          border: isMissed ? `1px solid ${statusColors.border}` : 'none',
          marginBottom: '4px',
          opacity: isDragging ? 0.5 : 1,
          transition: 'opacity 0.2s, background-color 0.2s',
        }}
      >
        {!compact && (
          <div style={{ marginBottom: '4px' }}>{renderStatusBadge(task)}</div>
        )}
        <Text
          variant={compact ? 'caption' : 'body'}
          style={{ fontSize: compact ? 10 : 14 }}
        >
          {task.title}
        </Text>
        {task.duration_minutes && !compact && (
          <Text variant="caption" style={{ color: '#666', marginTop: '4px' }}>
            {task.duration_minutes} min
          </Text>
        )}
        {isMissed && !compact && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleRescheduleMissed(task)}
            style={{ marginTop: '8px' }}
          >
            Reschedule
          </Button>
        )}
      </div>
    )
  }

  const renderEnergyIndicator = (hour: number) => {
    const energyColors = getEnergyColors(hour, energyPattern)
    if (!energyColors.bg || energyColors.bg === '#ffffff') return null

    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          padding: '2px 4px',
          fontSize: '9px',
          backgroundColor: energyColors.bg,
          borderLeft: `2px solid ${energyColors.border}`,
          borderBottom: `2px solid ${energyColors.border}`,
          borderBottomLeftRadius: '4px',
          color: '#666',
        }}
      >
        {energyColors.label}
      </div>
    )
  }

  const renderConflictModal = () => {
    if (!showConflictModal) return null
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={cancelReschedule}
      >
        <div
          style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
          }}
          onClick={e => e.stopPropagation()}
        >
          <Text variant="h3" style={{ marginBottom: '16px' }}>
            Scheduling Conflicts Detected
          </Text>
          <Text variant="body" style={{ marginBottom: '16px' }}>
            Moving this task may affect the following tasks:
          </Text>
          {conflicts.map((conflict, index) => (
            <div
              key={index}
              style={{
                padding: '12px',
                backgroundColor: '#fff3e0',
                borderRadius: '4px',
                marginBottom: '8px',
                borderLeft: '4px solid #f57c00',
              }}
            >
              <Text variant="body" style={{ fontWeight: 600 }}>
                {conflict.task.title}
              </Text>
              <Text variant="caption" style={{ color: '#666' }}>
                {conflict.reason}
              </Text>
            </div>
          ))}
          <Stack direction="horizontal" spacing="md" justify="end">
            <Button variant="ghost" onClick={cancelReschedule}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={confirmRescheduleWithConflicts}
            >
              Reschedule Anyway
            </Button>
          </Stack>
        </div>
      </div>
    )
  }

  const renderRescheduleModal = () => {
    if (!showRescheduleModal || !taskToReschedule) return null
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={() => setShowRescheduleModal(false)}
      >
        <div
          style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%',
          }}
          onClick={e => e.stopPropagation()}
        >
          <Text variant="h3" style={{ marginBottom: '8px' }}>
            Reschedule Missed Task
          </Text>
          <Text variant="body" style={{ marginBottom: '16px', color: '#666' }}>
            "{taskToReschedule.title}" was missed. Would you like to reschedule
            it for tomorrow at 9:00 AM?
          </Text>
          <Stack direction="horizontal" spacing="md" justify="end">
            <Button
              variant="ghost"
              onClick={() => setShowRescheduleModal(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmReschedule}>
              Reschedule for Tomorrow
            </Button>
          </Stack>
        </div>
      </div>
    )
  }

  const renderLegend = () => (
    <Stack
      direction="horizontal"
      spacing="md"
      justify="center"
      style={{ marginTop: '16px' }}
    >
      <Stack direction="horizontal" spacing="xs" align="center">
        <div
          style={{
            width: 12,
            height: 12,
            backgroundColor: STATUS_COLORS.pending.bg,
            borderLeft: `3px solid ${STATUS_COLORS.pending.border}`,
          }}
        />
        <Text variant="caption">Pending</Text>
      </Stack>
      <Stack direction="horizontal" spacing="xs" align="center">
        <div
          style={{
            width: 12,
            height: 12,
            backgroundColor: STATUS_COLORS.in_progress.bg,
            borderLeft: `3px solid ${STATUS_COLORS.in_progress.border}`,
          }}
        />
        <Text variant="caption">In Progress</Text>
      </Stack>
      <Stack direction="horizontal" spacing="xs" align="center">
        <div
          style={{
            width: 12,
            height: 12,
            backgroundColor: STATUS_COLORS.completed.bg,
            borderLeft: `3px solid ${STATUS_COLORS.completed.border}`,
          }}
        />
        <Text variant="caption">Completed</Text>
      </Stack>
      <Stack direction="horizontal" spacing="xs" align="center">
        <div
          style={{
            width: 12,
            height: 12,
            backgroundColor: STATUS_COLORS.missed.bg,
            borderLeft: `3px solid ${STATUS_COLORS.missed.border}`,
          }}
        />
        <Text variant="caption">Missed</Text>
      </Stack>
    </Stack>
  )

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const dayTasks = getTasksForDate(currentDate)

    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {hours.map(hour => {
          const hourTasks = dayTasks.filter(task => {
            if (!task.due_date) return false
            const taskDate = new Date(task.due_date)
            return taskDate.getHours() === hour
          })
          const energyColors = getEnergyColors(hour, energyPattern)

          return (
            <div
              key={hour}
              style={{
                display: 'flex',
                borderBottom: '1px solid #e0e0e0',
                minHeight: '60px',
                backgroundColor: energyColors.bg,
                position: 'relative',
              }}
              onDragOver={e => handleDragOver(currentDate, e)}
              onDrop={e => handleDrop(currentDate, e)}
            >
              {renderEnergyIndicator(hour)}
              <div
                style={{
                  width: '80px',
                  padding: '8px',
                  color: '#666',
                  fontSize: '14px',
                  flexShrink: 0,
                }}
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div
                style={{
                  flex: 1,
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  borderLeft:
                    energyColors.border !== '#e0e0e0'
                      ? `2px solid ${energyColors.border}`
                      : 'none',
                }}
              >
                {hourTasks.length > 0 ? (
                  hourTasks.map(task => renderTaskCard(task))
                ) : (
                  <Text variant="caption" style={{ color: '#ccc' }}>
                    Free time
                  </Text>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      return day
    })

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '8px',
        }}
      >
        {weekDays.map(day => {
          const dayTasks = getTasksForDate(day)
          const isToday =
            day.getDate() === new Date().getDate() &&
            day.getMonth() === new Date().getMonth() &&
            day.getFullYear() === new Date().getFullYear()

          return (
            <div
              key={day.toISOString()}
              onDragOver={(e: React.DragEvent) => handleDragOver(day, e)}
              onDrop={(e: React.DragEvent) => handleDrop(day, e)}
              style={{ minHeight: '200px' }}
            >
              <Card
                padding="md"
                style={{
                  minHeight: '200px',
                  backgroundColor: isToday ? '#f5f5f5' : 'white',
                }}
              >
                <Text
                  variant="body"
                  style={{
                    fontWeight: isToday ? 600 : 400,
                    marginBottom: '12px',
                    color: isToday ? '#1976d2' : '#333',
                  }}
                >
                  {day.toLocaleDateString('en-US', {
                    weekday: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <Stack direction="vertical" spacing="sm">
                  {dayTasks.length > 0 ? (
                    dayTasks.map(task => renderTaskCard(task, true))
                  ) : (
                    <Text variant="caption" style={{ color: '#ccc' }}>
                      Free
                    </Text>
                  )}
                </Stack>
              </Card>
            </div>
          )
        })}
      </div>
    )
  }

  const renderMonthView = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - startDate.getDay())

    const days: Date[] = []
    const current = new Date(startDate)
    while (days.length < 42) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return (
      <div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px',
            marginBottom: '8px',
          }}
        >
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Text
              key={day}
              variant="caption"
              style={{ textAlign: 'center', fontWeight: 600, color: '#666' }}
            >
              {day}
            </Text>
          ))}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px',
          }}
        >
          {days.map(day => {
            const dayTasks = getTasksForDate(day)
            const isCurrentMonth = day.getMonth() === month
            const isToday =
              day.getDate() === new Date().getDate() &&
              day.getMonth() === new Date().getMonth() &&
              day.getFullYear() === new Date().getFullYear()

            return (
              <div
                key={day.toISOString()}
                onDragOver={(e: React.DragEvent) => handleDragOver(day, e)}
                onDrop={(e: React.DragEvent) => handleDrop(day, e)}
                style={{ minHeight: '80px' }}
              >
                <Card
                  padding="sm"
                  style={{
                    minHeight: '80px',
                    backgroundColor: isToday ? '#e3f2fd' : 'white',
                    opacity: isCurrentMonth ? 1 : 0.5,
                  }}
                >
                  <Text
                    variant="caption"
                    style={{
                      fontWeight: isToday ? 600 : 400,
                      marginBottom: '4px',
                      color: isToday ? '#1976d2' : '#333',
                    }}
                  >
                    {day.getDate()}
                  </Text>
                  {dayTasks.length > 0 && (
                    <div>
                      {dayTasks
                        .slice(0, 3)
                        .map(task => renderTaskCard(task, true))}
                      {dayTasks.length > 3 && (
                        <Text
                          variant="caption"
                          style={{ fontSize: '10px', color: '#666' }}
                        >
                          +{dayTasks.length - 3} more
                        </Text>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <Stack justify="center" align="center" style={{ padding: '48px' }}>
        <Text variant="body">Loading calendar...</Text>
      </Stack>
    )
  }

  return (
    <Stack
      direction="vertical"
      spacing="lg"
      style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}
    >
      <Stack direction="horizontal" justify="between" align="center">
        <Text variant="h2">{formatDateHeader()}</Text>
        <Stack direction="horizontal" spacing="md">
          <LowEnergyModeButton
            onToggle={handleLowEnergyToggle}
            initialEnabled={lowEnergyMode}
          />
          <Stack direction="horizontal" spacing="xs">
            <Button
              variant={viewMode === 'day' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('day')}
            >
              Day
            </Button>
            <Button
              variant={viewMode === 'week' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'month' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              Month
            </Button>
          </Stack>
          <Button variant="secondary" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Stack direction="horizontal" spacing="xs">
            <Button variant="ghost" size="sm" onClick={navigatePrevious}>
              ←
            </Button>
            <Button variant="ghost" size="sm" onClick={navigateNext}>
              →
            </Button>
          </Stack>
        </Stack>
      </Stack>

      {lowEnergyMode && (
        <Card
          padding="sm"
          style={{
            backgroundColor: '#fff8e1',
            borderLeft: '4px solid #ffc107',
          }}
        >
          <Text variant="body">
            Low Energy Mode is active. Showing only critical and high priority
            tasks.
          </Text>
        </Card>
      )}

      <Card padding="lg">
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'month' && renderMonthView()}
      </Card>

      {viewMode === 'day' && renderLegend()}

      <Stack direction="horizontal" spacing="md" justify="center">
        <Text variant="caption" style={{ color: '#666' }}>
          Keyboard shortcuts: T = Today | D = Day | W = Week | M = Month |
          Ctrl+←/→ = Navigate
        </Text>
      </Stack>
      {renderConflictModal()}
      {renderRescheduleModal()}
    </Stack>
  )
}

export default CalendarView

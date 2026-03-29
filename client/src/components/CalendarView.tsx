import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Task } from '../types'
import { Text, Button, Card, Stack } from '../design-system'
import { apiClient } from '../services/api'
import ScheduleExplanationTooltip from './ScheduleExplanationTooltip'
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

const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [conflicts, setConflicts] = useState<RescheduleConflict[]>([])
  const [showConflictModal, setShowConflictModal] = useState(false)
  const [lowEnergyMode, setLowEnergyMode] = useState(false)
  const [selectedTaskForTooltip, setSelectedTaskForTooltip] = useState<
    string | null
  >(null)
  const draggedTaskRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    void loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      const fetchedTasks = await apiClient.getTasks()
      setTasks(fetchedTasks)
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
      const updatedTask = await apiClient.updateTask(task.id, {
        due_date: newDate,
      })
      setTasks(prevTasks =>
        prevTasks.map(t => (t.id === task.id ? updatedTask : t))
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

  const handleAcceptSchedule = async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'accept' }),
      })
      await loadTasks()
    } catch (err) {
      console.error('Failed to accept schedule:', err)
    }
  }

  const handleRejectSchedule = async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'resuggest' }),
      })
      await loadTasks()
    } catch (err) {
      console.error('Failed to resuggest schedule:', err)
    }
  }

  const handleManualSchedule = async (taskId: string, time: string) => {
    try {
      await fetch(`/api/tasks/${taskId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestedTime: time }),
      })
      await loadTasks()
    } catch (err) {
      console.error('Failed to set manual schedule:', err)
    }
  }

  const handleLowEnergyToggle = async (enabled: boolean) => {
    setLowEnergyMode(enabled)
    await loadTasks()
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

  const scheduledTasks = useMemo(() => {
    return tasks.filter(task => task.due_date)
  }, [tasks])

  const getTasksForDate = (date: Date) => {
    return scheduledTasks.filter(task => {
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

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'critical':
        return '#d32f2f'
      case 'high':
        return '#f57c00'
      case 'medium':
        return '#fbc02d'
      default:
        return '#9e9e9e'
    }
  }

  const renderTaskCard = (task: Task, compact = false) => {
    const isDragging = dragState?.taskId === task.id
    return (
      <div
        draggable={!!task.due_date}
        onDragStart={e => handleDragStart(task, e)}
        onDragEnd={handleDragEnd}
        style={{
          cursor: task.due_date ? 'grab' : 'default',
          backgroundColor: task.status === 'done' ? '#e8f5e9' : '#fff3e0',
          borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
          padding: compact ? '2px 4px' : '8px',
          borderRadius: '4px',
          border: '1px solid #e0e0e0',
          marginBottom: '4px',
          opacity: isDragging ? 0.5 : 1,
          transition: 'opacity 0.2s',
        }}
      >
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
        {!compact && task.due_date && (
          <ScheduleExplanationTooltip
            taskId={task.id}
            onAccept={() => handleAcceptSchedule(task.id)}
            onReject={() => handleRejectSchedule(task.id)}
            onManualEdit={time => handleManualSchedule(task.id, time)}
          />
        )}
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

          return (
            <div
              key={hour}
              style={{
                display: 'flex',
                borderBottom: '1px solid #e0e0e0',
                minHeight: '60px',
              }}
              onDragOver={e => handleDragOver(currentDate, e)}
              onDrop={e => handleDrop(currentDate, e)}
            >
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

      <Card padding="lg">
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'month' && renderMonthView()}
      </Card>

      <Stack direction="horizontal" spacing="md" justify="center">
        <Text variant="caption" style={{ color: '#666' }}>
          Keyboard shortcuts: T = Today | D = Day | W = Week | M = Month |
          Ctrl+←/→ = Navigate
        </Text>
      </Stack>
      {renderConflictModal()}
    </Stack>
  )
}

export default CalendarView

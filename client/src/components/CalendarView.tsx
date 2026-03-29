import React, { useState, useMemo, useEffect } from 'react'
import { Task } from '../types'
import { Text, Button, Card, Stack } from '../design-system'
import { apiClient } from '../services/api'

type ViewMode = 'day' | 'week' | 'month'

const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

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
      if (e.key === 't' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          goToToday()
        }
      } else if (e.key === 'ArrowLeft' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        navigatePrevious()
      } else if (e.key === 'ArrowRight' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        navigateNext()
      } else if (e.key === 'd' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          setViewMode('day')
        }
      } else if (e.key === 'w' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          setViewMode('week')
        }
      } else if (e.key === 'm' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          setViewMode('month')
        }
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

  const renderTaskCard = (task: Task, compact = false) => (
    <div
      style={{
        cursor: 'pointer',
        backgroundColor: task.status === 'done' ? '#e8f5e9' : '#fff3e0',
        borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
        padding: compact ? '2px 4px' : '8px',
        borderRadius: '4px',
        border: '1px solid #e0e0e0',
        marginBottom: '4px',
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
    </div>
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

          return (
            <div
              key={hour}
              style={{
                display: 'flex',
                borderBottom: '1px solid #e0e0e0',
                minHeight: '60px',
              }}
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
            <Card
              key={day.toISOString()}
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
              <Card
                key={day.toISOString()}
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
    </Stack>
  )
}

export default CalendarView

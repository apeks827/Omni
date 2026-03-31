import React, { useState, useEffect } from 'react'
import { Task } from '../types'
import { Card, Text, Stack, Button } from '../design-system'
import { colors, spacing } from '../design-system/tokens'
import { apiClient } from '../services/api'
import TaskCard from './TaskCard'
import EmptyState from './EmptyState'
import LoadingState from './LoadingState'
import EnergyModeSelector from './EnergyModeSelector'
import EnergyIndicator from './EnergyIndicator'

interface ScheduleViewProps {
  onTaskUpdate?: () => void
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ onTaskUpdate }) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTodayTasks()
  }, [])

  const loadTodayTasks = async () => {
    try {
      setLoading(true)
      const result = await apiClient.getTasks()
      const allTasks = result.tasks || result

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const todayTasks = allTasks.filter((task: Task) => {
        if (!task.due_date) return false
        const dueDate = new Date(task.due_date)
        return dueDate >= today && dueDate < tomorrow
      })

      const sortedTasks = todayTasks.sort((a: Task, b: Task) => {
        if (!a.due_date || !b.due_date) return 0
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      })

      setTasks(sortedTasks)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
      console.error('Error loading today tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return

      const statusOrder: Task['status'][] = ['todo', 'in_progress', 'done']
      const currentIndex = statusOrder.indexOf(task.status)
      const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length]

      const updatedTask = await apiClient.updateTask(taskId, {
        status: nextStatus,
      })
      setTasks(tasks.map(t => (t.id === taskId ? updatedTask : t)))
      onTaskUpdate?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task')
      console.error('Error updating task status:', err)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await apiClient.deleteTask(taskId)
      setTasks(tasks.filter(task => task.id !== taskId))
      onTaskUpdate?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task')
      console.error('Error deleting task:', err)
    }
  }

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(
      tasks.map(task => (task.id === taskId ? { ...task, ...updates } : task))
    )
    onTaskUpdate?.()
  }

  const getTimeSlots = () => {
    const slots: { hour: number; tasks: Task[] }[] = []
    const startHour = 9
    const endHour = 18

    for (let hour = startHour; hour <= endHour; hour++) {
      const hourTasks = tasks.filter(task => {
        if (!task.due_date) return false
        const taskDate = new Date(task.due_date)
        return taskDate.getHours() === hour
      })
      slots.push({ hour, tasks: hourTasks })
    }

    return slots
  }

  const formatHour = (hour: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:00 ${period}`
  }

  const getCompletedCount = () => {
    return tasks.filter(t => t.status === 'done').length
  }

  const getInProgressCount = () => {
    return tasks.filter(t => t.status === 'in_progress').length
  }

  if (loading) {
    return <LoadingState count={3} />
  }

  if (error) {
    return (
      <Card padding="lg">
        <Text variant="body" style={{ color: colors.danger }}>
          {error}
        </Text>
        <Button
          variant="primary"
          onClick={loadTodayTasks}
          style={{ marginTop: spacing.md }}
        >
          Retry
        </Button>
      </Card>
    )
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        title="No tasks scheduled for today"
        message="You're all clear! Add tasks to get started."
        icon="📅"
      />
    )
  }

  const timeSlots = getTimeSlots()

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: spacing.lg }}>
      <Stack direction="vertical" spacing="lg">
        <Card padding="md" style={{ backgroundColor: colors.gray100 }}>
          <Stack direction="horizontal" justify="between" align="center">
            <div>
              <Text variant="h3" style={{ marginBottom: spacing.xs }}>
                Today's Schedule
              </Text>
              <Text variant="body" style={{ color: colors.gray600 }}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </div>
            <Stack direction="horizontal" spacing="md">
              <div style={{ textAlign: 'center' }}>
                <Text
                  variant="h2"
                  style={{ color: colors.success, marginBottom: spacing.xs }}
                >
                  {getCompletedCount()}
                </Text>
                <Text variant="caption" style={{ color: colors.gray600 }}>
                  Completed
                </Text>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Text
                  variant="h2"
                  style={{ color: colors.warning, marginBottom: spacing.xs }}
                >
                  {getInProgressCount()}
                </Text>
                <Text variant="caption" style={{ color: colors.gray600 }}>
                  In Progress
                </Text>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Text
                  variant="h2"
                  style={{ color: colors.primary, marginBottom: spacing.xs }}
                >
                  {tasks.length}
                </Text>
                <Text variant="caption" style={{ color: colors.gray600 }}>
                  Total
                </Text>
              </div>
            </Stack>
          </Stack>
        </Card>

        <Card padding="md">
          <Stack direction="vertical" spacing="md">
            <Stack direction="horizontal" justify="between" align="center">
              <Text variant="h4">Energy Mode</Text>
              <EnergyIndicator />
            </Stack>
            <EnergyModeSelector />
          </Stack>
        </Card>

        <div>
          {timeSlots.map(slot => (
            <div
              key={slot.hour}
              style={{
                display: 'flex',
                borderBottom: `1px solid ${colors.gray200}`,
                minHeight: '80px',
                padding: `${spacing.md} 0`,
              }}
            >
              <div
                style={{
                  width: '100px',
                  flexShrink: 0,
                  paddingRight: spacing.md,
                }}
              >
                <Text
                  variant="body"
                  style={{
                    fontWeight: 600,
                    color: colors.gray700,
                  }}
                >
                  {formatHour(slot.hour)}
                </Text>
              </div>
              <div style={{ flex: 1 }}>
                {slot.tasks.length > 0 ? (
                  <Stack direction="vertical" spacing="sm">
                    {slot.tasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggleStatus={handleToggleStatus}
                        onDelete={handleDeleteTask}
                        onUpdate={handleUpdateTask}
                        showAnimation={true}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Text
                    variant="body"
                    style={{ color: colors.gray400, fontStyle: 'italic' }}
                  >
                    Free time
                  </Text>
                )}
              </div>
            </div>
          ))}
        </div>

        <Card padding="sm" style={{ backgroundColor: colors.gray100 }}>
          <Text
            variant="caption"
            style={{ color: colors.gray600, textAlign: 'center' }}
          >
            Showing tasks scheduled between 9:00 AM - 6:00 PM
          </Text>
        </Card>
      </Stack>
    </div>
  )
}

export default ScheduleView

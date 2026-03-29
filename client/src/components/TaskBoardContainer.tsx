import React, { useEffect, useMemo, useState } from 'react'
import TaskBoard from './TaskBoard'
import TaskForm from './TaskForm'
import TaskInput from './TaskInput'
import { apiClient } from '../services/api'
import { Task } from '../types'
import { Text, Button, Card, Stack } from '../design-system'

const TaskBoardContainer: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [useQuickInput, setUseQuickInput] = useState(true)

  useEffect(() => {
    void loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const fetchedTasks = await apiClient.getTasks()
      setTasks(fetchedTasks)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async (
    taskData: Omit<
      Task,
      'id' | 'created_at' | 'updated_at' | 'workspace_id' | 'creator_id'
    >
  ) => {
    try {
      const newTask = await apiClient.createTask(taskData)
      setTasks(currentTasks => [...currentTasks, newTask])
      setShowForm(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
    }
  }

  const handleQuickCreate = async (taskData: {
    title: string
    priority: 'low' | 'medium' | 'high' | 'critical'
    due_date?: Date
  }) => {
    const newTask = await apiClient.createTask({
      title: taskData.title,
      priority: taskData.priority,
      status: 'todo',
      due_date: taskData.due_date,
    })
    setTasks(currentTasks => [...currentTasks, newTask])
    setError(null)
  }

  const handleToggleStatus = async (taskId: string) => {
    const task = tasks.find(currentTask => currentTask.id === taskId)
    if (!task) {
      return
    }

    try {
      const statusOrder: Task['status'][] = ['todo', 'in_progress', 'done']
      const currentIndex = statusOrder.indexOf(task.status)
      const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length]
      const updatedTask = await apiClient.updateTask(taskId, {
        status: nextStatus,
      })

      setTasks(currentTasks =>
        currentTasks.map(currentTask =>
          currentTask.id === taskId ? updatedTask : currentTask
        )
      )
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await apiClient.deleteTask(taskId)
      setTasks(currentTasks =>
        currentTasks.filter(currentTask => currentTask.id !== taskId)
      )
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task')
    }
  }

  const counts = useMemo(() => {
    return {
      total: tasks.length,
      todo: tasks.filter(task => task.status === 'todo').length,
      inProgress: tasks.filter(task => task.status === 'in_progress').length,
      done: tasks.filter(task => task.status === 'done').length,
    }
  }, [tasks])

  if (loading && tasks.length === 0) {
    return (
      <Stack justify="center" align="center" style={{ padding: '24px' }}>
        <Text variant="body">Loading board...</Text>
      </Stack>
    )
  }

  return (
    <Stack style={{ padding: '24px 0 40px' }} align="center">
      <Stack
        style={{ maxWidth: '1400px', width: '100%', padding: '0 20px' }}
        direction="vertical"
        spacing="lg"
      >
        <Stack
          direction="horizontal"
          justify="between"
          align="center"
          wrap={true}
          style={{ marginBottom: '16px' }}
        >
          <div>
            <Text variant="h2">Task board</Text>
            <Text variant="body" style={{ color: '#6c757d', marginTop: '8px' }}>
              Track work from backlog to completion with honest status
              visibility.
            </Text>
          </div>
          <Stack direction="horizontal" spacing="sm">
            <Button
              variant={useQuickInput ? 'primary' : 'outline'}
              onClick={() => {
                setUseQuickInput(true)
                setShowForm(false)
              }}
            >
              Quick Input
            </Button>
            <Button
              variant={!useQuickInput && showForm ? 'primary' : 'outline'}
              onClick={() => {
                setUseQuickInput(false)
                setShowForm(currentValue => !currentValue)
              }}
            >
              {showForm && !useQuickInput ? 'Close form' : 'Full form'}
            </Button>
          </Stack>
        </Stack>

        <Stack
          direction="horizontal"
          style={{ flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}
        >
          {[
            { label: 'Total', value: counts.total },
            { label: 'To do', value: counts.todo },
            { label: 'In progress', value: counts.inProgress },
            { label: 'Done', value: counts.done },
          ].map(metric => (
            <Card
              key={metric.label}
              padding="lg"
              style={{ flex: 1, minWidth: '200px' }}
            >
              <Text variant="caption" style={{ color: '#6c757d' }}>
                {metric.label}
              </Text>
              <Text variant="h1" style={{ marginTop: '6px' }}>
                {metric.value}
              </Text>
            </Card>
          ))}
        </Stack>

        {error && (
          <Card
            padding="md"
            style={{
              marginBottom: '16px',
              backgroundColor: '#f8d7da',
              borderColor: '#f5c6cb',
            }}
          >
            <Text variant="body" style={{ color: '#721c24' }}>
              {error}
            </Text>
          </Card>
        )}

        {useQuickInput && <TaskInput onSubmit={handleQuickCreate} />}

        {showForm && !useQuickInput && (
          <div style={{ marginBottom: '20px' }}>
            <TaskForm
              onSubmit={handleCreateTask}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}
      </Stack>

      <TaskBoard
        tasks={tasks}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDeleteTask}
      />
    </Stack>
  )
}

export default TaskBoardContainer

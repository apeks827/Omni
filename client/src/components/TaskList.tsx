import React, { useState, useEffect } from 'react'
import { Task } from '../types'
import TaskItem from './TaskItem'
import TaskForm from './TaskForm'
import { apiClient } from '../services/api'

const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState<Task['status'] | 'all'>(
    'all'
  )
  const [filterPriority, setFilterPriority] = useState<
    Task['priority'] | 'all'
  >('all')

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const fetchedTasks = await apiClient.getTasks()
      setTasks(fetchedTasks)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
      console.error('Error loading tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async (
    taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'workspace_id' | 'creator_id'>
  ) => {
    try {
      const newTask = await apiClient.createTask(taskData)
      setTasks([...tasks, newTask])
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
      console.error('Error creating task:', err)
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task')
      console.error('Error updating task status:', err)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await apiClient.deleteTask(taskId)
      setTasks(tasks.filter(task => task.id !== taskId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task')
      console.error('Error deleting task:', err)
    }
  }

  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false
    if (filterPriority !== 'all' && task.priority !== filterPriority)
      return false
    return true
  })

  if (loading && tasks.length === 0) {
    return (
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <p>Loading tasks...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h2>Tasks ({filteredTasks.length})</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1em',
          }}
        >
          {showForm ? 'Cancel' : '+ New Task'}
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '10px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            marginBottom: '20px',
          }}
        >
          Error: {error}
        </div>
      )}

      {showForm && (
        <TaskForm
          onSubmit={handleCreateTask}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <div>
          <label style={{ marginRight: '5px' }}>Status:</label>
          <select
            value={filterStatus}
            onChange={e =>
              setFilterStatus(e.target.value as Task['status'] | 'all')
            }
            style={{
              padding: '6px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          >
            <option value="all">All</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div>
          <label style={{ marginRight: '5px' }}>Priority:</label>
          <select
            value={filterPriority}
            onChange={e =>
              setFilterPriority(e.target.value as Task['priority'] | 'all')
            }
            style={{
              padding: '6px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          >
            <option value="all">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
          <p>
            No tasks found.{' '}
            {loading ? 'Loading...' : 'Create your first task to get started!'}
          </p>
        </div>
      ) : (
        <div>
          {filteredTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDeleteTask}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default TaskList

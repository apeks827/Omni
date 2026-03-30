import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Task } from '../types'
import TaskCard from './TaskCard'
import TaskForm from './TaskForm'
import BulkActionToolbar from './BulkActionToolbar'
import ConfirmationModal from './ConfirmationModal'
import LoadingState from './LoadingState'
import EmptyState from './EmptyState'
import { apiClient } from '../services/api'
import { useSelectionStore } from '../stores/selectionStore'

const PAGE_SIZE = 50

const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState<Task['status'] | 'all'>(
    'all'
  )
  const [filterPriority, setFilterPriority] = useState<
    Task['priority'] | 'all'
  >('all')
  const [filterDueDate, setFilterDueDate] = useState<
    'all' | 'today' | 'week' | 'overdue'
  >('all')
  const [sortBy, setSortBy] = useState<
    'created_at' | 'due_date' | 'priority' | 'title'
  >('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [undoStack, setUndoStack] = useState<
    Array<{ tasks: Task[]; action: string }>
  >([])
  const [hasMore, setHasMore] = useState(true)
  const [totalTasks, setTotalTasks] = useState(0)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const {
    selectedTaskIds,
    toggleSelection,
    rangeSelect,
    selectAll,
    clearSelection,
    isSelected,
  } = useSelectionStore()

  useEffect(() => {
    loadTasks(true)
  }, [filterStatus, filterPriority, sortBy, sortOrder])

  const loadTasks = async (reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      const offset = reset ? 0 : tasks.length
      const params: Parameters<typeof apiClient.getTasks>[0] = {
        limit: PAGE_SIZE,
        offset,
        sortBy,
        sortOrder,
      }

      if (filterStatus !== 'all') params.status = filterStatus
      if (filterPriority !== 'all') params.priority = filterPriority

      const result = await apiClient.getTasks(params)

      if (reset) {
        setTasks(result.tasks)
      } else {
        setTasks(prev => [...prev, ...result.tasks])
      }
      setTotalTasks(result.total)
      setHasMore(tasks.length + result.tasks.length < result.total)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
      console.error('Error loading tasks:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      loadTasks(false)
    }
  }, [loadingMore, hasMore, loading])

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, loadingMore, loadMore])

  const handleCreateTask = async (
    taskData: Omit<
      Task,
      'id' | 'created_at' | 'updated_at' | 'workspace_id' | 'creator_id'
    >
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

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(
      tasks.map(task => (task.id === taskId ? { ...task, ...updates } : task))
    )
  }

  const handleBulkStatusChange = async (status: Task['status']) => {
    const selectedIds = Array.from(selectedTaskIds)
    const previousTasks = tasks.filter(t => selectedIds.includes(t.id))

    try {
      const updatedTasks = await apiClient.bulkUpdateTasks(selectedIds, {
        status,
      })
      setTasks(
        tasks.map(t => {
          const updated = updatedTasks.find(ut => ut.id === t.id)
          return updated || t
        })
      )
      setUndoStack([
        ...undoStack,
        { tasks: previousTasks, action: 'status_change' },
      ])
      clearSelection()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tasks')
      console.error('Error updating tasks:', err)
    }
  }

  const handleBulkPriorityChange = async (priority: Task['priority']) => {
    const selectedIds = Array.from(selectedTaskIds)
    const previousTasks = tasks.filter(t => selectedIds.includes(t.id))

    try {
      const updatedTasks = await apiClient.bulkUpdateTasks(selectedIds, {
        priority,
      })
      setTasks(
        tasks.map(t => {
          const updated = updatedTasks.find(ut => ut.id === t.id)
          return updated || t
        })
      )
      setUndoStack([
        ...undoStack,
        { tasks: previousTasks, action: 'priority_change' },
      ])
      clearSelection()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tasks')
      console.error('Error updating tasks:', err)
    }
  }

  const handleBulkDelete = () => {
    setShowDeleteConfirm(true)
  }

  const confirmBulkDelete = async () => {
    const selectedIds = Array.from(selectedTaskIds)
    const deletedTasks = tasks.filter(t => selectedIds.includes(t.id))

    try {
      await apiClient.bulkDeleteTasks(selectedIds)
      setTasks(tasks.filter(t => !selectedIds.includes(t.id)))
      setUndoStack([...undoStack, { tasks: deletedTasks, action: 'delete' }])
      clearSelection()
      setShowDeleteConfirm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tasks')
      console.error('Error deleting tasks:', err)
    }
  }

  const handleSelectAll = () => {
    selectAll(filteredTasks.map(t => t.id))
  }

  const handleUndo = async () => {
    if (undoStack.length === 0) return

    const lastAction = undoStack[undoStack.length - 1]
    try {
      if (lastAction.action === 'delete') {
        for (const task of lastAction.tasks) {
          await apiClient.createTask(task)
        }
        await loadTasks()
      } else {
        for (const task of lastAction.tasks) {
          await apiClient.updateTask(task.id, task)
        }
        await loadTasks()
      }
      setUndoStack(undoStack.slice(0, -1))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to undo')
      console.error('Error undoing:', err)
    }
  }

  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false
    if (filterPriority !== 'all' && task.priority !== filterPriority)
      return false

    if (filterDueDate !== 'all' && task.due_date) {
      const now = new Date()
      const dueDate = new Date(task.due_date)
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const taskDate = new Date(
        dueDate.getFullYear(),
        dueDate.getMonth(),
        dueDate.getDate()
      )

      if (filterDueDate === 'today') {
        if (taskDate.getTime() !== today.getTime()) return false
      } else if (filterDueDate === 'week') {
        const weekFromNow = new Date(today)
        weekFromNow.setDate(weekFromNow.getDate() + 7)
        if (taskDate < today || taskDate > weekFromNow) return false
      } else if (filterDueDate === 'overdue') {
        if (taskDate >= today) return false
      }
    } else if (filterDueDate !== 'all' && !task.due_date) {
      return false
    }

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
        <h2>
          Tasks ({filteredTasks.length}
          {hasMore ? ` of ${totalTasks}` : ''})
        </h2>
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

      <div
        style={{
          marginBottom: '20px',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
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

        <div>
          <label style={{ marginRight: '5px' }}>Due Date:</label>
          <select
            value={filterDueDate}
            onChange={e =>
              setFilterDueDate(
                e.target.value as 'all' | 'today' | 'week' | 'overdue'
              )
            }
            style={{
              padding: '6px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          >
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        <div>
          <label style={{ marginRight: '5px' }}>Sort:</label>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            style={{
              padding: '6px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          >
            <option value="created_at">Created</option>
            <option value="due_date">Due Date</option>
            <option value="priority">Priority</option>
            <option value="title">Title</option>
          </select>
          <button
            onClick={() =>
              setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
            }
            style={{
              padding: '6px 8px',
              marginLeft: '4px',
              backgroundColor: sortOrder === 'asc' ? '#17a2b8' : '#ffc107',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        <button
          onClick={handleSelectAll}
          style={{
            padding: '6px 12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Select All
        </button>

        {selectedTaskIds.size > 0 && (
          <button
            onClick={clearSelection}
            style={{
              padding: '6px 12px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Clear Selection
          </button>
        )}

        {undoStack.length > 0 && (
          <button
            onClick={handleUndo}
            style={{
              padding: '6px 12px',
              backgroundColor: '#ffc107',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Undo
          </button>
        )}
      </div>

      {filteredTasks.length === 0 ? (
        loading ? (
          <LoadingState count={3} />
        ) : (
          <EmptyState
            title="No tasks found"
            message="Create your first task to get started!"
            actionLabel="Create Task"
            onAction={() => setShowForm(true)}
          />
        )
      ) : (
        <div>
          {filteredTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDeleteTask}
              onUpdate={handleUpdateTask}
              isSelected={isSelected(task.id)}
              onToggleSelect={toggleSelection}
              onRangeSelect={(taskId: string) =>
                rangeSelect(
                  taskId,
                  filteredTasks.map(t => t.id)
                )
              }
              showAnimation={true}
            />
          ))}

          {hasMore && (
            <div
              ref={loadMoreRef}
              style={{
                textAlign: 'center',
                padding: '20px',
                color: '#6c757d',
              }}
            >
              {loadingMore ? (
                <p>Loading more tasks...</p>
              ) : (
                <button
                  onClick={() => loadTasks(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Load More
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <BulkActionToolbar
        selectedCount={selectedTaskIds.size}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkPriorityChange={handleBulkPriorityChange}
        onBulkDelete={handleBulkDelete}
        onClearSelection={clearSelection}
      />

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={confirmBulkDelete}
        title="Delete Tasks"
        message={`Are you sure you want to delete ${selectedTaskIds.size} task(s)? This action cannot be undone.`}
      />
    </div>
  )
}

export default TaskList

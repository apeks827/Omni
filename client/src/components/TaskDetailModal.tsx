import React, { useState, useEffect } from 'react'
import { Task, RecurrenceRule } from '../types'
import { apiClient } from '../services/api'
import { Button } from '../design-system'
import { spacing, colors } from '../design-system/tokens'
import { TaskGoalLinkingWidget } from './goals/TaskGoalLinkingWidget'

interface TaskDetailModalProps {
  taskId: string
  isOpen: boolean
  onClose: () => void
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  taskId,
  isOpen,
  onClose,
}) => {
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [editedStatus, setEditedStatus] = useState<Task['status']>('todo')
  const [editedPriority, setEditedPriority] =
    useState<Task['priority']>('medium')
  const [, setEditedRecurrence] = useState<RecurrenceRule | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen && taskId) {
      loadTask()
    }
  }, [isOpen, taskId])

  const loadTask = async () => {
    try {
      setLoading(true)
      setError(null)
      const tasksResponse = await apiClient.getTasks({ limit: 1 })
      const foundTask = tasksResponse.tasks.find((t: Task) => t.id === taskId)
      if (foundTask) {
        setTask(foundTask)
        setEditedTitle(foundTask.title)
        setEditedDescription(foundTask.description || '')
        setEditedStatus(foundTask.status)
        setEditedPriority(foundTask.priority)
        setEditedRecurrence(
          (foundTask as { recurrence_rule?: RecurrenceRule | null })
            .recurrence_rule || null
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load task')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!editedTitle.trim()) return

    try {
      setIsSaving(true)
      const updates: Partial<Task> = {
        title: editedTitle.trim(),
        description: editedDescription.trim() || undefined,
        status: editedStatus,
        priority: editedPriority,
      }

      const updatedTask = await apiClient.updateTask(taskId, updates)
      setTask(updatedTask)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (task) {
      setEditedTitle(task.title)
      setEditedDescription(task.description || '')
      setEditedStatus(task.status)
      setEditedPriority(task.priority)
    }
    setIsEditing(false)
  }

  const handleStatusChange = async (newStatus: Task['status']) => {
    try {
      const updatedTask = await apiClient.updateTask(taskId, {
        status: newStatus,
      })
      setTask(updatedTask)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: colors.white,
          borderRadius: '8px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {loading ? (
          <div style={{ padding: spacing.xl, textAlign: 'center' }}>
            Loading task...
          </div>
        ) : error ? (
          <div
            style={{
              padding: spacing.xl,
              textAlign: 'center',
              color: colors.danger,
            }}
          >
            {error}
          </div>
        ) : task ? (
          <>
            <div
              style={{
                padding: spacing.lg,
                borderBottom: `1px solid ${colors.gray200}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2 style={{ margin: 0 }}>Task Details</h2>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            </div>

            <div style={{ padding: spacing.lg }}>
              {isEditing ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing.md,
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: spacing.xs,
                        fontWeight: 600,
                      }}
                    >
                      Title
                    </label>
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={e => setEditedTitle(e.target.value)}
                      style={{
                        width: '100%',
                        padding: spacing.sm,
                        borderRadius: '4px',
                        border: `1px solid ${colors.gray300}`,
                        fontSize: '16px',
                      }}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: spacing.xs,
                        fontWeight: 600,
                      }}
                    >
                      Description
                    </label>
                    <textarea
                      value={editedDescription}
                      onChange={e => setEditedDescription(e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: spacing.sm,
                        borderRadius: '4px',
                        border: `1px solid ${colors.gray300}`,
                        fontSize: '14px',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: spacing.md }}>
                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: spacing.xs,
                          fontWeight: 600,
                        }}
                      >
                        Status
                      </label>
                      <select
                        value={editedStatus}
                        onChange={e =>
                          setEditedStatus(e.target.value as Task['status'])
                        }
                        style={{
                          width: '100%',
                          padding: spacing.sm,
                          borderRadius: '4px',
                          border: `1px solid ${colors.gray300}`,
                        }}
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>

                    <div style={{ flex: 1 }}>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: spacing.xs,
                          fontWeight: 600,
                        }}
                      >
                        Priority
                      </label>
                      <select
                        value={editedPriority}
                        onChange={e =>
                          setEditedPriority(e.target.value as Task['priority'])
                        }
                        style={{
                          width: '100%',
                          padding: spacing.sm,
                          borderRadius: '4px',
                          border: `1px solid ${colors.gray300}`,
                        }}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: spacing.sm,
                      justifyContent: 'flex-end',
                    }}
                  >
                    <Button
                      variant="ghost"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleSave}
                      disabled={isSaving || !editedTitle.trim()}
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing.md,
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, marginBottom: spacing.xs }}>
                      {task.title}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                  </div>

                  {task.description && (
                    <div>
                      <span style={{ fontWeight: 600, color: colors.gray600 }}>
                        Description
                      </span>
                      <p style={{ margin: `${spacing.xs} 0` }}>
                        {task.description}
                      </p>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: spacing.lg }}>
                    <div>
                      <span style={{ fontWeight: 600, color: colors.gray600 }}>
                        Status
                      </span>
                      <div style={{ marginTop: spacing.xs }}>
                        <Button
                          variant={
                            task.status === 'done'
                              ? 'success'
                              : task.status === 'in_progress'
                                ? 'warning'
                                : 'primary'
                          }
                          size="sm"
                          onClick={() => {
                            const nextStatus: Task['status'][] = [
                              'todo',
                              'in_progress',
                              'done',
                            ]
                            const currentIndex = nextStatus.indexOf(task.status)
                            handleStatusChange(
                              nextStatus[(currentIndex + 1) % 3]
                            )
                          }}
                        >
                          {task.status.replace('_', ' ')}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <span style={{ fontWeight: 600, color: colors.gray600 }}>
                        Priority
                      </span>
                      <p
                        style={{
                          margin: `${spacing.xs} 0`,
                          textTransform: 'capitalize',
                        }}
                      >
                        {task.priority}
                      </p>
                    </div>

                    {task.due_date && (
                      <div>
                        <span
                          style={{ fontWeight: 600, color: colors.gray600 }}
                        >
                          Due Date
                        </span>
                        <p style={{ margin: `${spacing.xs} 0` }}>
                          {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: '12px', color: colors.gray500 }}>
                    Created: {new Date(task.created_at).toLocaleDateString()}
                    {task.updated_at &&
                      ` • Updated: ${new Date(task.updated_at).toLocaleDateString()}`}
                  </div>
                </div>
              )}
            </div>

            <TaskGoalLinkingWidget taskId={taskId} />
          </>
        ) : null}
      </div>
    </div>
  )
}

export default TaskDetailModal

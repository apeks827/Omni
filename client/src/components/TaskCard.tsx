import React from 'react'
import { Task, RecurringTask } from '../types'
import { Card, Text, Button, Badge, Stack } from '../design-system'
import {
  formatRelativeDate,
  getDateColor,
  isOverdue,
} from '../utils/dateFormat'
import RecurrenceIndicator from './RecurrenceIndicator'
import { apiClient } from '../services/api'

const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

interface TaskCardProps {
  task: Task
  onToggleStatus: (taskId: string) => void
  onDelete: (taskId: string) => void
  isSelected?: boolean
  onToggleSelect?: (taskId: string) => void
  onRangeSelect?: (taskId: string) => void
  onUpdate?: (taskId: string, updates: Partial<Task>) => void
  showAnimation?: boolean
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleStatus,
  onDelete,
  isSelected = false,
  onToggleSelect,
  onRangeSelect,
  onUpdate,
  showAnimation = false,
}) => {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editTitle, setEditTitle] = React.useState(task.title)
  const [editDescription, setEditDescription] = React.useState(
    task.description || ''
  )
  const [isSaving, setIsSaving] = React.useState(false)
  const [isCompleting, setIsCompleting] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const getStatusVariant = (
    status: Task['status']
  ): 'primary' | 'warning' | 'success' => {
    switch (status) {
      case 'todo':
        return 'primary'
      case 'in_progress':
        return 'warning'
      case 'done':
        return 'success'
      default:
        return 'primary'
    }
  }

  const getPriorityVariant = (
    priority: Task['priority']
  ): 'secondary' | 'info' | 'warning' | 'danger' => {
    switch (priority) {
      case 'low':
        return 'secondary'
      case 'medium':
        return 'info'
      case 'high':
        return 'warning'
      case 'critical':
        return 'danger'
      default:
        return 'secondary'
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    if (onToggleSelect && onRangeSelect) {
      if (e.shiftKey) {
        onRangeSelect(task.id)
      } else {
        onToggleSelect(task.id)
      }
    }
  }

  const handleSave = async () => {
    if (!editTitle.trim()) return

    setIsSaving(true)
    try {
      const updates: Partial<Task> = {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
      }

      await apiClient.updateTask(task.id, updates)

      if (onUpdate) {
        onUpdate(task.id, updates)
      }

      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update task:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditTitle(task.title)
    setEditDescription(task.description || '')
    setIsEditing(false)
  }

  const handleDoubleClick = () => {
    if (!isEditing) {
      setIsEditing(true)
    }
  }

  const handleComplete = async () => {
    if (showAnimation) {
      setIsCompleting(true)
      setTimeout(async () => {
        await onToggleStatus(task.id)
        setIsCompleting(false)
      }, 500)
    } else {
      onToggleStatus(task.id)
    }
  }

  const handleDeleteWithAnimation = async () => {
    if (showAnimation) {
      setIsDeleting(true)
      setTimeout(async () => {
        await onDelete(task.id)
      }, 300)
    } else {
      onDelete(task.id)
    }
  }

  const contextTags = (task as Task & { context?: string[] }).context || []

  return (
    <Card
      padding="md"
      style={{
        margin: '8px 0',
        backgroundColor: isSelected ? '#e0f2fe' : undefined,
        border: isSelected ? '2px solid #0ea5e9' : undefined,
        opacity: isDeleting ? 0 : 1,
        transform: isCompleting ? 'scale(1.02)' : 'scale(1)',
        transition: showAnimation ? 'all 0.3s ease' : 'none',
      }}
    >
      <Stack
        direction="horizontal"
        justify="between"
        align="center"
        style={{ marginBottom: '8px' }}
      >
        <Stack direction="horizontal" spacing="sm" align="center">
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(task.id)}
              onClick={e => e.stopPropagation()}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          )}
          <div
            style={{
              cursor: onToggleSelect ? 'pointer' : 'default',
              flex: 1,
            }}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
          >
            {isEditing ? (
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="Task title"
                  autoFocus
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    width: '100%',
                  }}
                />
                <textarea
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
            ) : (
              <Text
                variant={task.status === 'done' ? 'h5' : 'h4'}
                style={{
                  textDecoration:
                    task.status === 'done' ? 'line-through' : 'none',
                  transition: showAnimation
                    ? 'text-decoration 0.3s ease'
                    : 'none',
                }}
              >
                {task.title}
              </Text>
            )}
          </div>
        </Stack>
        <Stack direction="horizontal" spacing="sm">
          {isEditing ? (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={isSaving || !editTitle.trim()}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Badge variant={getPriorityVariant(task.priority)} size="sm">
                {task.priority}
              </Badge>
              {(task as RecurringTask).recurrence_rule && (
                <RecurrenceIndicator
                  rule={(task as RecurringTask).recurrence_rule!}
                  size="sm"
                />
              )}
              {task.duration_minutes && (
                <Badge variant="secondary" size="sm">
                  {formatDuration(task.duration_minutes)}
                </Badge>
              )}
              {contextTags.length > 0 &&
                contextTags.map((tag: string, i: number) => (
                  <Badge key={i} variant="info" size="sm">
                    {tag}
                  </Badge>
                ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                title="Edit (double-click)"
              >
                Edit
              </Button>
              <Button
                variant={getStatusVariant(task.status)}
                size="sm"
                onClick={handleComplete}
              >
                {task.status.replace('_', ' ')}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteWithAnimation}
              >
                Delete
              </Button>
            </>
          )}
        </Stack>
      </Stack>

      {!isEditing && task.description && (
        <Text
          variant="body"
          style={{
            fontStyle: task.status === 'done' ? 'italic' : 'normal',
            marginBottom: '8px',
          }}
        >
          {task.description}
        </Text>
      )}

      <Stack direction="horizontal" spacing="lg" align="center">
        <Text variant="caption">ID: {task.id.substring(0, 8)}...</Text>
        <Text variant="caption">
          Created: {new Date(task.created_at).toLocaleDateString()}
        </Text>
        {task.duration_minutes && (
          <Text variant="caption">
            Duration: {formatDuration(task.duration_minutes)}
          </Text>
        )}
        {task.due_date && (
          <Text
            variant="caption"
            weight={isOverdue(task.due_date) ? 'bold' : 'normal'}
            style={{ color: getDateColor(task.due_date) }}
          >
            Due: {formatRelativeDate(task.due_date)}
          </Text>
        )}
      </Stack>
    </Card>
  )
}

export default TaskCard

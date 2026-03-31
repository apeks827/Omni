import React, { useState } from 'react'
import { Task } from '../../../types'
import { useTaskStore } from '../../../stores/taskStore'
import { Text, Button, Stack, colors, spacing } from '../../../design-system'
import { TaskGoalLinkingWidget } from '../../goals/TaskGoalLinkingWidget'

interface TaskDetailPanelProps {
  task: Task
  onClose: () => void
}

type Tab = 'details' | 'goals' | 'activity'

const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({ task, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('details')
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDescription, setEditDescription] = useState(task.description || '')

  const { updateTask, deleteTask } = useTaskStore()

  const handleSaveEdit = async () => {
    const success = await updateTask(task.id, {
      title: editTitle,
      description: editDescription,
    })
    if (success) setIsEditing(false)
  }

  const handleStatusChange = async (status: Task['status']) => {
    await updateTask(task.id, { status })
  }

  const handlePriorityChange = async (priority: Task['priority']) => {
    await updateTask(task.id, { priority })
  }

  const handleDelete = async () => {
    const success = await deleteTask(task.id)
    if (success) onClose()
  }

  const statusOptions: Array<{ value: Task['status']; label: string }> = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
  ]

  const priorityOptions: Array<{ value: Task['priority']; label: string }> = [
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ]

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'details', label: 'Details' },
    { key: 'goals', label: 'Goals' },
    { key: 'activity', label: 'Activity' },
  ]

  return (
    <div
      style={{
        width: '480px',
        height: '100vh',
        backgroundColor: 'var(--bg-primary, #fff)',
        borderLeft: '1px solid var(--border-subtle, #ddd)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        right: 0,
        top: 0,
        zIndex: 100,
        boxShadow: '-4px 0 16px rgba(0,0,0,0.08)',
      }}
    >
      <div
        style={{
          padding: spacing.lg,
          borderBottom: '1px solid var(--border-subtle, #ddd)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text variant="h3">Task Details</Text>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>

      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle, #ddd)',
        }}
      >
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: `${spacing.md} 0`,
              background: 'none',
              border: 'none',
              borderBottom:
                activeTab === tab.key
                  ? `2px solid ${colors.primary}`
                  : '2px solid transparent',
              color: activeTab === tab.key ? colors.primary : colors.gray600,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.key ? 600 : 400,
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: spacing.lg }}>
        {activeTab === 'details' && (
          <Stack spacing="lg">
            <Stack spacing="sm">
              <Text variant="caption" color="gray600">
                Title
              </Text>
              {isEditing ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    border: `1px solid ${colors.primary}`,
                    borderRadius: '4px',
                    fontSize: '16px',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
              ) : (
                <span
                  onClick={() => setIsEditing(true)}
                  style={{ cursor: 'pointer' }}
                >
                  <Text variant="h3">{task.title}</Text>
                </span>
              )}
            </Stack>

            <Stack spacing="sm">
              <Text variant="caption" color="gray600">
                Status
              </Text>
              <Stack direction="horizontal" spacing="xs" wrap>
                {statusOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleStatusChange(opt.value)}
                    style={{
                      padding: `${spacing.xs} ${spacing.sm}`,
                      borderRadius: '4px',
                      border: `1px solid ${task.status === opt.value ? colors.primary : colors.gray300}`,
                      background:
                        task.status === opt.value
                          ? colors.primary
                          : 'transparent',
                      color:
                        task.status === opt.value
                          ? colors.white
                          : colors.gray700,
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: task.status === opt.value ? 600 : 400,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </Stack>
            </Stack>

            <Stack spacing="sm">
              <Text variant="caption" color="gray600">
                Priority
              </Text>
              <Stack direction="horizontal" spacing="xs" wrap>
                {priorityOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handlePriorityChange(opt.value)}
                    style={{
                      padding: `${spacing.xs} ${spacing.sm}`,
                      borderRadius: '4px',
                      border: `1px solid ${task.priority === opt.value ? colors.primary : colors.gray300}`,
                      background:
                        task.priority === opt.value
                          ? colors.primary
                          : 'transparent',
                      color:
                        task.priority === opt.value
                          ? colors.white
                          : colors.gray700,
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: task.priority === opt.value ? 600 : 400,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </Stack>
            </Stack>

            <Stack spacing="sm">
              <Text variant="caption" color="gray600">
                Description
              </Text>
              {isEditing ? (
                <textarea
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    border: `1px solid ${colors.gray300}`,
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none',
                  }}
                />
              ) : (
                <span
                  onClick={() => setIsEditing(true)}
                  style={{ cursor: 'pointer' }}
                >
                  <Text
                    variant="body"
                    color={task.description ? undefined : 'gray600'}
                    style={{
                      whiteSpace: 'pre-wrap',
                      minHeight: '60px',
                      display: 'block',
                    }}
                  >
                    {task.description || 'Click to add description...'}
                  </Text>
                </span>
              )}
            </Stack>

            {task.due_date && (
              <Stack spacing="sm">
                <Text variant="caption" color="gray600">
                  Due Date
                </Text>
                <Text variant="body">
                  {new Date(task.due_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </Stack>
            )}

            {task.duration_minutes && (
              <Stack spacing="sm">
                <Text variant="caption" color="gray600">
                  Estimated Duration
                </Text>
                <Text variant="body">{task.duration_minutes} minutes</Text>
              </Stack>
            )}
          </Stack>
        )}

        {activeTab === 'goals' && (
          <Stack spacing="lg">
            <TaskGoalLinkingWidget taskId={task.id} />
          </Stack>
        )}

        {activeTab === 'activity' && (
          <Stack spacing="md">
            <Text variant="body" color="gray600">
              Activity log coming soon...
            </Text>
          </Stack>
        )}
      </div>

      <div
        style={{
          padding: spacing.lg,
          borderTop: '1px solid var(--border-subtle, #ddd)',
          display: 'flex',
          gap: spacing.sm,
          justifyContent: 'space-between',
        }}
      >
        <Button variant="danger" size="sm" onClick={handleDelete}>
          Delete
        </Button>
        <Stack direction="horizontal" spacing="sm">
          {isEditing && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveEdit}>
                Save
              </Button>
            </>
          )}
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          )}
        </Stack>
      </div>
    </div>
  )
}

export default TaskDetailPanel

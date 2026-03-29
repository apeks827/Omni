import React from 'react'
import { Task } from '../types'
import { Card, Text, Button, Badge, Stack } from '../design-system'

interface TaskItemProps {
  task: Task
  onToggleStatus: (taskId: string) => void
  onDelete: (taskId: string) => void
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleStatus,
  onDelete,
}) => {
  const getStatusVariant = (status: Task['status']): 'primary' | 'warning' | 'success' => {
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

  const getPriorityVariant = (priority: Task['priority']): 'secondary' | 'info' | 'warning' | 'danger' => {
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

  return (
    <Card padding="md" style={{ margin: '10px 0' }}>
      <Stack direction="horizontal" justify="between" align="center" style={{ marginBottom: '8px' }}>
        <Text variant={task.status === 'done' ? 'h5' : 'h4'} style={{ textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
          {task.title}
        </Text>
        <Stack direction="horizontal" spacing="sm">
          <Badge variant={getPriorityVariant(task.priority)} size="sm">
            {task.priority}
          </Badge>
          <Button 
            variant={getStatusVariant(task.status)} 
            size="sm"
            onClick={() => onToggleStatus(task.id)}
          >
            {task.status.replace('_', ' ')}
          </Button>
          <Button 
            variant="danger" 
            size="sm"
            onClick={() => onDelete(task.id)}
          >
            Delete
          </Button>
        </Stack>
      </Stack>

      {task.description && (
        <Text variant="body" style={{ fontStyle: task.status === 'done' ? 'italic' : 'normal', marginBottom: '8px' }}>
          {task.description}
        </Text>
      )}

      <Stack direction="horizontal" spacing="lg" align="center">
        <Text variant="caption">ID: {task.id.substring(0, 8)}...</Text>
        <Text variant="caption">
          Created: {new Date(task.created_at).toLocaleDateString()}
        </Text>
      </Stack>
    </Card>
  )
}

export default TaskItem

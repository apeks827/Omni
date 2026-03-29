import React from 'react'
import { Task } from '../types'
import TaskItem from './TaskItem'
import { Badge, Card, Stack, Text, colors } from '../design-system'

interface TaskBoardProps {
  tasks: Task[]
  onToggleStatus: (taskId: string) => void
  onDelete: (taskId: string) => void
}

const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  onToggleStatus,
  onDelete,
}) => {
  const columns: Array<{
    status: Task['status']
    title: string
    color: string
    badgeVariant: 'primary' | 'warning' | 'success'
  }> = [
    { status: 'todo', title: 'To Do', color: colors.primary, badgeVariant: 'primary' },
    { status: 'in_progress', title: 'In Progress', color: colors.warning, badgeVariant: 'warning' },
    { status: 'done', title: 'Done', color: colors.success, badgeVariant: 'success' },
  ]

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(task => task.status === status)
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: '20px',
        padding: '20px',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {columns.map(column => {
        const columnTasks = getTasksByStatus(column.status)
        return (
          <Card
            key={column.status}
            padding="md"
            borderRadius="lg"
            style={{
              backgroundColor: colors.bg.subtle,
              minHeight: '500px',
              borderTop: `4px solid ${column.color}`,
            }}
          >
            <Stack spacing="md">
              <Stack direction="horizontal" align="center" justify="between">
                <Text variant="h4">{column.title}</Text>
                <Badge variant={column.badgeVariant}>{columnTasks.length}</Badge>
              </Stack>
              <Stack spacing="sm">
                {columnTasks.length === 0 ? (
                  <Card
                    padding="lg"
                    style={{
                      backgroundColor: colors.white,
                      borderStyle: 'dashed',
                      textAlign: 'center',
                    }}
                  >
                    <Text variant="caption" color="gray600">
                      No tasks
                    </Text>
                  </Card>
                ) : (
                  columnTasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggleStatus={onToggleStatus}
                      onDelete={onDelete}
                    />
                  ))
                )}
              </Stack>
            </Stack>
          </Card>
        )
      })}
    </div>
  )
}

export default TaskBoard

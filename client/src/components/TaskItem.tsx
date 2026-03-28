import React from 'react'
import { Task } from '../types'

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
  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'todo':
        return '#007bff'
      case 'in_progress':
        return '#ffc107'
      case 'done':
        return '#28a745'
      default:
        return '#007bff'
    }
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'low':
        return '#6c757d'
      case 'medium':
        return '#17a2b8'
      case 'high':
        return '#fd7e14'
      case 'critical':
        return '#dc3545'
      default:
        return '#6c757d'
    }
  }

  return (
    <div
      style={{
        padding: '15px',
        margin: '10px 0',
        border: '1px solid #ddd',
        borderRadius: '4px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '1.1em',
            color: task.status === 'done' ? '#6c757d' : '#333',
          }}
        >
          {task.title}
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.8em',
              backgroundColor: getPriorityColor(task.priority),
              color: 'white',
            }}
          >
            {task.priority}
          </span>
          <button
            onClick={() => onToggleStatus(task.id)}
            style={{
              padding: '4px 8px',
              backgroundColor: getStatusColor(task.status),
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8em',
            }}
          >
            {task.status.replace('_', ' ')}
          </button>
          <button
            onClick={() => onDelete(task.id)}
            style={{
              padding: '4px 8px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8em',
            }}
          >
            Delete
          </button>
        </div>
      </div>

      {task.description && (
        <p
          style={{
            margin: '8px 0',
            color: '#555',
            fontStyle: task.status === 'done' ? 'italic' : 'normal',
          }}
        >
          {task.description}
        </p>
      )}

      <div
        style={{
          display: 'flex',
          fontSize: '0.8em',
          color: '#6c757d',
          marginTop: '8px',
        }}
      >
        <span>ID: {task.id.substring(0, 8)}...</span>
        <span style={{ marginLeft: '10px' }}>
          Created: {new Date(task.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  )
}

export default TaskItem

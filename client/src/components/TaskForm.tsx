import React, { useState } from 'react'
import { Task, RecurrenceRule } from '../types'
import RecurrencePicker from './RecurrencePicker'
import DueDatePicker from './DueDatePicker'

interface TaskFormProps {
  onSubmit: (
    task: Omit<
      Task,
      'id' | 'created_at' | 'updated_at' | 'workspace_id' | 'creator_id'
    > & { recurrence_rule?: RecurrenceRule | null }
  ) => void
  onCancel: () => void
}

const TaskForm: React.FC<TaskFormProps> = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<Task['status']>('todo')
  const [priority, setPriority] = useState<Task['priority']>('medium')
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | null>(
    null
  )
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    onSubmit({
      title,
      description,
      status,
      priority,
      recurrence_rule: recurrenceRule,
      due_date: dueDate,
    })

    setTitle('')
    setDescription('')
    setStatus('todo')
    setPriority('medium')
    setRecurrenceRule(null)
    setDueDate(undefined)
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginBottom: '20px',
        padding: '15px',
        border: '1px solid #ddd',
        borderRadius: '4px',
      }}
    >
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Title *</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Description
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Due Date
        </label>
        <DueDatePicker value={dueDate || null} onChange={setDueDate} />
      </div>

      <div style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Status
          </label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value as Task['status'])}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Priority
          </label>
          <select
            value={priority}
            onChange={e => setPriority(e.target.value as Task['priority'])}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <RecurrencePicker value={recurrenceRule} onChange={setRecurrenceRule} />
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Create Task
        </button>
      </div>
    </form>
  )
}

export default TaskForm

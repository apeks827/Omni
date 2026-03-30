import React, { useState, useCallback } from 'react'
import { Input, Button, Badge, Stack, Card, Text } from '../design-system'
import { colors, spacing } from '../design-system/tokens'
import VoiceInput from './VoiceInput'

interface ExtractedData {
  title: string
  due_date?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
}

interface TaskInputProps {
  onSubmit: (task: {
    title: string
    priority: 'low' | 'medium' | 'high' | 'critical'
    due_date?: Date
  }) => Promise<void>
  placeholder?: string
}

const TaskInput: React.FC<TaskInputProps> = ({
  onSubmit,
  placeholder = 'Add a task... (e.g., "Fix bug tomorrow high priority")',
}) => {
  const [input, setInput] = useState('')
  const [extracted, setExtracted] = useState<ExtractedData | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showVoiceInput, setShowVoiceInput] = useState(false)

  const [editedTitle, setEditedTitle] = useState('')
  const [editedPriority, setEditedPriority] = useState<
    'low' | 'medium' | 'high' | 'critical'
  >('medium')
  const [editedDueDate, setEditedDueDate] = useState('')

  const extractTaskData = useCallback(async (text: string) => {
    if (!text.trim()) {
      return null
    }

    setIsExtracting(true)
    setError(null)

    try {
      const response = await fetch('/api/tasks/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: text }),
      })

      if (!response.ok) {
        throw new Error('Failed to extract task data')
      }

      const data = await response.json()
      return data as ExtractedData
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed')
      return null
    } finally {
      setIsExtracting(false)
    }
  }, [])

  const handleInputChange = useCallback(
    async (value: string) => {
      setInput(value)

      if (value.trim().length > 3) {
        const result = await extractTaskData(value)
        if (result) {
          setExtracted(result)
          setEditedTitle(result.title)
          setEditedPriority(result.priority || 'medium')
          setEditedDueDate(
            result.due_date
              ? new Date(result.due_date).toISOString().split('T')[0]
              : ''
          )
        }
      } else {
        setExtracted(null)
      }
    },
    [extractTaskData]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!extracted || !editedTitle.trim()) {
      setError('Please enter a valid task')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit({
        title: editedTitle,
        priority: editedPriority,
        due_date: editedDueDate ? new Date(editedDueDate) : undefined,
      })

      setInput('')
      setExtracted(null)
      setEditedTitle('')
      setEditedPriority('medium')
      setEditedDueDate('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setInput('')
    setExtracted(null)
    setEditedTitle('')
    setEditedPriority('medium')
    setEditedDueDate('')
    setError(null)
    setShowVoiceInput(false)
  }

  const handleVoiceTranscript = useCallback(
    async (transcript: string) => {
      setInput(transcript)
      setShowVoiceInput(false)
      await handleInputChange(transcript)
    },
    [handleInputChange]
  )

  const handleVoiceError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    setShowVoiceInput(false)
  }, [])

  const toggleVoiceInput = () => {
    setShowVoiceInput(!showVoiceInput)
  }

  const getPriorityColor = (
    priority: 'low' | 'medium' | 'high' | 'critical'
  ) => {
    switch (priority) {
      case 'low':
        return colors.secondary
      case 'medium':
        return colors.info
      case 'high':
        return colors.warning
      case 'critical':
        return colors.danger
      default:
        return colors.secondary
    }
  }

  return (
    <Card padding="lg" style={{ marginBottom: spacing.lg }}>
      <form onSubmit={handleSubmit}>
        <Stack direction="vertical" spacing="md">
          <div
            style={{ position: 'relative', display: 'flex', gap: spacing.sm }}
          >
            <div style={{ flex: 1 }}>
              <Input
                type="text"
                value={input}
                onChange={e => handleInputChange(e.target.value)}
                placeholder={placeholder}
                fullWidth
                disabled={isSubmitting}
                aria-label="Task input"
                aria-describedby="task-input-help"
              />
            </div>
            <Button
              type="button"
              variant={showVoiceInput ? 'danger' : 'outline'}
              size="md"
              onClick={toggleVoiceInput}
              aria-label="Voice input"
              title="Voice input"
              style={{ whiteSpace: 'nowrap' }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M8 1a2 2 0 0 0-2 2v5a2 2 0 0 0 4 0V3a2 2 0 0 0-2-2zm0 10a4 4 0 0 1-4-4H3a5 5 0 0 0 4.5 4.975V14h-2v1h5v-1h-2v-2.025A5 5 0 0 0 13 7h-1a4 4 0 0 1-4 4z" />
              </svg>
            </Button>
          </div>

          {showVoiceInput && (
            <Card
              padding="md"
              style={{
                backgroundColor: colors.gray100,
                border: `1px solid ${colors.gray200}`,
              }}
            >
              <Stack direction="vertical" spacing="sm">
                <Text variant="body" style={{ fontWeight: 500 }}>
                  Voice Input
                </Text>
                <VoiceInput
                  onTranscript={handleVoiceTranscript}
                  onError={handleVoiceError}
                />
              </Stack>
            </Card>
          )}

          <span
            id="task-input-help"
            style={{ fontSize: '0.875rem', color: colors.gray600 }}
          >
            Type naturally or click the microphone to use voice input. We'll
            extract title, deadline, and priority.
          </span>

          {isExtracting && (
            <Text variant="body" color="gray600">
              Analyzing...
            </Text>
          )}

          {error && (
            <Text variant="body" style={{ color: colors.danger }}>
              {error}
            </Text>
          )}

          {extracted && !isExtracting && (
            <Card
              padding="md"
              style={{
                backgroundColor: colors.gray100,
                border: `1px solid ${colors.border.subtle}`,
              }}
            >
              <Stack direction="vertical" spacing="md">
                <Text variant="h5" style={{ marginBottom: spacing.xs }}>
                  Preview
                </Text>

                <div>
                  <label
                    htmlFor="edit-title"
                    style={{
                      display: 'block',
                      marginBottom: spacing.xs,
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  >
                    Title
                  </label>
                  <Input
                    id="edit-title"
                    type="text"
                    value={editedTitle}
                    onChange={e => setEditedTitle(e.target.value)}
                    fullWidth
                    aria-label="Edit task title"
                  />
                </div>

                <Stack direction="horizontal" spacing="md" wrap={true}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <label
                      htmlFor="edit-priority"
                      style={{
                        display: 'block',
                        marginBottom: spacing.xs,
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      Priority
                    </label>
                    <select
                      id="edit-priority"
                      value={editedPriority}
                      onChange={e =>
                        setEditedPriority(
                          e.target.value as
                            | 'low'
                            | 'medium'
                            | 'high'
                            | 'critical'
                        )
                      }
                      style={{
                        width: '100%',
                        padding: `${spacing.sm} ${spacing.md}`,
                        fontSize: '1rem',
                        borderRadius: '4px',
                        border: `1px solid ${colors.gray300}`,
                        backgroundColor: colors.white,
                      }}
                      aria-label="Edit task priority"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <label
                      htmlFor="edit-due-date"
                      style={{
                        display: 'block',
                        marginBottom: spacing.xs,
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      Due Date
                    </label>
                    <Input
                      id="edit-due-date"
                      type="date"
                      value={editedDueDate}
                      onChange={e => setEditedDueDate(e.target.value)}
                      fullWidth
                      aria-label="Edit task due date"
                    />
                  </div>
                </Stack>

                <Stack
                  direction="horizontal"
                  spacing="sm"
                  style={{ marginTop: spacing.sm }}
                >
                  <Badge
                    variant="info"
                    style={{
                      backgroundColor: getPriorityColor(editedPriority),
                    }}
                  >
                    {editedPriority}
                  </Badge>
                  {editedDueDate && (
                    <Badge variant="secondary">
                      Due: {new Date(editedDueDate).toLocaleDateString()}
                    </Badge>
                  )}
                </Stack>
              </Stack>
            </Card>
          )}

          {extracted && (
            <Stack direction="horizontal" spacing="sm">
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || !editedTitle.trim()}
                isLoading={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </Stack>
          )}
        </Stack>
      </form>
    </Card>
  )
}

export default TaskInput

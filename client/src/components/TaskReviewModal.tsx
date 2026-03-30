import React, { useState, useEffect } from 'react'
import { Modal, Input, Button, Badge, Stack, Text } from '../design-system'
import { colors, spacing } from '../design-system/tokens'
import type { ParsedTask } from './NLPTaskInput'

export interface TaskReviewModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (task: {
    title: string
    due_date?: Date
    due_time?: string
    priority: 'low' | 'medium' | 'high' | 'critical'
    location?: string
    category?: string
  }) => Promise<void>
  onEditAsManual: () => void
  parsedData: ParsedTask
}

type ConfidenceLevel = 'high' | 'medium' | 'low'

const getConfidenceLevel = (confidence: number): ConfidenceLevel => {
  if (confidence >= 0.7) return 'high'
  if (confidence >= 0.5) return 'medium'
  return 'low'
}

const getConfidenceColor = (level: ConfidenceLevel): string => {
  switch (level) {
    case 'high':
      return colors.success
    case 'medium':
      return colors.warning
    case 'low':
      return colors.danger
  }
}

const TaskReviewModal: React.FC<TaskReviewModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onEditAsManual,
  parsedData,
}) => {
  const [title, setTitle] = useState(parsedData.title || '')
  const [dueDate, setDueDate] = useState(
    parsedData.due_date
      ? new Date(parsedData.due_date).toISOString().split('T')[0]
      : ''
  )
  const [dueTime, setDueTime] = useState(parsedData.due_time || '')
  const [priority, setPriority] = useState<
    'low' | 'medium' | 'high' | 'critical'
  >(parsedData.priority || 'medium')
  const [location, setLocation] = useState(parsedData.location || '')
  const [category, setCategory] = useState(parsedData.category || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setTitle(parsedData.title || '')
      setDueDate(
        parsedData.due_date
          ? new Date(parsedData.due_date).toISOString().split('T')[0]
          : ''
      )
      setDueTime(parsedData.due_time || '')
      setPriority(parsedData.priority || 'medium')
      setLocation(parsedData.location || '')
      setCategory(parsedData.category || '')
      setError(null)
    }
  }, [isOpen, parsedData])

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onSave({
        title: title.trim(),
        due_date: dueDate ? new Date(dueDate) : undefined,
        due_time: dueTime || undefined,
        priority,
        location: location || undefined,
        category: category || undefined,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getConfidenceBadge = (field: string) => {
    const confidence = parsedData.confidence?.[field]
    if (confidence === undefined) return null

    const level = getConfidenceLevel(confidence)
    const color = getConfidenceColor(level)
    const percentage = Math.round(confidence * 100)

    return (
      <Badge
        variant="secondary"
        size="sm"
        style={{
          backgroundColor: color,
          color: colors.white,
          marginLeft: spacing.xs,
        }}
      >
        {percentage}%
      </Badge>
    )
  }

  const avgConfidence =
    Object.values(parsedData.confidence || {}).length > 0
      ? Object.values(parsedData.confidence).reduce((a, b) => a + b, 0) /
        Object.keys(parsedData.confidence).length
      : null

  const showLowConfidenceWarning = avgConfidence !== null && avgConfidence < 0.5

  const footer = (
    <Stack direction="horizontal" spacing="sm">
      <Button variant="ghost" onClick={onEditAsManual} disabled={isSubmitting}>
        Edit as Manual
      </Button>
      <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleSave}
        isLoading={isSubmitting}
        disabled={!title.trim()}
      >
        Save Task
      </Button>
    </Stack>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review Task"
      size="lg"
      footer={footer}
    >
      <Stack direction="vertical" spacing="lg">
        {showLowConfidenceWarning && (
          <div
            style={{
              backgroundColor: `${colors.warning}20`,
              border: `1px solid ${colors.warning}`,
              borderRadius: '8px',
              padding: spacing.md,
            }}
          >
            <Text variant="body" style={{ color: colors.dark }}>
              <strong>Low confidence detected.</strong> Some fields may not have
              been parsed correctly. Please review carefully or use "Edit as
              Manual" for full control.
            </Text>
          </div>
        )}

        {error && (
          <div
            style={{
              backgroundColor: `${colors.danger}20`,
              border: `1px solid ${colors.danger}`,
              borderRadius: '8px',
              padding: spacing.md,
            }}
          >
            <Text variant="body" style={{ color: colors.danger }}>
              {error}
            </Text>
          </div>
        )}

        <Stack direction="vertical" spacing="md">
          <div>
            <Stack direction="horizontal" spacing="xs" align="center">
              <label
                htmlFor="review-title"
                style={{
                  display: 'block',
                  marginBottom: spacing.xs,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                Title
              </label>
              {getConfidenceBadge('title')}
            </Stack>
            <Input
              id="review-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              fullWidth
              placeholder="Task title"
            />
          </div>

          <Stack direction="horizontal" spacing="md" wrap>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <Stack direction="horizontal" spacing="xs" align="center">
                <label
                  htmlFor="review-priority"
                  style={{
                    display: 'block',
                    marginBottom: spacing.xs,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  Priority
                </label>
                {getConfidenceBadge('priority')}
              </Stack>
              <select
                id="review-priority"
                value={priority}
                onChange={e =>
                  setPriority(
                    e.target.value as 'low' | 'medium' | 'high' | 'critical'
                  )
                }
                style={{
                  width: '100%',
                  padding: `${spacing.sm} ${spacing.md}`,
                  fontSize: '1rem',
                  borderRadius: '6px',
                  border: `1px solid ${colors.gray300}`,
                  backgroundColor: colors.white,
                  fontFamily: 'inherit',
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div style={{ flex: 1, minWidth: '200px' }}>
              <Stack direction="horizontal" spacing="xs" align="center">
                <label
                  htmlFor="review-due-date"
                  style={{
                    display: 'block',
                    marginBottom: spacing.xs,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  Due Date
                </label>
                {getConfidenceBadge('due_date')}
              </Stack>
              <Input
                id="review-due-date"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                fullWidth
              />
            </div>

            <div style={{ flex: 1, minWidth: '150px' }}>
              <Stack direction="horizontal" spacing="xs" align="center">
                <label
                  htmlFor="review-due-time"
                  style={{
                    display: 'block',
                    marginBottom: spacing.xs,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  Due Time
                </label>
                {getConfidenceBadge('due_time')}
              </Stack>
              <Input
                id="review-due-time"
                type="time"
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
                fullWidth
              />
            </div>
          </Stack>

          <Stack direction="horizontal" spacing="md" wrap>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <Stack direction="horizontal" spacing="xs" align="center">
                <label
                  htmlFor="review-location"
                  style={{
                    display: 'block',
                    marginBottom: spacing.xs,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  Location
                </label>
                {getConfidenceBadge('location')}
              </Stack>
              <Input
                id="review-location"
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                fullWidth
                placeholder="Optional"
              />
            </div>

            <div style={{ flex: 1, minWidth: '200px' }}>
              <Stack direction="horizontal" spacing="xs" align="center">
                <label
                  htmlFor="review-category"
                  style={{
                    display: 'block',
                    marginBottom: spacing.xs,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  Category
                </label>
                {getConfidenceBadge('category')}
              </Stack>
              <Input
                id="review-category"
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                fullWidth
                placeholder="Optional"
              />
            </div>
          </Stack>
        </Stack>

        {avgConfidence !== null && (
          <div
            style={{
              borderTop: `1px solid ${colors.gray200}`,
              paddingTop: spacing.md,
              marginTop: spacing.md,
            }}
          >
            <Text
              variant="body"
              style={{ fontSize: '0.75rem', color: colors.gray600 }}
            >
              Overall parsing confidence:{' '}
              <span
                style={{
                  color: getConfidenceColor(getConfidenceLevel(avgConfidence)),
                  fontWeight: 600,
                }}
              >
                {Math.round(avgConfidence * 100)}%
              </span>
            </Text>
          </div>
        )}
      </Stack>
    </Modal>
  )
}

export default TaskReviewModal

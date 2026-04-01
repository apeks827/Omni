import React, { useState } from 'react'
import {
  Button,
  Text,
  Input,
  Stack,
  spacing,
  colors,
} from '../../design-system'

interface TutorialScreenProps {
  onComplete: () => void
  onBack: () => void
}

const TutorialScreen: React.FC<TutorialScreenProps> = ({
  onComplete,
  onBack,
}) => {
  const [taskInput, setTaskInput] = useState('')
  const [showExample, setShowExample] = useState(false)

  const handleCreateTask = () => {
    if (taskInput.trim()) {
      setShowExample(true)
    }
  }

  return (
    <div
      style={{
        maxWidth: '700px',
        margin: '0 auto',
        padding: spacing.xxl,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: '100%',
      }}
    >
      <Stack spacing="xl">
        <div>
          <Text variant="h2" style={{ marginBottom: spacing.sm }}>
            Try it out: Create your first task
          </Text>
          <Text variant="body" color="gray600">
            Just describe what you need to do in natural language. We'll handle
            the rest.
          </Text>
        </div>

        <div
          style={{
            padding: spacing.xl,
            backgroundColor: colors.gray100,
            borderRadius: '12px',
          }}
        >
          <Input
            placeholder="e.g., 'Buy groceries on the way home' or 'Write report by Friday'"
            value={taskInput}
            onChange={e => setTaskInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleCreateTask()}
            fullWidth
            style={{ fontSize: '1.125rem' }}
          />
          <Button
            onClick={handleCreateTask}
            disabled={!taskInput.trim()}
            style={{ marginTop: spacing.md, width: '100%' }}
          >
            Create Task
          </Button>
        </div>

        {showExample && (
          <div
            style={{
              padding: spacing.lg,
              backgroundColor: colors.success,
              color: colors.white,
              borderRadius: '8px',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <Text
              variant="h3"
              style={{ marginBottom: spacing.sm, color: colors.white }}
            >
              ✓ Task Created!
            </Text>
            <Text variant="body" style={{ color: colors.white, opacity: 0.9 }}>
              We've analyzed your input and scheduled it based on your
              preferences and context.
            </Text>
          </div>
        )}

        <div
          style={{
            padding: spacing.lg,
            border: `2px dashed ${colors.gray300}`,
            borderRadius: '8px',
          }}
        >
          <Text variant="h3" style={{ marginBottom: spacing.md }}>
            💡 Example Schedule
          </Text>
          <Stack spacing="sm">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: spacing.sm,
              }}
            >
              <Text variant="body">Morning focus block</Text>
              <Text variant="body" color="gray600">
                9:00 - 11:00
              </Text>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: spacing.sm,
                backgroundColor: colors.gray100,
                borderRadius: '4px',
              }}
            >
              <Text variant="body">
                Your task: {taskInput || 'Write report'}
              </Text>
              <Text variant="body" color="gray600">
                11:00 - 12:00
              </Text>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: spacing.sm,
              }}
            >
              <Text variant="body">Lunch break</Text>
              <Text variant="body" color="gray600">
                12:00 - 13:00
              </Text>
            </div>
          </Stack>
          <Text
            variant="body"
            color="gray600"
            style={{ marginTop: spacing.md, fontSize: '0.875rem' }}
          >
            💡 Scheduled during your peak energy time for optimal focus
          </Text>
        </div>

        <div
          style={{ display: 'flex', gap: spacing.md, marginTop: spacing.lg }}
        >
          <Button variant="outline" onClick={onBack} style={{ flex: 1 }}>
            Back
          </Button>
          <Button onClick={onComplete} style={{ flex: 2 }}>
            Start Using Omni
          </Button>
        </div>
      </Stack>
    </div>
  )
}

export default TutorialScreen

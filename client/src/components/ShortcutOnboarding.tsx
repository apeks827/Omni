import React from 'react'
import { Modal, Button, Stack, Text } from '../design-system'
import ShortcutIndicator from './ShortcutIndicator'

interface OnboardingStep {
  title: string
  description: string
  shortcut?: string
}

interface ShortcutOnboardingProps {
  isOpen: boolean
  onClose: () => void
  completedSteps: string[]
  onStepComplete: (stepId: string) => void
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: 'Quick Task Creation',
    description:
      'Press n to instantly create a new task from anywhere in the app.',
    shortcut: 'n',
  },
  {
    title: 'Search Anywhere',
    description: 'Press / to focus the search bar without touching your mouse.',
    shortcut: '/',
  },
  {
    title: 'View All Shortcuts',
    description: 'Press ? to see all available keyboard shortcuts at any time.',
    shortcut: '?',
  },
  {
    title: 'Complete Tasks',
    description:
      'Press x to mark a task as complete. It will move to your completed list.',
    shortcut: 'x',
  },
  {
    title: 'Navigate Views',
    description:
      'Switch between list (l), board (b), and calendar (c) views instantly.',
    shortcut: 'b',
  },
]

const ShortcutOnboarding: React.FC<ShortcutOnboardingProps> = ({
  isOpen,
  onClose,
  completedSteps,
  onStepComplete,
}) => {
  const remainingSteps = ONBOARDING_STEPS.filter(
    step => !completedSteps.includes(step.title)
  )
  const nextStep = remainingSteps[0]

  const handleDismiss = () => {
    onStepComplete('onboarding-dismissed')
    onClose()
  }

  const handleGotIt = () => {
    if (nextStep) {
      onStepComplete(nextStep.title)
    }
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      size="sm"
      footer={
        <Stack direction="horizontal" spacing="md" justify="end">
          <Button variant="ghost" onClick={handleDismiss}>
            Don't show again
          </Button>
          <Button variant="primary" onClick={handleGotIt}>
            Got it!
          </Button>
        </Stack>
      }
    >
      {nextStep ? (
        <Stack spacing="md">
          <Text variant="h3">{nextStep.title}</Text>
          <Text variant="body" color="secondary">
            {nextStep.description}
          </Text>
          {nextStep.shortcut && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '16px 0',
              }}
            >
              <ShortcutIndicator shortcut={nextStep.shortcut} size="md" />
            </div>
          )}
        </Stack>
      ) : (
        <Stack spacing="md" align="center">
          <Text variant="h3">You're all set!</Text>
          <Text variant="body" color="secondary" align="center">
            You've learned all the essential shortcuts. Press ? anytime to
            review them.
          </Text>
          {ShortcutIndicator && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '16px 0',
              }}
            >
              <ShortcutIndicator shortcut="?" size="md" />
            </div>
          )}
        </Stack>
      )}
    </Modal>
  )
}

export default ShortcutOnboarding

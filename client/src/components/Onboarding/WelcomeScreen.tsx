import React from 'react'
import { Button, Text, Stack, spacing, colors } from '../../design-system'

interface WelcomeScreenProps {
  onNext: () => void
  onSkip: () => void
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNext, onSkip }) => {
  return (
    <div
      style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: spacing.xxl,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: '100%',
      }}
    >
      <Stack spacing="xl">
        <div style={{ textAlign: 'center' }}>
          <Text
            variant="h1"
            style={{ fontSize: '3rem', marginBottom: spacing.md }}
          >
            👋
          </Text>
          <Text variant="h1" style={{ marginBottom: spacing.md }}>
            Your Personal COO
          </Text>
          <Text variant="body" color="gray600" style={{ fontSize: '1.125rem' }}>
            Omni transforms chaos into flow. You're the Strategist, we're your
            Chief Operating Officer.
          </Text>
        </div>

        <Stack spacing="lg">
          <div
            style={{
              padding: spacing.lg,
              backgroundColor: colors.gray100,
              borderRadius: '8px',
            }}
          >
            <Text variant="h3" style={{ marginBottom: spacing.sm }}>
              🎯 Zero-Friction Input
            </Text>
            <Text variant="body" color="gray700">
              Just tell us what you need to do. We'll figure out when, where,
              and how to fit it into your life.
            </Text>
          </div>

          <div
            style={{
              padding: spacing.lg,
              backgroundColor: colors.gray100,
              borderRadius: '8px',
            }}
          >
            <Text variant="h3" style={{ marginBottom: spacing.sm }}>
              🌊 Fluid Calendar
            </Text>
            <Text variant="body" color="gray700">
              Your schedule adapts in real-time. Miss a task? We'll smoothly
              reschedule everything around it.
            </Text>
          </div>

          <div
            style={{
              padding: spacing.lg,
              backgroundColor: colors.gray100,
              borderRadius: '8px',
            }}
          >
            <Text variant="h3" style={{ marginBottom: spacing.sm }}>
              🔍 Glass Box Transparency
            </Text>
            <Text variant="body" color="gray700">
              Always know why something is scheduled. Full control, zero
              mystery.
            </Text>
          </div>
        </Stack>

        <div
          style={{ display: 'flex', gap: spacing.md, marginTop: spacing.lg }}
        >
          <Button variant="outline" onClick={onSkip} style={{ flex: 1 }}>
            Skip Setup
          </Button>
          <Button onClick={onNext} style={{ flex: 2 }}>
            Get Started
          </Button>
        </div>
      </Stack>
    </div>
  )
}

export default WelcomeScreen

import React from 'react'
import {
  Button,
  Text,
  Input,
  Stack,
  spacing,
  colors,
} from '../../design-system'
import { UserPreferences } from './OnboardingFlow'

interface PreferencesScreenProps {
  preferences: UserPreferences
  onUpdate: (preferences: UserPreferences) => void
  onNext: () => void
  onBack: () => void
}

const PreferencesScreen: React.FC<PreferencesScreenProps> = ({
  preferences,
  onUpdate,
  onNext,
  onBack,
}) => {
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
        <div>
          <Text variant="h2" style={{ marginBottom: spacing.sm }}>
            Let's personalize your experience
          </Text>
          <Text variant="body" color="gray600">
            Help us understand your rhythm so we can schedule tasks at the right
            time.
          </Text>
        </div>

        <Stack spacing="lg">
          <div>
            <Text variant="h3" style={{ marginBottom: spacing.md }}>
              Work Hours
            </Text>
            <div
              style={{ display: 'flex', gap: spacing.md, alignItems: 'center' }}
            >
              <Input
                type="time"
                label="Start"
                value={preferences.workHoursStart}
                onChange={e =>
                  onUpdate({ ...preferences, workHoursStart: e.target.value })
                }
                fullWidth
              />
              <Input
                type="time"
                label="End"
                value={preferences.workHoursEnd}
                onChange={e =>
                  onUpdate({ ...preferences, workHoursEnd: e.target.value })
                }
                fullWidth
              />
            </div>
          </div>

          <div>
            <Text variant="h3" style={{ marginBottom: spacing.md }}>
              Peak Energy Time
            </Text>
            <Text
              variant="body"
              color="gray600"
              style={{ marginBottom: spacing.sm }}
            >
              When do you do your best focused work?
            </Text>
            <div style={{ display: 'flex', gap: spacing.sm }}>
              {(['morning', 'afternoon', 'evening'] as const).map(time => (
                <Button
                  key={time}
                  variant={
                    preferences.peakEnergyTime === time ? 'primary' : 'outline'
                  }
                  onClick={() =>
                    onUpdate({ ...preferences, peakEnergyTime: time })
                  }
                  style={{ flex: 1, textTransform: 'capitalize' }}
                >
                  {time}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Text variant="h3" style={{ marginBottom: spacing.md }}>
              Notifications
            </Text>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={preferences.notificationsEnabled}
                onChange={e =>
                  onUpdate({
                    ...preferences,
                    notificationsEnabled: e.target.checked,
                  })
                }
                style={{ width: '20px', height: '20px' }}
              />
              <Text variant="body">
                Enable task reminders and notifications
              </Text>
            </label>
          </div>

          <div
            style={{
              padding: spacing.lg,
              backgroundColor: colors.gray100,
              borderRadius: '8px',
            }}
          >
            <Text variant="h3" style={{ marginBottom: spacing.sm }}>
              📅 Connect Calendar (Optional)
            </Text>
            <Text
              variant="body"
              color="gray600"
              style={{ marginBottom: spacing.md }}
            >
              Import existing commitments so we can schedule around them.
            </Text>
            <Button
              variant="outline"
              onClick={() =>
                onUpdate({
                  ...preferences,
                  calendarConnected: !preferences.calendarConnected,
                })
              }
            >
              {preferences.calendarConnected
                ? '✓ Connected'
                : 'Connect Calendar'}
            </Button>
          </div>
        </Stack>

        <div
          style={{ display: 'flex', gap: spacing.md, marginTop: spacing.lg }}
        >
          <Button variant="outline" onClick={onBack} style={{ flex: 1 }}>
            Back
          </Button>
          <Button onClick={onNext} style={{ flex: 2 }}>
            Continue
          </Button>
        </div>
      </Stack>
    </div>
  )
}

export default PreferencesScreen

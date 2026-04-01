import React, { useState } from 'react'
import { Text, spacing, colors } from '../../design-system'
import WelcomeScreen from './WelcomeScreen'
import PreferencesScreen from './PreferencesScreen'
import TutorialScreen from './TutorialScreen'

interface OnboardingFlowProps {
  onComplete: (preferences: UserPreferences) => void
  onSkip: () => void
}

export interface UserPreferences {
  workHoursStart: string
  workHoursEnd: string
  peakEnergyTime: 'morning' | 'afternoon' | 'evening'
  notificationsEnabled: boolean
  calendarConnected: boolean
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
  onSkip,
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [preferences, setPreferences] = useState<UserPreferences>({
    workHoursStart: '09:00',
    workHoursEnd: '17:00',
    peakEnergyTime: 'morning',
    notificationsEnabled: true,
    calendarConnected: false,
  })

  const steps = [
    <WelcomeScreen
      key="welcome"
      onNext={() => setCurrentStep(1)}
      onSkip={onSkip}
    />,
    <PreferencesScreen
      key="preferences"
      preferences={preferences}
      onUpdate={setPreferences}
      onNext={() => setCurrentStep(2)}
      onBack={() => setCurrentStep(0)}
    />,
    <TutorialScreen
      key="tutorial"
      onComplete={() => onComplete(preferences)}
      onBack={() => setCurrentStep(1)}
    />,
  ]

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.white,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: spacing.lg,
          borderBottom: `1px solid ${colors.gray200}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text variant="h2" style={{ margin: 0 }}>
          Welcome to Omni
        </Text>
        <div style={{ display: 'flex', gap: spacing.xs }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: '32px',
                height: '4px',
                borderRadius: '2px',
                backgroundColor:
                  i <= currentStep ? colors.primary : colors.gray300,
                transition: 'background-color 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>{steps[currentStep]}</div>
    </div>
  )
}

export default OnboardingFlow

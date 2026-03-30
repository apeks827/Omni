import { useState, useEffect } from 'react'

const ONBOARDING_KEY = 'omni_onboarding_completed'

export interface OnboardingState {
  isCompleted: boolean
  showOnboarding: boolean
  preferences: UserPreferences | null
}

export interface UserPreferences {
  workHoursStart: string
  workHoursEnd: string
  peakEnergyTime: 'morning' | 'afternoon' | 'evening'
  notificationsEnabled: boolean
  calendarConnected: boolean
}

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>(() => {
    const isCompleted = localStorage.getItem(ONBOARDING_KEY) === 'true'
    return {
      isCompleted,
      showOnboarding: !isCompleted,
      preferences: null,
    }
  })

  const completeOnboarding = (preferences: UserPreferences) => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    localStorage.setItem('omni_user_preferences', JSON.stringify(preferences))
    setState({
      isCompleted: true,
      showOnboarding: false,
      preferences,
    })
  }

  const skipOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setState({
      isCompleted: true,
      showOnboarding: false,
      preferences: null,
    })
  }

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY)
    localStorage.removeItem('omni_user_preferences')
    setState({
      isCompleted: false,
      showOnboarding: true,
      preferences: null,
    })
  }

  return {
    ...state,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
  }
}

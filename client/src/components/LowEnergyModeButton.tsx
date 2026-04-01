import { useState, useEffect } from 'react'
import { Button } from '../design-system'
import { colors } from '../design-system/tokens'

interface LowEnergyModeButtonProps {
  onToggle: (enabled: boolean) => void
  initialEnabled?: boolean
}

export default function LowEnergyModeButton({
  onToggle,
  initialEnabled = false,
}: LowEnergyModeButtonProps) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchEnergyLevel()
  }, [])

  const fetchEnergyLevel = async () => {
    try {
      const response = await fetch('/api/energy/me/level')
      if (response.ok) {
        const data = await response.json()
        if (data.isSet && data.energyLevel === 'low') {
          setEnabled(true)
        }
      }
    } catch (error) {
      console.error('Failed to fetch energy level:', error)
    }
  }

  const handleToggle = async () => {
    setIsLoading(true)
    const newState = !enabled

    try {
      const response = await fetch('/api/energy/me/level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ energyLevel: newState ? 'low' : 'normal' }),
      })

      if (response.ok) {
        setEnabled(newState)
        onToggle(newState)
      }
    } catch (error) {
      console.error('Failed to toggle low energy mode:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={enabled ? 'warning' : 'outline'}
      onClick={handleToggle}
      isLoading={isLoading}
      style={{
        backgroundColor: enabled ? colors.warning : 'transparent',
        borderColor: colors.warning,
        color: enabled ? colors.dark : colors.warning,
      }}
    >
      {enabled ? '😴 Low Energy Mode ON' : '😴 Low Energy Mode'}
    </Button>
  )
}

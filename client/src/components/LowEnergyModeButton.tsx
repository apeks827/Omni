import { useState } from 'react'
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

  const handleToggle = async () => {
    setIsLoading(true)
    const newState = !enabled

    try {
      const response = await fetch('/api/schedule/low-energy-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newState }),
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

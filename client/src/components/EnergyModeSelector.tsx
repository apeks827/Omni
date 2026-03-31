import { useState, useEffect } from 'react'
import { colors, spacing } from '../design-system/tokens'

type EnergyLevel = 'low' | 'normal' | 'high'

interface EnergyModeSelectorProps {
  onEnergyChange?: (level: EnergyLevel) => void
}

export default function EnergyModeSelector({
  onEnergyChange,
}: EnergyModeSelectorProps) {
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchCurrentEnergyLevel()
  }, [])

  const fetchCurrentEnergyLevel = async () => {
    try {
      const response = await fetch('/api/energy/me/level')
      if (response.ok) {
        const data = await response.json()
        if (data.isSet) {
          setEnergyLevel(data.energyLevel)
        }
      }
    } catch (error) {
      console.error('Failed to fetch energy level:', error)
    }
  }

  const handleEnergyChange = async (level: EnergyLevel) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/energy/me/level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ energyLevel: level }),
      })

      if (response.ok) {
        setEnergyLevel(level)
        onEnergyChange?.(level)
      }
    } catch (error) {
      console.error('Failed to set energy level:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getButtonStyle = (level: EnergyLevel) => {
    const isActive = energyLevel === level
    const levelColors = {
      low: colors.info,
      normal: colors.success,
      high: colors.warning,
    }
    const activeColor = levelColors[level]
    return {
      flex: 1,
      padding: spacing.md,
      borderRadius: '8px',
      border: `2px solid ${isActive ? activeColor : colors.border.default}`,
      backgroundColor: isActive ? activeColor : 'transparent',
      color: isActive ? colors.white : colors.text.secondary,
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontWeight: 500,
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
      }}
    >
      <label
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: colors.text.primary,
        }}
      >
        Energy Level Today
      </label>
      <div
        style={{
          display: 'flex',
          gap: spacing.sm,
        }}
      >
        <button
          onClick={() => handleEnergyChange('low')}
          disabled={isLoading}
          style={getButtonStyle('low')}
        >
          Low
        </button>
        <button
          onClick={() => handleEnergyChange('normal')}
          disabled={isLoading}
          style={getButtonStyle('normal')}
        >
          Normal
        </button>
        <button
          onClick={() => handleEnergyChange('high')}
          disabled={isLoading}
          style={getButtonStyle('high')}
        >
          High
        </button>
      </div>
    </div>
  )
}

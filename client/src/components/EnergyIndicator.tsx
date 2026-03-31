import { useEffect, useState } from 'react'
import { colors, spacing } from '../design-system/tokens'

type EnergyLevel = 'low' | 'normal' | 'high'

export default function EnergyIndicator() {
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel | null>(null)

  useEffect(() => {
    fetchEnergyLevel()
  }, [])

  const fetchEnergyLevel = async () => {
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

  if (!energyLevel) {
    return null
  }

  const getEnergyConfig = () => {
    switch (energyLevel) {
      case 'low':
        return {
          label: 'Low Energy',
          icon: '🔋',
          color: colors.info,
          bgColor: 'rgba(23, 162, 184, 0.1)',
        }
      case 'normal':
        return {
          label: 'Normal Energy',
          icon: '⚡',
          color: colors.success,
          bgColor: 'rgba(40, 167, 69, 0.1)',
        }
      case 'high':
        return {
          label: 'High Energy',
          icon: '🚀',
          color: colors.warning,
          bgColor: 'rgba(255, 193, 7, 0.1)',
        }
    }
  }

  const config = getEnergyConfig()

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing.xs,
        padding: `${spacing.xs} ${spacing.sm}`,
        borderRadius: '16px',
        backgroundColor: config.bgColor,
        border: `1px solid ${config.color}`,
      }}
    >
      <span style={{ fontSize: '16px' }}>{config.icon}</span>
      <span
        style={{
          fontSize: '13px',
          fontWeight: 500,
          color: config.color,
        }}
      >
        {config.label}
      </span>
    </div>
  )
}

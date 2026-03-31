import React from 'react'
import {
  spacing,
  borderRadius,
  typography,
  colors,
} from '../../design-system/tokens'
import { contextService, Context } from '../../services/contextDetection'

interface ContextTaskFilterProps {
  showContextOnly: boolean
  onToggleContextFilter: (show: boolean) => void
  onDeviceChange?: (device: string) => void
  onTimeChange?: (time: string) => void
}

const ContextTaskFilter: React.FC<ContextTaskFilterProps> = ({
  showContextOnly,
  onToggleContextFilter,
}) => {
  const context = contextService.getContext()

  const getCurrentContextInfo = (ctx: Context | null) => {
    if (!ctx) return { device: 'Unknown', time: 'Unknown' }

    const deviceLabels: Record<string, string> = {
      desktop: '💻 Desktop',
      mobile: '📱 Mobile',
      tablet: '📲 Tablet',
    }

    const timeLabels: Record<string, string> = {
      morning: '🌅 Morning',
      afternoon: '☀️ Afternoon',
      evening: '🌆 Evening',
      night: '🌙 Night',
    }

    return {
      device: deviceLabels[ctx.device.type] || ctx.device.type,
      time: timeLabels[ctx.time.timeOfDay] || ctx.time.timeOfDay,
    }
  }

  const contextInfo = getCurrentContextInfo(context)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.md,
        padding: `${spacing.sm} ${spacing.md}`,
        backgroundColor: showContextOnly ? colors.primary : colors.gray100,
        borderRadius: borderRadius.md,
        border: `1px solid ${showContextOnly ? colors.primary : colors.gray300}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
        <span style={{ fontSize: typography.fontSize.sm }}>
          {contextInfo.device}
        </span>
        <span style={{ color: colors.gray600 }}>•</span>
        <span style={{ fontSize: typography.fontSize.sm }}>
          {contextInfo.time}
        </span>
      </div>

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          cursor: 'pointer',
          marginLeft: 'auto',
        }}
      >
        <span
          style={{
            fontSize: typography.fontSize.sm,
            color: showContextOnly ? colors.white : colors.text.primary,
            fontWeight: showContextOnly
              ? typography.fontWeight.semibold
              : typography.fontWeight.normal,
          }}
        >
          Context filter
        </span>
        <input
          type="checkbox"
          checked={showContextOnly}
          onChange={e => onToggleContextFilter(e.target.checked)}
          style={{
            width: '18px',
            height: '18px',
            accentColor: colors.primary,
            cursor: 'pointer',
          }}
        />
      </label>
    </div>
  )
}

export default ContextTaskFilter

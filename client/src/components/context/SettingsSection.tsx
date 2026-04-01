import React from 'react'
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from '../../design-system/tokens'

interface SettingsSectionProps {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  icon,
  children,
}) => {
  return (
    <div
      style={{
        backgroundColor: colors.white,
        border: `1px solid ${colors.border.subtle}`,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.md,
        }}
      >
        {icon && (
          <span style={{ fontSize: typography.fontSize.lg }}>{icon}</span>
        )}
        <h3
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: colors.text.primary,
            margin: 0,
          }}
        >
          {title}
        </h3>
      </div>
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}
      >
        {children}
      </div>
    </div>
  )
}

export default SettingsSection

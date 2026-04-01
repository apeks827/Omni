import React, { useState } from 'react'
import { colors, spacing } from '../../design-system/tokens'
import Toggle from '../../design-system/components/Toggle/Toggle'
import SettingsSection from './SettingsSection'
import LocationPermissionModal from './LocationPermissionModal'
import Button from '../../design-system/components/Button/Button'
import { useContextPermission } from '../../hooks/useContext'

const ContextSettings: React.FC = () => {
  const [deviceEnabled, setDeviceEnabled] = useState(true)
  const [timeEnabled, setTimeEnabled] = useState(true)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const {
    hasPermission: locationEnabled,
    requestPermission,
    revokePermission,
  } = useContextPermission('location')

  const handleLocationToggle = (checked: boolean) => {
    if (checked) {
      setShowLocationModal(true)
    } else {
      revokePermission()
    }
  }

  const handleEnableLocation = async () => {
    return await requestPermission()
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: spacing.lg }}>
      <h1
        style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          marginBottom: spacing.lg,
          color: colors.text.primary,
        }}
      >
        Context Detection Settings
      </h1>

      <div
        style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}
      >
        <SettingsSection title="Device Context" icon="💻">
          <Toggle
            checked={deviceEnabled}
            onChange={setDeviceEnabled}
            label="Detect device type"
            description="Suggest work tasks on desktop, errands on mobile"
          />
        </SettingsSection>

        <SettingsSection title="Time Context" icon="⏰">
          <Toggle
            checked={timeEnabled}
            onChange={setTimeEnabled}
            label="Time-based suggestions"
            description="Adjust task suggestions based on time of day"
          />
        </SettingsSection>

        <SettingsSection title="Location Context" icon="📍">
          <Toggle
            checked={locationEnabled}
            onChange={handleLocationToggle}
            label="Location detection"
            description="Requires: Location permission"
          />
          <div
            style={{
              fontSize: '0.75rem',
              color: colors.text.secondary,
              padding: spacing.sm,
              backgroundColor: colors.bg.subtle,
              borderRadius: '4px',
            }}
          >
            Privacy: Location never leaves your device
          </div>
        </SettingsSection>
      </div>

      <div
        style={{
          marginTop: spacing.lg,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Button variant="outline">Back to Settings</Button>
        <Button variant="primary">Save Changes</Button>
      </div>

      <LocationPermissionModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onEnable={handleEnableLocation}
      />
    </div>
  )
}

export default ContextSettings

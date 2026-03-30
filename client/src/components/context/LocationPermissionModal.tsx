import React, { useState } from 'react'
import { colors, spacing, borderRadius } from '../../design-system/tokens'
import Button from '../../design-system/components/Button/Button'
import Modal from '../../design-system/components/Modal/Modal'

interface LocationPermissionModalProps {
  isOpen: boolean
  onClose: () => void
  onEnable: () => Promise<boolean>
}

const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
  isOpen,
  onClose,
  onEnable,
}) => {
  const [isLoading, setIsLoading] = useState(false)

  const handleEnable = async () => {
    setIsLoading(true)
    try {
      const granted = await onEnable()
      if (granted) {
        onClose()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div style={{ textAlign: 'center', padding: spacing.lg }}>
        <div style={{ fontSize: '3rem', marginBottom: spacing.md }}>📍</div>
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            marginBottom: spacing.md,
            color: colors.text.primary,
          }}
        >
          Enable Location Detection?
        </h2>
        <p
          style={{
            fontSize: '0.875rem',
            color: colors.text.secondary,
            marginBottom: spacing.lg,
            lineHeight: 1.5,
          }}
        >
          We'd like to suggest errands when you're near stores, and work tasks
          when you're at your desk.
        </p>
        <div
          style={{
            backgroundColor: colors.bg.subtle,
            border: `1px solid ${colors.border.subtle}`,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            marginBottom: spacing.lg,
            textAlign: 'left',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: spacing.sm,
              alignItems: 'flex-start',
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>🔒</span>
            <div>
              <p
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  margin: 0,
                  marginBottom: spacing.xs,
                  color: colors.text.primary,
                }}
              >
                Privacy Guarantee
              </p>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: colors.text.secondary,
                  margin: 0,
                }}
              >
                Your location never leaves your device. All processing happens
                locally.
              </p>
            </div>
          </div>
        </div>
        <div
          style={{ display: 'flex', gap: spacing.sm, justifyContent: 'center' }}
        >
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Not Now
          </Button>
          <Button
            variant="primary"
            onClick={handleEnable}
            isLoading={isLoading}
          >
            Enable Location
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default LocationPermissionModal

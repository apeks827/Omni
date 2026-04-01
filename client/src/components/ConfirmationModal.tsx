import React from 'react'
import { Modal, Button, Stack, Text } from '../design-system'

interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'warning'
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <Stack spacing="md" style={{ padding: '16px' }}>
        <Text variant="body">{message}</Text>
        <Stack direction="horizontal" spacing="md" justify="end">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'warning'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </Stack>
      </Stack>
    </Modal>
  )
}

export default ConfirmationModal

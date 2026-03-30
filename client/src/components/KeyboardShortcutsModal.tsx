import React from 'react'
import { Modal, Button, Text } from '../design-system'

interface Shortcut {
  key: string
  description: string
  category: string
}

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
  shortcuts: Shortcut[]
}

const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  shortcuts,
}) => {
  const categories = Array.from(new Set(shortcuts.map(s => s.category)))

  const keyStyles: React.CSSProperties = {
    display: 'inline-block',
    padding: '4px 8px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '0.875rem',
    fontWeight: 600,
  }

  const rowStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #e5e7eb',
  }

  const categoryStyles: React.CSSProperties = {
    marginTop: '24px',
    marginBottom: '12px',
    fontSize: '1.125rem',
    fontWeight: 600,
    color: '#374151',
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      size="md"
      footer={
        <Button variant="primary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {categories.map(category => (
          <div key={category}>
            <div style={categoryStyles}>{category}</div>
            {shortcuts
              .filter(s => s.category === category)
              .map((shortcut, idx) => (
                <div key={idx} style={rowStyles}>
                  <Text variant="body">{shortcut.description}</Text>
                  <span style={keyStyles}>{shortcut.key}</span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </Modal>
  )
}

export default KeyboardShortcutsModal

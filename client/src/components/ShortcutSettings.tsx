import React, { useState } from 'react'
import { Modal, Button, Stack, Text, Input } from '../design-system'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { ShortcutDefinition } from '../services/shortcutManager'

interface ShortcutSettingsProps {
  isOpen: boolean
  onClose: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  navigation: 'Navigation',
  tasks: 'Tasks',
  editing: 'Editing',
  views: 'Views',
  system: 'System',
}

const ShortcutSettings: React.FC<ShortcutSettingsProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    conflicts,
    updateShortcut,
    resetShortcut,
    resetAll,
    getShortcutsByCategory,
  } = useKeyboardShortcuts()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const byCategory = getShortcutsByCategory()

  const handleStartEdit = (shortcut: { id: string; key: string }) => {
    setEditingId(shortcut.id)
    setEditValue(shortcut.key)
  }

  const handleSaveEdit = () => {
    if (editingId) {
      updateShortcut(editingId, editValue)
      setEditingId(null)
      setEditValue('')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditValue('')
  }

  const keyInputStyles: React.CSSProperties = {
    width: '80px',
    textAlign: 'center',
    fontFamily: 'monospace',
    fontWeight: 600,
  }

  const rowStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #e5e7eb',
  }

  const conflictStyles: React.CSSProperties = {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '16px',
    color: '#dc2626',
    fontSize: '0.875rem',
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customize Shortcuts"
      size="md"
      footer={
        <Stack direction="horizontal" spacing="md" justify="end">
          <Button variant="secondary" onClick={resetAll}>
            Reset All
          </Button>
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </Stack>
      }
    >
      <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {conflicts.length > 0 && (
          <div style={conflictStyles}>
            <strong>Conflicts detected:</strong>
            <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
              {conflicts.map((c, i) => (
                <li key={i}>{c.message}</li>
              ))}
            </ul>
          </div>
        )}

        {Object.entries(byCategory).map(([category, categoryShortcuts]) => (
          <div key={category} style={{ marginBottom: '24px' }}>
            <Text variant="h4" style={{ marginBottom: '12px' }}>
              {CATEGORY_LABELS[category] || category}
            </Text>
            {categoryShortcuts.map((shortcut: ShortcutDefinition) => (
              <div key={shortcut.id} style={rowStyles}>
                <Text variant="body">{shortcut.description}</Text>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {editingId === shortcut.id ? (
                    <>
                      <Input
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        style={keyInputStyles}
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveEdit()
                          if (e.key === 'Escape') handleCancelEdit()
                        }}
                      />
                      <Button size="sm" onClick={handleSaveEdit}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() =>
                          handleStartEdit(
                            shortcut as unknown as { id: string; key: string }
                          )
                        }
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#f3f4f6',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontFamily: 'monospace',
                          cursor: 'pointer',
                          minWidth: '60px',
                          textAlign: 'center',
                        }}
                      >
                        {shortcut.key}
                      </button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => resetShortcut(shortcut.id)}
                        title="Reset to default"
                      >
                        Reset
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Modal>
  )
}

export default ShortcutSettings

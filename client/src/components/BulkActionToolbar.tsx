import React, { useState } from 'react'
import { Button, Stack, Badge } from '../design-system'
import { Task } from '../types'

interface BulkActionToolbarProps {
  selectedCount: number
  onBulkStatusChange: (status: Task['status']) => void
  onBulkPriorityChange: (priority: Task['priority']) => void
  onBulkDelete: () => void
  onClearSelection: () => void
}

const BulkActionToolbar: React.FC<BulkActionToolbarProps> = ({
  selectedCount,
  onBulkStatusChange,
  onBulkPriorityChange,
  onBulkDelete,
  onClearSelection,
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showPriorityMenu, setShowPriorityMenu] = useState(false)

  if (selectedCount === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#1a1a1a',
        padding: '16px 24px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        zIndex: 1000,
      }}
    >
      <Stack direction="horizontal" spacing="md" align="center">
        <Badge variant="primary" size="md">
          {selectedCount} selected
        </Badge>

        <div style={{ position: 'relative' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowStatusMenu(!showStatusMenu)}
          >
            Change Status
          </Button>
          {showStatusMenu && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                marginBottom: '8px',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                minWidth: '150px',
              }}
            >
              {(['todo', 'in_progress', 'done'] as Task['status'][]).map(
                status => (
                  <button
                    key={status}
                    onClick={() => {
                      onBulkStatusChange(status)
                      setShowStatusMenu(false)
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 16px',
                      border: 'none',
                      background: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    {status.replace('_', ' ')}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowPriorityMenu(!showPriorityMenu)}
          >
            Change Priority
          </Button>
          {showPriorityMenu && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                marginBottom: '8px',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                minWidth: '150px',
              }}
            >
              {(
                ['low', 'medium', 'high', 'critical'] as Task['priority'][]
              ).map(priority => (
                <button
                  key={priority}
                  onClick={() => {
                    onBulkPriorityChange(priority)
                    setShowPriorityMenu(false)
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 16px',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  {priority}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button variant="danger" size="sm" onClick={onBulkDelete}>
          Delete
        </Button>

        <Button variant="secondary" size="sm" onClick={onClearSelection}>
          Clear
        </Button>
      </Stack>
    </div>
  )
}

export default BulkActionToolbar

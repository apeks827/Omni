import React, { useState } from 'react'
import Modal from '../../design-system/components/Modal/Modal'
import Button from '../../design-system/components/Button/Button'
import { spacing } from '../../design-system/tokens'

interface TeamCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (team: TeamInput) => void
  defaultWorkspaceId: string
}

interface TeamInput {
  name: string
  description?: string
  workspaceId: string
  settings: {
    defaultRole: 'owner' | 'admin' | 'member' | 'guest'
    allowGuestAccess: boolean
    requireApproval: boolean
  }
}

const TeamCreateModal: React.FC<TeamCreateModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  defaultWorkspaceId,
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [defaultRole, setDefaultRole] = useState<
    'owner' | 'admin' | 'member' | 'guest'
  >('member')
  const [allowGuestAccess, setAllowGuestAccess] = useState(false)
  const [requireApproval, setRequireApproval] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Team name is required')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await onCreate({
        name: name.trim(),
        description: description.trim() || undefined,
        workspaceId: defaultWorkspaceId,
        settings: {
          defaultRole,
          allowGuestAccess,
          requireApproval,
        },
      })

      setName('')
      setDescription('')
      setDefaultRole('member')
      setAllowGuestAccess(false)
      setRequireApproval(false)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team')
    } finally {
      setIsLoading(false)
    }
  }

  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: spacing.sm,
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '14px',
  }

  const labelStyles: React.CSSProperties = {
    display: 'block',
    marginBottom: spacing.xs,
    fontWeight: 500,
    fontSize: '14px',
  }

  const sectionStyles: React.CSSProperties = {
    marginBottom: spacing.md,
  }

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose} disabled={isLoading}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSubmit} isLoading={isLoading}>
        Create Team
      </Button>
    </>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Team"
      footer={footer}
    >
      <form onSubmit={handleSubmit}>
        <div style={sectionStyles}>
          <label style={labelStyles}>Team Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter team name..."
            style={inputStyles}
            disabled={isLoading}
          />
        </div>

        <div style={sectionStyles}>
          <label style={labelStyles}>Description (optional)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What is this team about?"
            rows={3}
            style={{ ...inputStyles, resize: 'vertical' }}
            disabled={isLoading}
          />
        </div>

        <div
          style={{
            ...sectionStyles,
            padding: spacing.md,
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: spacing.sm }}>
            Settings
          </div>

          <div style={{ marginBottom: spacing.sm }}>
            <label style={labelStyles}>Default Role</label>
            <select
              value={defaultRole}
              onChange={e =>
                setDefaultRole(e.target.value as 'member' | 'admin' | 'guest')
              }
              style={inputStyles}
              disabled={isLoading}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="guest">Guest</option>
            </select>
          </div>

          <div style={{ marginBottom: spacing.xs }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={allowGuestAccess}
                onChange={e => setAllowGuestAccess(e.target.checked)}
                style={{ marginRight: spacing.xs }}
                disabled={isLoading}
              />
              Allow guest access
            </label>
          </div>

          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={requireApproval}
                onChange={e => setRequireApproval(e.target.checked)}
                style={{ marginRight: spacing.xs }}
                disabled={isLoading}
              />
              Require approval for new members
            </label>
          </div>
        </div>

        {error && (
          <div
            style={{
              color: '#dc3545',
              fontSize: '14px',
              marginTop: spacing.sm,
            }}
          >
            {error}
          </div>
        )}
      </form>
    </Modal>
  )
}

export default TeamCreateModal

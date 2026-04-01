import React from 'react'

interface ShortcutIndicatorProps {
  shortcut: string
  size?: 'sm' | 'md'
}

const ShortcutIndicator: React.FC<ShortcutIndicatorProps> = ({
  shortcut,
  size = 'sm',
}) => {
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    padding: size === 'sm' ? '2px 6px' : '4px 8px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: size === 'sm' ? '0.75rem' : '0.875rem',
    fontWeight: 600,
    color: '#6b7280',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  }

  const keys = shortcut.split('+').map(k => k.trim())

  return (
    <span style={baseStyles}>
      {keys.map((key, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <span style={{ margin: '0 2px' }}>+</span>}
          <span>{key}</span>
        </React.Fragment>
      ))}
    </span>
  )
}

export default ShortcutIndicator

import React, { useState, useEffect } from 'react'
import { colors, borderRadius, typography } from '../design-system/tokens'
import NotificationList from './NotificationList'
import { useNotifications } from '../hooks/useNotifications'

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { unreadCount } = useNotifications()
  const [isPulsing, setIsPulsing] = useState(false)
  const [prevUnreadCount, setPrevUnreadCount] = useState(unreadCount)

  useEffect(() => {
    if (unreadCount > prevUnreadCount) {
      setIsPulsing(true)
      setTimeout(() => setIsPulsing(false), 600)
    }
    setPrevUnreadCount(unreadCount)
  }, [unreadCount, prevUnreadCount])

  const containerStyles: React.CSSProperties = {
    position: 'relative',
  }

  const bellStyles: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '44px',
    height: '44px',
    cursor: 'pointer',
    borderRadius: borderRadius.lg,
    transition: 'background-color 0.2s ease, transform 0.1s ease',
    backgroundColor: isOpen ? colors.primary + '15' : 'transparent',
    border: isOpen ? `2px solid ${colors.primary}` : '2px solid transparent',
  }

  const badgeContainerStyles: React.CSSProperties = {
    position: 'absolute',
    top: '2px',
    right: '2px',
    animation: isPulsing ? 'pulse 0.6s ease-in-out' : 'none',
  }

  const iconStyles: React.CSSProperties = {
    fontSize: '22px',
    color: isOpen ? colors.primary : colors.gray700,
    transition: 'color 0.2s ease',
  }

  const pulseKeyframes = `
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
  `

  return (
    <>
      <style>{pulseKeyframes}</style>
      <div style={containerStyles}>
        <div
          style={bellStyles}
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={e => {
            if (!isOpen) {
              e.currentTarget.style.backgroundColor = colors.gray100
            }
          }}
          onMouseLeave={e => {
            if (!isOpen) {
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
          onMouseDown={e => {
            e.currentTarget.style.transform = 'scale(0.95)'
          }}
          onMouseUp={e => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
          role="button"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <span style={iconStyles}>🔔</span>
          {unreadCount > 0 && (
            <div style={badgeContainerStyles}>
              <div
                style={{
                  minWidth: '20px',
                  height: '20px',
                  padding: '0 6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.danger,
                  color: colors.white,
                  borderRadius: borderRadius.full,
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.bold,
                  boxShadow: `0 0 0 2px ${colors.white}`,
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            </div>
          )}
        </div>
        <NotificationList isOpen={isOpen} />
      </div>
    </>
  )
}

export default NotificationBell

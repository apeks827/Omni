import React from 'react'
import {
  colors,
  spacing,
  shadows,
  borderRadius,
  typography,
} from '../design-system/tokens'
import { useNotifications } from '../hooks/useNotifications'
import { Notification } from '../types'
import Button from '../design-system/components/Button/Button'

interface NotificationListProps {
  isOpen: boolean
}

const NotificationList: React.FC<NotificationListProps> = ({ isOpen }) => {
  const { notifications, loading, markAsRead, markAllAsRead } =
    useNotifications()

  if (!isOpen) return null

  const containerStyles: React.CSSProperties = {
    position: 'absolute',
    top: '50px',
    right: '0',
    width: '400px',
    maxHeight: '500px',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    boxShadow: shadows.lg,
    border: `1px solid ${colors.border.subtle}`,
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
  }

  const headerStyles: React.CSSProperties = {
    padding: spacing.md,
    borderBottom: `1px solid ${colors.border.subtle}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray900,
  }

  const listStyles: React.CSSProperties = {
    overflowY: 'auto',
    maxHeight: '400px',
  }

  const emptyStyles: React.CSSProperties = {
    padding: spacing.xl,
    textAlign: 'center',
    color: colors.gray500,
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read_status) {
      await markAsRead(notification.id)
    }
  }

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <span style={titleStyles}>Notifications</span>
        {notifications.length > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            Mark all read
          </Button>
        )}
      </div>
      <div style={listStyles}>
        {loading ? (
          <div style={emptyStyles}>Loading...</div>
        ) : notifications.length === 0 ? (
          <div style={emptyStyles}>No notifications</div>
        ) : (
          notifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClick={() => handleNotificationClick(notification)}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface NotificationItemProps {
  notification: Notification
  onClick: () => void
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
}) => {
  const itemStyles: React.CSSProperties = {
    padding: spacing.md,
    borderBottom: `1px solid ${colors.border.subtle}`,
    cursor: 'pointer',
    backgroundColor: notification.read_status ? colors.white : colors.gray100,
    transition: 'background-color 0.2s ease',
  }

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray900,
    marginBottom: spacing.xs,
  }

  const bodyStyles: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    marginBottom: spacing.xs,
  }

  const timeStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  return (
    <div style={itemStyles} onClick={onClick}>
      <div style={titleStyles}>{notification.title}</div>
      {notification.body && <div style={bodyStyles}>{notification.body}</div>}
      <div style={timeStyles}>{formatTime(notification.created_at)}</div>
    </div>
  )
}

export default NotificationList

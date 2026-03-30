import { useState, useEffect, useCallback } from 'react'
import { notificationApi } from '../services/notificationApi'
import { Notification } from '../types'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await notificationApi.getNotifications()
      setNotifications(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch notifications'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationApi.getUnreadCount()
      setUnreadCount(count)
    } catch (err) {
      console.error('Failed to fetch unread count:', err)
    }
  }, [])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationApi.markAsRead(notificationId)
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read_status: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as read')
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read_status: true })))
      setUnreadCount(0)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to mark all as read'
      )
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications, fetchUnreadCount])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  }
}

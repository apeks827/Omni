import { Router } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import notificationService from '../services/notifications/notification.service.js'

const router = Router()

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    const limit = parseInt(req.query.limit as string) || 50
    const offset = parseInt(req.query.offset as string) || 0

    const notifications = await notificationService.getNotifications(
      userId,
      limit,
      offset
    )
    res.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

router.get(
  '/unread-count',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!
      const count = await notificationService.getUnreadCount(userId)
      res.json({ count })
    } catch (error) {
      console.error('Error fetching unread count:', error)
      res.status(500).json({ error: 'Failed to fetch unread count' })
    }
  }
)

router.patch('/:id/read', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    const notificationId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id
    const success = await notificationService.markAsRead(notificationId, userId)
    if (success) {
      res.json({ success: true })
    } else {
      res.status(404).json({ error: 'Notification not found' })
    }
  } catch (error) {
    console.error('Error marking notification as read:', error)
    res.status(500).json({ error: 'Failed to mark notification as read' })
  }
})

router.post(
  '/mark-all-read',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!
      const count = await notificationService.markAllAsRead(userId)
      res.json({ count })
    } catch (error) {
      console.error('Error marking all as read:', error)
      res.status(500).json({ error: 'Failed to mark all as read' })
    }
  }
)

router.get('/preferences', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    const preferences = await notificationService.getPreferences(userId)
    res.json(preferences)
  } catch (error) {
    console.error('Error fetching preferences:', error)
    res.status(500).json({ error: 'Failed to fetch preferences' })
  }
})

router.put('/preferences', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    const updates = req.body
    await notificationService.updatePreferences(userId, updates)
    res.json({ success: true })
  } catch (error) {
    console.error('Error updating preferences:', error)
    res.status(500).json({ error: 'Failed to update preferences' })
  }
})

router.patch('/:id/snooze', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    const notificationId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id
    const { minutes } = req.body
    const snoozedUntil = new Date(Date.now() + (minutes || 60) * 60 * 1000)
    const success = await notificationService.snoozeNotification(
      notificationId,
      userId,
      snoozedUntil
    )
    if (success) {
      res.json({ success: true, snoozed_until: snoozedUntil })
    } else {
      res.status(404).json({ error: 'Notification not found' })
    }
  } catch (error) {
    console.error('Error snoozing notification:', error)
    res.status(500).json({ error: 'Failed to snooze notification' })
  }
})

router.delete('/:id/snooze', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    const notificationId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id
    const success = await notificationService.unsnoozeNotification(
      notificationId,
      userId
    )
    if (success) {
      res.json({ success: true })
    } else {
      res.status(404).json({ error: 'Notification not found' })
    }
  } catch (error) {
    console.error('Error unsnoozing notification:', error)
    res.status(500).json({ error: 'Failed to unsnooze notification' })
  }
})

export default router

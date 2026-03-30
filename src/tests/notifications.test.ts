import { describe, it, expect, beforeEach, vi } from 'vitest'
import notificationService from '../services/notifications/notification.service.js'
import { query } from '../config/database.js'

vi.mock('../config/database.js')
vi.mock('../services/notifications/email.service.js')
vi.mock('../services/notifications/push.service.js')

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createNotification', () => {
    it('should create notification when in_app is enabled', async () => {
      vi.mocked(query).mockResolvedValueOnce({
        rows: [{ in_app_enabled: true, email_enabled: false, push_enabled: false }],
        rowCount: 1,
      } as any)

      vi.mocked(query).mockResolvedValueOnce({
        rows: [{ id: '123', type: 'task_assigned', title: 'Test notification', read_status: false, snoozed_until: null }],
        rowCount: 1,
      } as any)

      const result = await notificationService.createNotification(
        'user-1',
        'task_assigned',
        'Test notification'
      )

      expect(result).toBeDefined()
      expect(result?.title).toBe('Test notification')
    })

    it('should return null when in_app is disabled', async () => {
      vi.mocked(query).mockResolvedValueOnce({
        rows: [{ in_app_enabled: false, email_enabled: false, push_enabled: false }],
        rowCount: 1,
      } as any)

      const result = await notificationService.createNotification(
        'user-1',
        'task_assigned',
        'Test notification'
      )

      expect(result).toBeNull()
    })
  })

  describe('snoozeNotification', () => {
    it('should snooze notification successfully', async () => {
      vi.mocked(query).mockResolvedValueOnce({
        rows: [{ id: '123' }],
        rowCount: 1,
      } as any)

      const snoozedUntil = new Date(Date.now() + 3600000)
      const result = await notificationService.snoozeNotification(
        '123',
        'user-1',
        snoozedUntil
      )

      expect(result).toBe(true)
    })

    it('should return false when notification not found', async () => {
      vi.mocked(query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any)

      const snoozedUntil = new Date(Date.now() + 3600000)
      const result = await notificationService.snoozeNotification(
        '123',
        'user-1',
        snoozedUntil
      )

      expect(result).toBe(false)
    })
  })

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      vi.mocked(query).mockResolvedValueOnce({
        rows: [{ count: '5' }],
        rowCount: 1,
      } as any)

      const count = await notificationService.getUnreadCount('user-1')

      expect(count).toBe(5)
    })
  })
})

import { query } from '../../config/database.js'
import {
  Notification,
  NotificationType,
  NotificationPreference,
  NotificationResponse,
  NotificationPreferenceResponse,
} from '../../models/Notification.js'
import emailService from './email.service.js'
import pushService from './push.service.js'

const ALL_NOTIFICATION_TYPES: NotificationType[] = [
  'task_assigned',
  'deadline_approaching',
  'task_completed',
  'mentioned_in_comment',
]

export class NotificationService {
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body?: string,
    taskId?: string
  ): Promise<NotificationResponse | null> {
    const pref = await this.getPreferencesForType(userId, type)
    if (!pref.in_app_enabled) {
      return null
    }

    const result = await query(
      `INSERT INTO notifications (user_id, type, title, body, task_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, type, title, body, read_status, task_id, snoozed_until, created_at`,
      [userId, type, title, body, taskId]
    )

    const notification = result.rows[0] as NotificationResponse

    if (pref.email_enabled) {
      await emailService.sendNotificationEmail(userId, type, title, body)
    }

    if (pref.push_enabled) {
      await pushService.sendPushNotification(userId, type, title, body)
    }

    return notification
  }

  async getNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<NotificationResponse[]> {
    const result = await query(
      `SELECT id, type, title, body, read_status, task_id, snoozed_until, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    )
    return result.rows as NotificationResponse[]
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count FROM notifications
       WHERE user_id = $1 AND read_status = FALSE`,
      [userId]
    )
    return parseInt(result.rows[0].count as string)
  }

  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const result = await query(
      `UPDATE notifications
       SET read_status = TRUE, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [notificationId, userId]
    )
    return (result.rowCount ?? 0) > 0
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await query(
      `UPDATE notifications
       SET read_status = TRUE, updated_at = NOW()
       WHERE user_id = $1 AND read_status = FALSE`,
      [userId]
    )
    return result.rowCount ?? 0
  }

  async snoozeNotification(
    notificationId: string,
    userId: string,
    snoozedUntil: Date
  ): Promise<boolean> {
    const result = await query(
      `UPDATE notifications
       SET snoozed_until = $3, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [notificationId, userId, snoozedUntil]
    )
    return (result.rowCount ?? 0) > 0
  }

  async unsnoozeNotification(
    notificationId: string,
    userId: string
  ): Promise<boolean> {
    const result = await query(
      `UPDATE notifications
       SET snoozed_until = NULL, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [notificationId, userId]
    )
    return (result.rowCount ?? 0) > 0
  }

  async getPreferences(
    userId: string
  ): Promise<NotificationPreferenceResponse[]> {
    const result = await query(
      `SELECT notification_type, in_app_enabled, email_enabled, push_enabled
       FROM notification_preferences
       WHERE user_id = $1`,
      [userId]
    )

    const existingPrefs = new Map(
      result.rows.map((r: NotificationPreference) => [r.notification_type, r])
    )

    return ALL_NOTIFICATION_TYPES.map(type => {
      const pref = existingPrefs.get(type)
      return {
        notification_type: type,
        in_app_enabled: pref?.in_app_enabled ?? true,
        email_enabled: pref?.email_enabled ?? true,
        push_enabled: pref?.push_enabled ?? false,
      }
    })
  }

  async updatePreferences(
    userId: string,
    updates: Partial<
      Record<
        NotificationType,
        Omit<NotificationPreferenceResponse, 'notification_type'>
      >
    >
  ): Promise<void> {
    for (const [type, prefs] of Object.entries(updates)) {
      await query(
        `INSERT INTO notification_preferences (user_id, notification_type, in_app_enabled, email_enabled, push_enabled)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, notification_type)
         DO UPDATE SET
           in_app_enabled = EXCLUDED.in_app_enabled,
           email_enabled = EXCLUDED.email_enabled,
           push_enabled = EXCLUDED.push_enabled,
           updated_at = NOW()`,
        [
          userId,
          type,
          prefs.in_app_enabled,
          prefs.email_enabled,
          prefs.push_enabled,
        ]
      )
    }
  }

  private async getPreferencesForType(
    userId: string,
    type: NotificationType
  ): Promise<NotificationPreferenceResponse> {
    const result = await query(
      `SELECT in_app_enabled, email_enabled, push_enabled
       FROM notification_preferences
       WHERE user_id = $1 AND notification_type = $2`,
      [userId, type]
    )

    if (result.rows.length > 0) {
      const row = result.rows[0] as NotificationPreference
      return {
        notification_type: type,
        in_app_enabled: row.in_app_enabled,
        email_enabled: row.email_enabled,
        push_enabled: row.push_enabled,
      }
    }

    return {
      notification_type: type,
      in_app_enabled: true,
      email_enabled: true,
      push_enabled: false,
    }
  }

  async getUpcomingDeadlines(
    minutesAhead: number = 60
  ): Promise<
    Array<{ task_id: string; user_id: string; title: string; deadline: Date }>
  > {
    const result = await query(
      `SELECT t.id as task_id, t.assignee_id as user_id, t.title, t.due_date as deadline
       FROM tasks t
       WHERE t.due_date IS NOT NULL
         AND t.due_date > NOW()
         AND t.due_date <= NOW() + ($1 || ' minutes')::interval
         AND t.status NOT IN ('done', 'cancelled')
         AND NOT EXISTS (
           SELECT 1 FROM notifications n
           WHERE n.task_id = t.id
             AND n.type = 'deadline_approaching'
             AND n.created_at > NOW() - INTERVAL '60 minutes'
         )
       ORDER BY t.due_date ASC`,
      [minutesAhead]
    )
    return result.rows as Array<{
      task_id: string
      user_id: string
      title: string
      deadline: Date
    }>
  }
}

export default new NotificationService()

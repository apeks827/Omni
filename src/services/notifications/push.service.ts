import webpush from 'web-push'
import { NotificationType } from '../../models/Notification.js'
import { query } from '../../config/database.js'

class PushService {
  private initialized = false

  constructor() {
    this.initializeWebPush()
  }

  private initializeWebPush() {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@omni.app'

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn('VAPID keys not configured. Push notifications disabled.')
      return
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
    this.initialized = true
  }

  async sendPushNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body?: string
  ): Promise<void> {
    if (!this.initialized) {
      return
    }

    try {
      const subscriptionsResult = await query(
        'SELECT subscription FROM push_subscriptions WHERE user_id = $1',
        [userId]
      )

      if (subscriptionsResult.rows.length === 0) {
        return
      }

      const payload = JSON.stringify({
        title,
        body: body || '',
        icon: '/icon.png',
        badge: '/badge.png',
        data: { type, userId },
      })

      const promises = subscriptionsResult.rows.map(async row => {
        try {
          await webpush.sendNotification(row.subscription, payload)
        } catch (error: any) {
          if (error.statusCode === 410) {
            await query(
              'DELETE FROM push_subscriptions WHERE user_id = $1 AND subscription = $2',
              [userId, row.subscription]
            )
          } else {
            console.error('Error sending push notification:', error)
          }
        }
      })

      await Promise.all(promises)
    } catch (error) {
      console.error('Error in sendPushNotification:', error)
    }
  }
}

export default new PushService()

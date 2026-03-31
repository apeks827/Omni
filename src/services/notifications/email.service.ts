import nodemailer from 'nodemailer'
import { NotificationType } from '../../models/Notification.js'
import { query } from '../../config/database.js'

class EmailService {
  private transporter: nodemailer.Transporter | null = null

  constructor() {
    this.initializeTransporter()
  }

  private initializeTransporter() {
    const emailHost = process.env.EMAIL_HOST
    const emailPort = process.env.EMAIL_PORT
    const emailUser = process.env.EMAIL_USER
    const emailPass = process.env.EMAIL_PASS

    if (!emailHost || !emailUser || !emailPass) {
      console.warn(
        'Email service not configured. Email notifications disabled.'
      )
      return
    }

    this.transporter = nodemailer.createTransport({
      host: emailHost,
      port: parseInt(emailPort || '587'),
      secure: emailPort === '465',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    })
  }

  async sendNotificationEmail(
    userId: string,
    type: NotificationType,
    title: string,
    body?: string
  ): Promise<void> {
    if (!this.transporter) {
      return
    }

    try {
      const userResult = await query(
        'SELECT email, name FROM users WHERE id = $1',
        [userId]
      )

      if (userResult.rows.length === 0) {
        console.error(`User not found: ${userId}`)
        return
      }

      const user = userResult.rows[0]
      const emailSubject = this.getEmailSubject(type, title)
      const emailBody = this.getEmailBody(type, title, body, user.name)

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: user.email,
        subject: emailSubject,
        text: emailBody,
        html: this.getEmailHtml(type, title, body, user.name),
      })
    } catch (error) {
      console.error('Error sending email notification:', error)
    }
  }

  private getEmailSubject(type: NotificationType, title: string): string {
    const prefixes: Record<NotificationType, string> = {
      task_assigned: '[Task Assigned]',
      deadline_approaching: '[Deadline Approaching]',
      task_completed: '[Task Completed]',
      mentioned_in_comment: '[Mentioned]',
      task_rescheduled: '[Task Rescheduled]',
    }
    return `${prefixes[type]} ${title}`
  }

  private getEmailBody(
    type: NotificationType,
    title: string,
    body?: string,
    userName?: string
  ): string {
    const greeting = userName ? `Hi ${userName},\n\n` : 'Hi,\n\n'
    return `${greeting}${title}\n\n${body || ''}\n\nView in Omni: ${process.env.APP_URL || 'http://localhost:3000'}`
  }

  private getEmailHtml(
    type: NotificationType,
    title: string,
    body?: string,
    userName?: string
  ): string {
    const greeting = userName ? `Hi ${userName},` : 'Hi,'
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <p>${greeting}</p>
          <h2 style="color: #4a5568;">${title}</h2>
          ${body ? `<p>${body}</p>` : ''}
          <p>
            <a href="${process.env.APP_URL || 'http://localhost:3000'}" 
               style="display: inline-block; padding: 10px 20px; background-color: #4299e1; color: white; text-decoration: none; border-radius: 5px;">
              View in Omni
            </a>
          </p>
        </body>
      </html>
    `
  }
}

export default new EmailService()

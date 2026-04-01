import notificationService from './notification.service.js'

const DEADLINE_CHECK_INTERVAL = 15 * 60 * 1000

export class NotificationScheduler {
  private intervalId: ReturnType<typeof setInterval> | null = null

  async start(): Promise<void> {
    console.log('Starting notification scheduler...')
    await this.checkUpcomingDeadlines()
    this.intervalId = setInterval(
      () => this.checkUpcomingDeadlines(),
      DEADLINE_CHECK_INTERVAL
    )
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('Notification scheduler stopped')
    }
  }

  private async checkUpcomingDeadlines(): Promise<void> {
    try {
      const upcomingTasks = await notificationService.getUpcomingDeadlines(60)

      for (const task of upcomingTasks) {
        if (task.user_id) {
          await notificationService.createNotification(
            task.user_id,
            'deadline_approaching',
            'Deadline approaching',
            `"${task.title}" is due soon`,
            task.task_id
          )
        }
      }

      if (upcomingTasks.length > 0) {
        console.log(`Processed ${upcomingTasks.length} upcoming deadlines`)
      }
    } catch (error) {
      console.error('Error checking upcoming deadlines:', error)
    }
  }
}

export default new NotificationScheduler()

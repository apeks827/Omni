import rescheduleService from './reschedule.service.js'

class RescheduleScheduler {
  private intervalId: NodeJS.Timeout | null = null
  private readonly CHECK_INTERVAL_MS = 15 * 60 * 1000

  start(): void {
    if (this.intervalId) {
      return
    }

    console.log('Starting reschedule scheduler...')

    this.runCheck()

    this.intervalId = setInterval(() => {
      this.runCheck()
    }, this.CHECK_INTERVAL_MS)
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('Reschedule scheduler stopped')
    }
  }

  private async runCheck(): Promise<void> {
    try {
      console.log('Running missed task detection...')
      await rescheduleService.runMissedTaskDetection()
    } catch (error) {
      console.error('Error in reschedule scheduler:', error)
    }
  }

  async triggerManualCheck(): Promise<void> {
    await this.runCheck()
  }
}

export default new RescheduleScheduler()

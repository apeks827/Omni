import { query } from '../../../config/database.js'
import { energyLearningService } from '../energy-learning.service.js'

const PATTERN_UPDATE_INTERVAL = 24 * 60 * 60 * 1000
const PATTERN_UPDATE_HOUR = 2

export class PatternUpdateJob {
  private intervalId: ReturnType<typeof setInterval> | null = null

  async start(): Promise<void> {
    console.log('Starting pattern update job...')

    await this.scheduleNextRun()

    this.intervalId = setInterval(
      () => this.scheduleNextRun(),
      PATTERN_UPDATE_INTERVAL
    )
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('Pattern update job stopped')
    }
  }

  private async scheduleNextRun(): Promise<void> {
    const now = new Date()
    const targetHour = PATTERN_UPDATE_HOUR

    let nextRun = new Date(now)
    nextRun.setHours(targetHour, 0, 0, 0)

    if (now.getHours() >= targetHour) {
      nextRun.setDate(nextRun.getDate() + 1)
    }

    const delay = nextRun.getTime() - now.getTime()

    setTimeout(() => this.runPatternUpdate(), delay)
  }

  async runPatternUpdate(): Promise<void> {
    const startTime = Date.now()
    console.log(`[${new Date().toISOString()}] Running pattern update job...`)

    try {
      const activeUsers = await this.getActiveUsers()

      let successCount = 0
      let failureCount = 0
      const confidenceScores: number[] = []

      for (const user of activeUsers) {
        try {
          await energyLearningService.updateUserPatterns(user.id)

          const confidence = await energyLearningService.getConfidenceScore(
            user.id
          )
          confidenceScores.push(confidence)

          successCount++

          console.log(
            `Updated patterns for user ${user.id}: confidence=${confidence.toFixed(3)}`
          )
        } catch (error) {
          failureCount++
          console.error(`Failed to update patterns for user ${user.id}:`, error)

          await this.retryPatternUpdate(user.id)
        }
      }

      const duration = Date.now() - startTime
      const avgConfidence =
        confidenceScores.length > 0
          ? confidenceScores.reduce((sum, c) => sum + c, 0) /
            confidenceScores.length
          : 0

      console.log(
        `[${new Date().toISOString()}] Pattern update completed: ${successCount} success, ${failureCount} failures, avg confidence=${avgConfidence.toFixed(3)}, duration=${duration}ms`
      )

      await this.logJobExecution(
        successCount,
        failureCount,
        avgConfidence,
        duration
      )
    } catch (error) {
      console.error('Pattern update job failed:', error)
      throw error
    }
  }

  private async getActiveUsers(): Promise<Array<{ id: string }>> {
    const result = await query(
      `SELECT DISTINCT u.id
       FROM users u
       INNER JOIN time_entries te ON te.user_id = u.id
       WHERE te.end_time IS NOT NULL
         AND te.end_time > NOW() - INTERVAL '30 days'
       ORDER BY u.id`
    )

    return result.rows
  }

  private async retryPatternUpdate(
    userId: string,
    attempt: number = 1,
    maxAttempts: number = 3
  ): Promise<void> {
    if (attempt >= maxAttempts) {
      console.error(`Max retry attempts reached for user ${userId}, giving up`)
      return
    }

    const delay = Math.pow(2, attempt) * 1000

    console.log(
      `Retrying pattern update for user ${userId} (attempt ${attempt + 1}/${maxAttempts}) in ${delay}ms`
    )

    await new Promise(resolve => setTimeout(resolve, delay))

    try {
      await energyLearningService.updateUserPatterns(userId)
      console.log(`Retry successful for user ${userId}`)
    } catch (error) {
      console.error(`Retry failed for user ${userId}:`, error)
      await this.retryPatternUpdate(userId, attempt + 1, maxAttempts)
    }
  }

  private async logJobExecution(
    successCount: number,
    failureCount: number,
    avgConfidence: number,
    durationMs: number
  ): Promise<void> {
    try {
      await query(
        `INSERT INTO pattern_update_audit_log 
         (success_count, failure_count, avg_confidence, duration_ms, executed_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          successCount,
          failureCount,
          avgConfidence,
          durationMs,
          new Date().toISOString(),
        ]
      )
    } catch (error) {
      console.error('Failed to log job execution:', error)
    }
  }
}

export default new PatternUpdateJob()

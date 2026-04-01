import { query } from '../../config/database.js'

export interface CompletionPattern {
  hour: number
  completionRate: number
  avgDuration: number
  taskCount: number
}

export class PatternAnalyzer {
  async analyzeCompletionPatterns(
    userId: string,
    minDays: number = 14
  ): Promise<CompletionPattern[]> {
    const result = await query(
      `SELECT 
        EXTRACT(HOUR FROM start_time) as hour,
        COUNT(*) as task_count,
        AVG(duration_seconds) as avg_duration,
        COUNT(*) FILTER (WHERE end_time IS NOT NULL) as completed_count
      FROM time_entries
      WHERE user_id = $1
        AND start_time >= NOW() - INTERVAL '1 day' * $2
      GROUP BY EXTRACT(HOUR FROM start_time)
      ORDER BY hour`,
      [userId, minDays]
    )

    return result.rows.map(row => ({
      hour: parseInt(row.hour),
      completionRate:
        row.task_count > 0
          ? parseFloat(row.completed_count) / parseFloat(row.task_count)
          : 0,
      avgDuration: parseFloat(row.avg_duration) || 0,
      taskCount: parseInt(row.task_count),
    }))
  }

  async detectPeakHours(patterns: CompletionPattern[]): Promise<number[]> {
    if (patterns.length === 0) return []

    const sorted = [...patterns].sort(
      (a, b) => b.completionRate - a.completionRate
    )
    const threshold =
      sorted[Math.floor(sorted.length * 0.3)]?.completionRate || 0

    return patterns
      .filter(p => p.completionRate >= threshold && p.taskCount >= 3)
      .map(p => p.hour)
  }

  async detectLowEnergyPeriods(
    patterns: CompletionPattern[]
  ): Promise<number[]> {
    if (patterns.length === 0) return []

    const sorted = [...patterns].sort(
      (a, b) => a.completionRate - b.completionRate
    )
    const threshold =
      sorted[Math.floor(sorted.length * 0.3)]?.completionRate || 0

    return patterns
      .filter(p => p.completionRate <= threshold && p.taskCount >= 2)
      .map(p => p.hour)
  }
}

export const patternAnalyzer = new PatternAnalyzer()

import { query } from '../../config/database.js'
import {
  patternAnalyzer,
  CompletionPattern,
} from './pattern-analyzer.service.js'

export interface EnergyPattern {
  peakHours: number[]
  lowEnergyPeriods: number[]
  hourlyPatterns: CompletionPattern[]
  confidenceScore: number
  dataPoints: number
}

export class EnergyLearningService {
  async updateUserPatterns(userId: string): Promise<void> {
    const hasMinData = await this.hasMinimumData(userId)
    if (!hasMinData) {
      return
    }

    const patterns = await patternAnalyzer.analyzeCompletionPatterns(userId, 14)
    const peakHours = await patternAnalyzer.detectPeakHours(patterns)
    const lowEnergyPeriods =
      await patternAnalyzer.detectLowEnergyPeriods(patterns)

    const dataPoints = patterns.reduce((sum, p) => sum + p.taskCount, 0)
    const confidenceScore = this.calculateConfidence(patterns, dataPoints)

    const patternData = {
      peakHours,
      lowEnergyPeriods,
      hourlyPatterns: patterns,
      confidenceScore,
      dataPoints,
    }

    await query(
      `INSERT INTO energy_patterns (user_id, pattern_data, confidence_score, data_points, last_updated)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         pattern_data = $2,
         confidence_score = $3,
         data_points = $4,
         last_updated = NOW()`,
      [userId, JSON.stringify(patternData), confidenceScore, dataPoints]
    )
  }

  async hasMinimumData(userId: string): Promise<boolean> {
    const result = await query(
      `SELECT COUNT(*) as count,
              MIN(start_time) as earliest
       FROM time_entries
       WHERE user_id = $1 AND end_time IS NOT NULL`,
      [userId]
    )

    const count = parseInt(result.rows[0]?.count || '0')
    const earliest = result.rows[0]?.earliest

    if (!earliest) return false

    const daysSinceFirst = Math.floor(
      (Date.now() - new Date(earliest).getTime()) / (1000 * 60 * 60 * 24)
    )

    return count >= 20 && daysSinceFirst >= 14
  }

  async getConfidenceScore(userId: string): Promise<number> {
    const result = await query(
      'SELECT confidence_score FROM energy_patterns WHERE user_id = $1',
      [userId]
    )

    return parseFloat(result.rows[0]?.confidence_score || '0')
  }

  async isPatternActive(userId: string): Promise<boolean> {
    const confidence = await this.getConfidenceScore(userId)
    return confidence >= 0.7
  }

  async getPattern(userId: string): Promise<EnergyPattern | null> {
    const result = await query(
      `SELECT pattern_data, confidence_score, data_points 
       FROM energy_patterns 
       WHERE user_id = $1`,
      [userId]
    )

    if (result.rows.length === 0) return null

    return {
      ...result.rows[0].pattern_data,
      confidenceScore: parseFloat(result.rows[0].confidence_score),
      dataPoints: parseInt(result.rows[0].data_points),
    }
  }

  private calculateConfidence(
    patterns: CompletionPattern[],
    dataPoints: number
  ): number {
    const dataWeight = 0.4
    const consistencyWeight = 0.6

    const dataScore = Math.min(dataPoints / 100, 1.0)

    const variance = this.calculateVariance(patterns.map(p => p.completionRate))
    const consistencyScore = Math.max(0, 1 - variance)

    return dataScore * dataWeight + consistencyScore * consistencyWeight
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 1

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2))
    const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length

    return Math.sqrt(variance)
  }
}

export const energyLearningService = new EnergyLearningService()

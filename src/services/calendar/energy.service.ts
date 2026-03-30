import { pool } from '../../config/database.js'

export interface EnergyPattern {
  peak_hours: number[]
  low_hours: number[]
}

export interface TimeBlock {
  hour: number
  score: number
  scheduled_task_id?: string
  scheduled_task_title?: string
  scheduled_task_priority?: string
}

class EnergyService {
  async getUserEnergyPattern(userId: string): Promise<EnergyPattern> {
    const result = await pool.query(
      'SELECT energy_pattern, low_energy_mode FROM users WHERE id = $1',
      [userId]
    )

    if (result.rows.length === 0) {
      throw new Error('User not found')
    }

    return (
      result.rows[0].energy_pattern || {
        peak_hours: [9, 10, 11, 14, 15, 16],
        low_hours: [13, 22, 23, 0],
      }
    )
  }

  async updateEnergyPattern(
    userId: string,
    pattern: EnergyPattern
  ): Promise<void> {
    await pool.query(
      'UPDATE users SET energy_pattern = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(pattern), userId]
    )
  }

  scoreTimeBlock(
    hour: number,
    taskPriority: string,
    energyPattern: EnergyPattern
  ): number {
    const isPeakHour = energyPattern.peak_hours.includes(hour)
    const isLowHour = energyPattern.low_hours.includes(hour)

    const priorityWeight =
      {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
      }[taskPriority] || 2

    if (
      isPeakHour &&
      (taskPriority === 'high' || taskPriority === 'critical')
    ) {
      return 100 + priorityWeight * 10
    }

    if (isLowHour && (taskPriority === 'low' || taskPriority === 'medium')) {
      return 80 + priorityWeight * 5
    }

    if (isPeakHour) {
      return 70 + priorityWeight * 5
    }

    return 50 + priorityWeight * 3
  }
}

export default new EnergyService()

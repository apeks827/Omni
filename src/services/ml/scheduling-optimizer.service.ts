import { energyLearningService } from './energy-learning.service.js'
import { CognitiveLoad } from './task-classifier.service.js'

export interface SchedulingWeights {
  timeSlotScore: number
  priorityMultiplier: number
  energyAlignment: number
}

export class SchedulingOptimizer {
  async calculateSlotScore(
    userId: string,
    hour: number,
    cognitiveLoad: CognitiveLoad
  ): Promise<number> {
    const pattern = await energyLearningService.getPattern(userId)

    if (!pattern || pattern.confidenceScore < 0.7) {
      return 0.5
    }

    const energyAlignment = this.getEnergyAlignment(
      hour,
      cognitiveLoad,
      pattern
    )
    return energyAlignment
  }

  private getEnergyAlignment(
    hour: number,
    cognitiveLoad: CognitiveLoad,
    pattern: { peakHours: number[]; lowEnergyPeriods: number[] }
  ): number {
    const isPeak = pattern.peakHours.includes(hour)
    const isLow = pattern.lowEnergyPeriods.includes(hour)

    if (isPeak && cognitiveLoad === 'deep_work') return 1.0
    if (isPeak && cognitiveLoad === 'medium') return 0.8
    if (isPeak && cognitiveLoad === 'light') return 0.6
    if (isPeak && cognitiveLoad === 'admin') return 0.5

    if (isLow && cognitiveLoad === 'admin') return 1.0
    if (isLow && cognitiveLoad === 'light') return 0.9
    if (isLow && cognitiveLoad === 'medium') return 0.4
    if (isLow && cognitiveLoad === 'deep_work') return 0.3

    return 0.5
  }

  async adjustSchedulingWeights(
    cognitiveLoad: CognitiveLoad,
    hour: number,
    baseScore: number,
    userId: string
  ): Promise<SchedulingWeights> {
    const energyAlignment = await this.calculateSlotScore(
      userId,
      hour,
      cognitiveLoad
    )

    const priorityMultiplier = this.getPriorityMultiplier(cognitiveLoad)

    return {
      timeSlotScore: baseScore,
      priorityMultiplier,
      energyAlignment,
    }
  }

  private getPriorityMultiplier(cognitiveLoad: CognitiveLoad): number {
    switch (cognitiveLoad) {
      case 'deep_work':
        return 1.2
      case 'medium':
        return 1.0
      case 'light':
        return 0.9
      case 'admin':
        return 0.8
    }
  }
}

export const schedulingOptimizer = new SchedulingOptimizer()

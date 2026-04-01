import energyRepository, { Task } from '../repositories/energy.repository.js'
import { taskClassifier } from '../../../services/ml/task-classifier.service.js'
import { AppError, ErrorCodes } from '../../../utils/errors.js'

interface CognitiveLoadResult {
  taskId: string
  cognitiveLoad: string
  confidence: number
}

interface EnergyLevelResult {
  userId: string
  date: string
  energyLevel: 'low' | 'normal' | 'high'
}

class EnergyService {
  async getCognitiveLoad(
    taskId: string,
    workspaceId: string
  ): Promise<CognitiveLoadResult> {
    const task = await energyRepository.findTaskById(taskId, workspaceId)

    if (!task) {
      throw new AppError(
        ErrorCodes.TASK_NOT_FOUND,
        'Task not found',
        { task_id: taskId },
        404
      )
    }

    const classification = await taskClassifier.classifyTask(task as any)

    return {
      taskId,
      cognitiveLoad: classification.load,
      confidence: classification.confidence,
    }
  }

  async setEnergyLevel(
    userId: string,
    energyLevel: 'low' | 'normal' | 'high'
  ): Promise<EnergyLevelResult> {
    const today = new Date().toISOString().split('T')[0]
    const result = await energyRepository.setDailyEnergyLevel(
      userId,
      today,
      energyLevel
    )

    return {
      userId: result.user_id,
      date: result.date,
      energyLevel: result.energy_level,
    }
  }

  async getEnergyLevel(userId: string): Promise<EnergyLevelResult | null> {
    const today = new Date().toISOString().split('T')[0]
    const result = await energyRepository.getDailyEnergyLevel(userId, today)

    if (!result) {
      return null
    }

    return {
      userId: result.user_id,
      date: result.date,
      energyLevel: result.energy_level,
    }
  }

  async getSuggestedTasks(
    userId: string,
    workspaceId: string
  ): Promise<{
    energyLevel: 'low' | 'normal' | 'high'
    tasks: Task[]
    message?: string
  }> {
    const energyLevel = await this.getEnergyLevel(userId)

    if (!energyLevel) {
      return {
        energyLevel: 'normal',
        tasks: [],
        message: 'No energy level set for today. Showing all tasks.',
      }
    }

    const tasks = await energyRepository.getTasksByEnergyMatch(
      userId,
      energyLevel.energyLevel,
      workspaceId
    )

    return {
      energyLevel: energyLevel.energyLevel,
      tasks,
      message: `Showing tasks matched to ${energyLevel.energyLevel} energy level.`,
    }
  }
}

export default new EnergyService()

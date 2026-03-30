import energyRepository from '../repositories/energy.repository.js'
import { taskClassifier } from '../../../services/ml/task-classifier.service.js'
import { AppError, ErrorCodes } from '../../../utils/errors.js'

interface CognitiveLoadResult {
  taskId: string
  cognitiveLoad: string
  confidence: number
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
}

export default new EnergyService()

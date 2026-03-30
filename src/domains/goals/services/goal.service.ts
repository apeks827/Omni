import goalRepository from '../repositories/goal.repository.js'
import {
  Goal,
  GoalWithKeyResults,
  KeyResult,
  CreateGoalData,
  UpdateGoalData,
  CreateKeyResultData,
  UpdateKeyResultData,
  TaskGoalLink,
  LinkedTask,
} from '../types.js'
import { AppError, ErrorCodes } from '../../../utils/errors.js'

class GoalService {
  async listGoals(statusFilter?: string): Promise<Goal[]> {
    return goalRepository.findAll(statusFilter)
  }

  async getGoalById(id: string): Promise<GoalWithKeyResults> {
    const goal = await goalRepository.findById(id)
    if (!goal) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Goal not found', {}, 404)
    }
    return goal
  }

  async createGoal(data: CreateGoalData): Promise<Goal> {
    if (new Date(data.start_date) >= new Date(data.end_date)) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Start date must be before end date',
        {},
        400
      )
    }
    return goalRepository.create(data)
  }

  async updateGoal(id: string, data: UpdateGoalData): Promise<Goal> {
    if (data.start_date && data.end_date) {
      if (new Date(data.start_date) >= new Date(data.end_date)) {
        throw new AppError(
          ErrorCodes.VALIDATION_ERROR,
          'Start date must be before end date',
          {},
          400
        )
      }
    }

    const goal = await goalRepository.update(id, data)
    if (!goal) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Goal not found', {}, 404)
    }
    return goal
  }

  async deleteGoal(id: string): Promise<void> {
    const deleted = await goalRepository.delete(id)
    if (!deleted) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Goal not found', {}, 404)
    }
  }

  async listKeyResults(goalId: string): Promise<KeyResult[]> {
    return goalRepository.findKeyResultsByGoalId(goalId)
  }

  async getKeyResultById(id: string): Promise<KeyResult> {
    const kr = await goalRepository.findKeyResultById(id)
    if (!kr) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Key result not found', {}, 404)
    }
    return kr
  }

  async createKeyResult(
    goalId: string,
    data: CreateKeyResultData
  ): Promise<KeyResult> {
    const goalExists = await goalRepository.goalExists(goalId)
    if (!goalExists) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Goal not found', {}, 404)
    }

    const kr = await goalRepository.createKeyResult(goalId, data)
    await this.recalculateGoalProgress(goalId)
    return kr
  }

  async updateKeyResult(
    id: string,
    data: UpdateKeyResultData
  ): Promise<KeyResult> {
    const kr = await goalRepository.updateKeyResult(id, data)
    if (!kr) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Key result not found', {}, 404)
    }

    if (data.current_value !== undefined || data.target_value !== undefined) {
      const progress = this.calculateKRProgress(
        data.current_value ?? kr.current_value,
        data.target_value ?? kr.target_value
      )
      await goalRepository.updateKeyResult(id, {
        progress_percentage: progress,
      })
      await this.recalculateGoalProgress(kr.goal_id)
    }

    const updated = await goalRepository.findKeyResultById(id)
    if (!updated) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Key result not found', {}, 404)
    }
    return updated
  }

  async updateKeyResultProgress(
    id: string,
    currentValue: number
  ): Promise<KeyResult> {
    const kr = await goalRepository.findKeyResultById(id)
    if (!kr) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Key result not found', {}, 404)
    }

    const progress = this.calculateKRProgress(currentValue, kr.target_value)
    await goalRepository.updateKeyResult(id, {
      current_value: currentValue,
      progress_percentage: progress,
    })
    await this.recalculateGoalProgress(kr.goal_id)

    const updated = await goalRepository.findKeyResultById(id)
    if (!updated) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Key result not found', {}, 404)
    }
    return updated
  }

  async deleteKeyResult(id: string): Promise<void> {
    const goalId = await goalRepository.deleteKeyResult(id)
    if (!goalId) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Key result not found', {}, 404)
    }
    await this.recalculateGoalProgress(goalId)
  }

  async linkTaskToGoal(
    taskId: string,
    goalId: string,
    keyResultId?: string
  ): Promise<TaskGoalLink> {
    const taskExists = await goalRepository.taskExists(taskId)
    if (!taskExists) {
      throw new AppError(ErrorCodes.TASK_NOT_FOUND, 'Task not found', {}, 404)
    }

    const goalExists = await goalRepository.goalExists(goalId)
    if (!goalExists) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Goal not found', {}, 404)
    }

    if (keyResultId) {
      const krBelongsToGoal = await goalRepository.keyResultBelongsToGoal(
        keyResultId,
        goalId
      )
      if (!krBelongsToGoal) {
        throw new AppError(
          ErrorCodes.VALIDATION_ERROR,
          'Key result must belong to the specified goal',
          {},
          400
        )
      }
    }

    return goalRepository.linkTaskToGoal(taskId, goalId, keyResultId)
  }

  async unlinkTaskFromGoal(taskId: string, goalId: string): Promise<void> {
    const unlinked = await goalRepository.unlinkTaskFromGoal(taskId, goalId)
    if (!unlinked) {
      throw new AppError(
        ErrorCodes.NOT_FOUND,
        'Task-goal link not found',
        {},
        404
      )
    }
  }

  async getTaskGoalLinks(taskId: string): Promise<TaskGoalLink[]> {
    return goalRepository.findTaskGoalLinks(taskId)
  }

  async getGoalTasks(goalId: string): Promise<LinkedTask[]> {
    return goalRepository.findGoalTasks(goalId)
  }

  private calculateKRProgress(current: number, target: number): number {
    if (target === 0) return 100
    const progress = (current / target) * 100
    return Math.min(100, Math.max(0, Math.round(progress * 100) / 100))
  }

  private async recalculateGoalProgress(goalId: string): Promise<void> {
    await goalRepository.updateGoalProgress(goalId)
  }
}

export default new GoalService()

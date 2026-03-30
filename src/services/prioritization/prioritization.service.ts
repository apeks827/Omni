import { Task as TaskModel } from '../../models/Task.js'
import { Task } from '../../domains/tasks/repositories/TaskRepository.js'

export interface PriorityScore {
  taskId: string
  score: number
  factors: {
    deadlineProximity: number
    dependencyWeight: number
    historicalPattern: number
    timeOfDay: number
  }
  suggestedPriority: 'low' | 'medium' | 'high' | 'critical'
  explanation: string
}

export interface PrioritizationWeights {
  deadlineProximity: number
  dependencyWeight: number
  historicalPattern: number
  timeOfDay: number
}

interface TaskWithType extends Task {
  type?: 'task' | 'habit' | 'routine'
  completed_at?: Date
}

const DEFAULT_WEIGHTS: PrioritizationWeights = {
  deadlineProximity: 0.4,
  dependencyWeight: 0.3,
  historicalPattern: 0.2,
  timeOfDay: 0.1,
}

class PrioritizationService {
  private weights: PrioritizationWeights = DEFAULT_WEIGHTS

  setWeights(weights: Partial<PrioritizationWeights>): void {
    this.weights = { ...this.weights, ...weights }
  }

  getWeights(): PrioritizationWeights {
    return { ...this.weights }
  }

  calculatePriorityScore(
    task: Task,
    userHistory: TaskWithType[],
    currentTime: Date = new Date()
  ): PriorityScore {
    const deadlineProximity = this.calculateDeadlineProximity(task, currentTime)
    const dependencyWeight = this.calculateDependencyWeight(task)
    const historicalPattern = this.calculateHistoricalPattern(task, userHistory)
    const timeOfDay = this.calculateTimeOfDayFactor(currentTime)

    const score =
      deadlineProximity * this.weights.deadlineProximity +
      dependencyWeight * this.weights.dependencyWeight +
      historicalPattern * this.weights.historicalPattern +
      timeOfDay * this.weights.timeOfDay

    const suggestedPriority = this.scoreToSuggestedPriority(score)
    const explanation = this.generateExplanation(
      task,
      { deadlineProximity, dependencyWeight, historicalPattern, timeOfDay },
      suggestedPriority
    )

    return {
      taskId: task.id,
      score,
      factors: {
        deadlineProximity,
        dependencyWeight,
        historicalPattern,
        timeOfDay,
      },
      suggestedPriority,
      explanation,
    }
  }

  private calculateDeadlineProximity(task: Task, currentTime: Date): number {
    if (!task.due_date) return 0.3

    const dueDate = new Date(task.due_date)
    const timeUntilDue = dueDate.getTime() - currentTime.getTime()
    const daysUntilDue = timeUntilDue / (1000 * 60 * 60 * 24)

    if (daysUntilDue < 0) return 1.0
    if (daysUntilDue < 1) return 0.9
    if (daysUntilDue < 3) return 0.7
    if (daysUntilDue < 7) return 0.5
    if (daysUntilDue < 14) return 0.3
    return 0.1
  }

  private calculateDependencyWeight(task: Task): number {
    return 0.5
  }

  private calculateHistoricalPattern(
    task: Task,
    userHistory: TaskWithType[]
  ): number {
    if (userHistory.length === 0) return 0.5

    const similarTasks = userHistory.filter(
      t => t.priority === task.priority && t.status === 'completed'
    )

    if (similarTasks.length === 0) return 0.5

    const avgCompletionTime =
      similarTasks.reduce((sum, t) => {
        if (!t.completed_at || !t.created_at) return sum
        const duration =
          new Date(t.completed_at).getTime() - new Date(t.created_at).getTime()
        return sum + duration
      }, 0) / similarTasks.length

    const taskAge = Date.now() - new Date(task.created_at).getTime()
    const ageRatio = taskAge / avgCompletionTime

    if (ageRatio > 1.5) return 0.8
    if (ageRatio > 1.0) return 0.6
    if (ageRatio > 0.5) return 0.4
    return 0.2
  }

  private calculateTimeOfDayFactor(currentTime: Date): number {
    const hour = currentTime.getHours()

    if (hour >= 9 && hour < 12) return 0.8
    if (hour >= 14 && hour < 17) return 0.7
    if (hour >= 8 && hour < 9) return 0.6
    if (hour >= 17 && hour < 19) return 0.5
    return 0.3
  }

  private scoreToSuggestedPriority(
    score: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 0.8) return 'critical'
    if (score >= 0.6) return 'high'
    if (score >= 0.4) return 'medium'
    return 'low'
  }

  private generateExplanation(
    task: Task,
    factors: PriorityScore['factors'],
    suggestedPriority: string
  ): string {
    const reasons: string[] = []

    if (factors.deadlineProximity > 0.7) {
      reasons.push('deadline is approaching soon')
    }

    if (factors.historicalPattern > 0.6) {
      reasons.push('similar tasks typically take longer than expected')
    }

    if (factors.timeOfDay > 0.6) {
      reasons.push('current time is optimal for productivity')
    }

    if (reasons.length === 0) {
      return `Suggested priority: ${suggestedPriority} based on standard factors`
    }

    return `Suggested priority: ${suggestedPriority} because ${reasons.join(', ')}`
  }

  async suggestPriorities(
    tasks: Task[],
    userId: string,
    workspaceId: string
  ): Promise<PriorityScore[]> {
    const { query } = await import('../../config/database.js')
    const historyResult = await query(
      `SELECT * FROM tasks 
       WHERE workspace_id = $1 
       AND creator_id = $2 
       AND status = 'completed' 
       ORDER BY completed_at DESC 
       LIMIT 100`,
      [workspaceId, userId]
    )

    const userHistory: TaskWithType[] = historyResult.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      project_id: row.project_id,
      assignee_id: row.assignee_id,
      creator_id: row.creator_id,
      workspace_id: row.workspace_id,
      due_date: row.due_date,
      created_at: row.created_at,
      updated_at: row.updated_at,
      labels: row.labels,
      type: row.type,
      completed_at: row.completed_at,
    }))

    return tasks.map(task => this.calculatePriorityScore(task, userHistory))
  }

  async recordFeedback(
    taskId: string,
    userId: string,
    accepted: boolean
  ): Promise<void> {
    const { query } = await import('../../config/database.js')
    await query(
      `INSERT INTO priority_feedback (task_id, user_id, accepted, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [taskId, userId, accepted]
    )
  }
}

export default new PrioritizationService()

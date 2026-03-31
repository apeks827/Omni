interface QueuedTask {
  taskId: string
  userId: string
  workspaceId: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  dueDate?: Date
  estimatedDuration?: number
  addedAt: Date
  score?: number
}

interface QueueStats {
  size: number
  byPriority: Record<string, number>
  averageScore: number
}

const PRIORITY_WEIGHTS = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

class PriorityQueue {
  private queue: Map<string, QueuedTask> = new Map()
  private userQueues: Map<string, Set<string>> = new Map()

  private calculateScore(task: QueuedTask): number {
    const priorityWeight = PRIORITY_WEIGHTS[task.priority]
    const now = new Date()

    let deadlineUrgency = 1.0
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate)
      const hoursUntilDue =
        (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)

      if (hoursUntilDue < 0) {
        deadlineUrgency = 10.0
      } else if (hoursUntilDue < 24) {
        deadlineUrgency = 5.0
      } else if (hoursUntilDue < 72) {
        deadlineUrgency = 2.0
      } else if (hoursUntilDue < 168) {
        deadlineUrgency = 1.5
      }
    }

    const timeWaiting =
      (now.getTime() - task.addedAt.getTime()) / (1000 * 60 * 60)
    const waitBonus = Math.min(timeWaiting * 0.1, 1.0)

    return priorityWeight * 10 + deadlineUrgency + waitBonus
  }

  add(task: Omit<QueuedTask, 'addedAt' | 'score'>): void {
    const queuedTask: QueuedTask = {
      ...task,
      addedAt: new Date(),
      score: 0,
    }
    queuedTask.score = this.calculateScore(queuedTask)

    this.queue.set(task.taskId, queuedTask)

    if (!this.userQueues.has(task.userId)) {
      this.userQueues.set(task.userId, new Set())
    }
    this.userQueues.get(task.userId)!.add(task.taskId)
  }

  remove(taskId: string, userId: string): boolean {
    const task = this.queue.get(taskId)
    if (!task || task.userId !== userId) {
      return false
    }

    this.queue.delete(taskId)
    this.userQueues.get(userId)?.delete(taskId)
    return true
  }

  reprioritize(
    taskId: string,
    userId: string,
    newPriority: QueuedTask['priority']
  ): boolean {
    const task = this.queue.get(taskId)
    if (!task || task.userId !== userId) {
      return false
    }

    task.priority = newPriority
    task.score = this.calculateScore(task)
    return true
  }

  peek(userId: string): QueuedTask | undefined {
    const userTaskIds = this.userQueues.get(userId)
    if (!userTaskIds || userTaskIds.size === 0) {
      return undefined
    }

    let highestScore = -1
    let topTaskId: string | undefined

    for (const taskId of userTaskIds) {
      const task = this.queue.get(taskId)
      if (task && task.score! > highestScore) {
        highestScore = task.score!
        topTaskId = taskId
      }
    }

    return topTaskId ? this.queue.get(topTaskId) : undefined
  }

  getAll(userId: string): QueuedTask[] {
    const userTaskIds = this.userQueues.get(userId)
    if (!userTaskIds) {
      return []
    }

    return Array.from(userTaskIds)
      .map(taskId => this.queue.get(taskId))
      .filter((task): task is QueuedTask => task !== undefined)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
  }

  getNext(userId: string): QueuedTask | undefined {
    const top = this.peek(userId)
    if (top) {
      this.remove(top.taskId, userId)
    }
    return top
  }

  hasTask(taskId: string): boolean {
    return this.queue.has(taskId)
  }

  getTask(taskId: string): QueuedTask | undefined {
    return this.queue.get(taskId)
  }

  clear(userId: string): number {
    const userTaskIds = this.userQueues.get(userId)
    if (!userTaskIds) {
      return 0
    }

    const count = userTaskIds.size
    for (const taskId of userTaskIds) {
      this.queue.delete(taskId)
    }
    this.userQueues.delete(userId)
    return count
  }

  getStats(userId: string): QueueStats {
    const tasks = this.getAll(userId)

    const byPriority: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    }

    let totalScore = 0
    for (const task of tasks) {
      byPriority[task.priority]++
      totalScore += task.score || 0
    }

    return {
      size: tasks.length,
      byPriority,
      averageScore: tasks.length > 0 ? totalScore / tasks.length : 0,
    }
  }

  recalculateScores(userId: string): void {
    const userTaskIds = this.userQueues.get(userId)
    if (!userTaskIds) {
      return
    }

    for (const taskId of userTaskIds) {
      const task = this.queue.get(taskId)
      if (task) {
        task.score = this.calculateScore(task)
      }
    }
  }

  size(): number {
    return this.queue.size
  }
}

export const schedulingQueue = new PriorityQueue()
export { PriorityQueue, PRIORITY_WEIGHTS }
export type { QueuedTask, QueueStats }

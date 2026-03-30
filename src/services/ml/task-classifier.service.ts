import { Task } from '../../models/Task.js'

export type CognitiveLoad = 'deep_work' | 'medium' | 'light' | 'admin'

export interface TaskClassification {
  load: CognitiveLoad
  confidence: number
}

export class TaskClassifier {
  async classifyTask(task: Task): Promise<TaskClassification> {
    const durationLoad = this.classifyByDuration(task.estimated_duration || 0)
    const typeLoad = this.classifyByType(
      task.type,
      task.title,
      task.description || ''
    )

    if (durationLoad === typeLoad) {
      return { load: durationLoad, confidence: 0.9 }
    }

    return { load: durationLoad, confidence: 0.6 }
  }

  classifyByDuration(estimatedMinutes: number): CognitiveLoad {
    if (estimatedMinutes > 60) return 'deep_work'
    if (estimatedMinutes >= 30) return 'medium'
    if (estimatedMinutes >= 15) return 'light'
    return 'admin'
  }

  classifyByType(
    type: string,
    title: string,
    description: string
  ): CognitiveLoad {
    const text = `${title} ${description}`.toLowerCase()

    const deepWorkKeywords = [
      'design',
      'architecture',
      'research',
      'write',
      'develop',
      'implement',
      'build',
      'create',
    ]
    const mediumKeywords = [
      'review',
      'meeting',
      'discuss',
      'plan',
      'test',
      'debug',
    ]
    const lightKeywords = [
      'update',
      'check',
      'respond',
      'reply',
      'read',
      'scan',
    ]
    const adminKeywords = [
      'email',
      'schedule',
      'organize',
      'file',
      'sort',
      'cleanup',
    ]

    if (deepWorkKeywords.some(kw => text.includes(kw))) return 'deep_work'
    if (mediumKeywords.some(kw => text.includes(kw))) return 'medium'
    if (lightKeywords.some(kw => text.includes(kw))) return 'light'
    if (adminKeywords.some(kw => text.includes(kw))) return 'admin'

    return 'medium'
  }
}

export const taskClassifier = new TaskClassifier()

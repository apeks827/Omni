import { Task } from '../../models/Task.js'

export type CognitiveLoad = 'deep_work' | 'medium' | 'light' | 'admin'

export interface TaskClassification {
  load: CognitiveLoad
  confidence: number
}

export interface KeywordClassificationResult {
  load: CognitiveLoad
  confidence: number
  matchedKeywords: string[]
  loadLabel: string
}

export const COGNITIVE_KEYWORDS: Record<CognitiveLoad, string[]> = {
  deep_work: [
    'design',
    'architecture',
    'research',
    'write',
    'develop',
    'implement',
    'build',
    'create',
  ],
  medium: ['review', 'meeting', 'discuss', 'plan', 'test', 'debug'],
  light: ['update', 'check', 'respond', 'reply', 'read', 'scan'],
  admin: ['email', 'schedule', 'organize', 'file', 'sort', 'cleanup'],
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

    if (COGNITIVE_KEYWORDS.deep_work.some(kw => text.includes(kw)))
      return 'deep_work'
    if (COGNITIVE_KEYWORDS.medium.some(kw => text.includes(kw))) return 'medium'
    if (COGNITIVE_KEYWORDS.light.some(kw => text.includes(kw))) return 'light'
    if (COGNITIVE_KEYWORDS.admin.some(kw => text.includes(kw))) return 'admin'

    return 'medium'
  }

  classifyByKeywords(keywords: string[]): KeywordClassificationResult {
    const lowerKeywords = keywords.map(k => k.toLowerCase())
    const matchedKeywords: string[] = []
    let matchedLoad: CognitiveLoad = 'medium'

    const loadOrder: CognitiveLoad[] = ['deep_work', 'medium', 'light', 'admin']
    for (const load of loadOrder) {
      const found = COGNITIVE_KEYWORDS[load].filter(kw =>
        lowerKeywords.includes(kw)
      )
      if (found.length > 0) {
        matchedKeywords.push(...found)
        matchedLoad = load
        break
      }
    }

    const confidence =
      matchedKeywords.length > 0
        ? Math.min(0.6 + matchedKeywords.length * 0.1, 0.95)
        : 0.5

    const labels: Record<CognitiveLoad, string> = {
      deep_work: 'Deep Work',
      medium: 'Medium',
      light: 'Light',
      admin: 'Admin',
    }

    return {
      load: matchedLoad,
      confidence,
      matchedKeywords: [...new Set(matchedKeywords)],
      loadLabel: labels[matchedLoad],
    }
  }

  getAllKeywords(): Record<CognitiveLoad, string[]> {
    return COGNITIVE_KEYWORDS
  }
}

export const taskClassifier = new TaskClassifier()

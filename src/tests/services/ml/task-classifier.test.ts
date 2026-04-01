import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  TaskClassifier,
  CognitiveLoad,
} from '../../../services/ml/task-classifier.service.js'

describe('TaskClassifier', () => {
  let classifier: TaskClassifier

  beforeEach(() => {
    classifier = new TaskClassifier()
  })

  describe('classifyByDuration', () => {
    it('should classify tasks > 60 min as deep_work', () => {
      expect(classifier.classifyByDuration(90)).toBe('deep_work')
      expect(classifier.classifyByDuration(120)).toBe('deep_work')
    })

    it('should classify tasks 30-60 min as medium', () => {
      expect(classifier.classifyByDuration(30)).toBe('medium')
      expect(classifier.classifyByDuration(45)).toBe('medium')
      expect(classifier.classifyByDuration(60)).toBe('medium')
    })

    it('should classify tasks 15-30 min as light', () => {
      expect(classifier.classifyByDuration(15)).toBe('light')
      expect(classifier.classifyByDuration(20)).toBe('light')
      expect(classifier.classifyByDuration(29)).toBe('light')
    })

    it('should classify tasks < 15 min as admin', () => {
      expect(classifier.classifyByDuration(5)).toBe('admin')
      expect(classifier.classifyByDuration(10)).toBe('admin')
      expect(classifier.classifyByDuration(14)).toBe('admin')
    })
  })

  describe('classifyByType', () => {
    it('should identify deep work keywords', () => {
      const keywords = [
        'design',
        'architecture',
        'research',
        'write',
        'develop',
        'implement',
        'build',
        'create',
      ]

      keywords.forEach(keyword => {
        expect(classifier.classifyByType('task', keyword, '')).toBe('deep_work')
      })
    })

    it('should identify medium work keywords', () => {
      const keywords = ['review', 'meeting', 'discuss', 'plan', 'test', 'debug']

      keywords.forEach(keyword => {
        expect(classifier.classifyByType('task', keyword, '')).toBe('medium')
      })
    })

    it('should identify light work keywords', () => {
      const keywords = ['update', 'check', 'respond', 'reply', 'read', 'scan']

      keywords.forEach(keyword => {
        expect(classifier.classifyByType('task', keyword, '')).toBe('light')
      })
    })

    it('should identify admin keywords', () => {
      const keywords = [
        'email',
        'schedule',
        'organize',
        'file',
        'sort',
        'cleanup',
      ]

      keywords.forEach(keyword => {
        expect(classifier.classifyByType('task', keyword, '')).toBe('admin')
      })
    })

    it('should return medium as default when no keywords match', () => {
      expect(
        classifier.classifyByType('task', 'miscellaneous', 'random content')
      ).toBe('medium')
    })
  })

  describe('classifyTask', () => {
    it('should return high confidence when duration and type agree', async () => {
      const task = {
        id: 'task-1',
        title: 'Implement new feature',
        description: 'Build a new API endpoint',
        estimated_duration: 90,
        type: 'development',
      } as any

      const result = await classifier.classifyTask(task)

      expect(result.load).toBe('deep_work')
      expect(result.confidence).toBe(0.9)
    })

    it('should return lower confidence when duration and type disagree', async () => {
      const task = {
        id: 'task-1',
        title: 'Quick email response',
        description: 'Reply to client',
        estimated_duration: 45,
        type: 'communication',
      } as any

      const result = await classifier.classifyTask(task)

      expect(result.load).toBe('medium')
      expect(result.confidence).toBe(0.6)
    })

    it('should handle task with no estimated duration', async () => {
      const task = {
        id: 'task-1',
        title: 'Read documentation',
        description: 'Read the API docs',
        estimated_duration: null,
        type: 'documentation',
      } as any

      const result = await classifier.classifyTask(task)

      expect(result.load).toBe('admin')
      expect(result.confidence).toBe(0.6)
    })

    it('should prioritize duration over type classification', async () => {
      const task = {
        id: 'task-1',
        title: 'Quick email check',
        description: 'Just check and reply',
        estimated_duration: 90,
        type: 'email',
      } as any

      const result = await classifier.classifyTask(task)

      expect(result.load).toBe('deep_work')
    })
  })

  describe('cognitive load classification accuracy', () => {
    const testCases: Array<{
      name: string
      task: any
      expectedLoad: CognitiveLoad
    }> = [
      {
        name: 'short email task',
        task: {
          title: 'Reply to email',
          description: '',
          estimated_duration: 5,
        },
        expectedLoad: 'admin',
      },
      {
        name: 'medium meeting task',
        task: {
          title: 'Team meeting',
          description: 'Weekly sync',
          estimated_duration: 30,
        },
        expectedLoad: 'medium',
      },
      {
        name: 'long development task',
        task: {
          title: 'Build authentication',
          description: 'Implement OAuth',
          estimated_duration: 120,
        },
        expectedLoad: 'deep_work',
      },
      {
        name: 'medium-weight check task',
        task: {
          title: 'Code review',
          description: 'Review PR #123',
          estimated_duration: 25,
        },
        expectedLoad: 'light',
      },
    ]

    testCases.forEach(({ name, task, expectedLoad }) => {
      it(`should classify "${name}" as ${expectedLoad}`, async () => {
        const result = await classifier.classifyTask(task)
        expect(result.load).toBe(expectedLoad)
      })
    })
  })
})

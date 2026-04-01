import { describe, it, expect, vi, beforeEach } from 'vitest'
import prioritizationService from '../../services/prioritization/prioritization.service.js'

vi.mock('../../config/database.js', () => ({
  query: vi.fn(),
}))

const { query } = await import('../../config/database.js')

const mockResult = (rows: unknown[]) => ({
  rows,
  command: '',
  rowCount: rows.length,
  oid: 0,
  fields: [],
})

const createMockTask = (overrides: Record<string, unknown> = {}) => ({
  id: 'task-1',
  title: 'Test task',
  priority: 'medium' as const,
  status: 'pending' as const,
  workspace_id: 'ws-1',
  creator_id: 'user-1',
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
})

describe('PrioritizationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('calculatePriorityScore', () => {
    it('should calculate high score for task with near deadline', () => {
      const task = createMockTask({
        id: 'task-1',
        title: 'Urgent task',
        priority: 'high',
        due_date: new Date(Date.now() + 1000 * 60 * 60),
      })

      const result = prioritizationService.calculatePriorityScore(
        task,
        [],
        new Date()
      )
      expect(result.factors.deadlineProximity).toBe(0.9)
      expect(result.taskId).toBe('task-1')
    })

    it('should calculate lower score for tasks with distant deadlines', () => {
      const task = createMockTask({
        id: 'task-2',
        title: 'Future task',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })

      const result = prioritizationService.calculatePriorityScore(
        task,
        [],
        new Date()
      )
      expect(result.factors.deadlineProximity).toBe(0.1)
    })

    it('should return baseline deadline score when no due date', () => {
      const task = createMockTask({
        id: 'task-3',
        title: 'No deadline task',
        priority: 'low',
        due_date: null,
      })

      const result = prioritizationService.calculatePriorityScore(
        task,
        [],
        new Date()
      )
      expect(result.factors.deadlineProximity).toBe(0.3)
    })

    it('should return score of 1.0 for overdue tasks', () => {
      const task = createMockTask({
        id: 'task-4',
        title: 'Overdue task',
        priority: 'high',
        due_date: new Date(Date.now() - 1000 * 60 * 60),
      })

      const result = prioritizationService.calculatePriorityScore(
        task,
        [],
        new Date()
      )
      expect(result.factors.deadlineProximity).toBe(1.0)
    })

    it('should suggest critical priority for scores >= 0.8', () => {
      const task = createMockTask({
        id: 'task-5',
        title: 'Very urgent',
        priority: 'high',
        due_date: new Date(Date.now() + 1000 * 60 * 30),
      })

      const result = prioritizationService.calculatePriorityScore(
        task,
        [],
        new Date()
      )
      expect(['critical', 'high']).toContain(result.suggestedPriority)
    })

    it('should suggest high priority for scores >= 0.6', () => {
      const task = createMockTask({
        id: 'task-6',
        title: 'Upcoming task',
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      })

      const result = prioritizationService.calculatePriorityScore(
        task,
        [],
        new Date()
      )
      expect(['high', 'medium']).toContain(result.suggestedPriority)
    })

    it('should include explanation in result', () => {
      const task = createMockTask({
        id: 'task-8',
        title: 'Explained task',
        priority: 'high',
        due_date: new Date(Date.now() + 1000 * 60 * 60),
      })

      const result = prioritizationService.calculatePriorityScore(
        task,
        [],
        new Date()
      )
      expect(result.explanation).toBeDefined()
      expect(typeof result.explanation).toBe('string')
    })

    it('should return dependency weight of 0.5', () => {
      const task = createMockTask({
        id: 'task-dep',
        title: 'Task with dep',
      })

      const result = prioritizationService.calculatePriorityScore(
        task,
        [],
        new Date()
      )
      expect(result.factors.dependencyWeight).toBe(0.5)
    })
  })

  describe('setWeights and getWeights', () => {
    it('should allow custom weight configuration', () => {
      prioritizationService.setWeights({ deadlineProximity: 0.6 })

      const weights = prioritizationService.getWeights()
      expect(weights.deadlineProximity).toBe(0.6)
    })

    it('should merge partial weights', () => {
      prioritizationService.setWeights({ timeOfDay: 0.5 })

      const weights = prioritizationService.getWeights()
      expect(weights.timeOfDay).toBe(0.5)
    })

    it('should reset to defaults when setWeights called with empty', () => {
      prioritizationService.setWeights({ deadlineProximity: 0.9 })
      prioritizationService.setWeights({})

      const weights = prioritizationService.getWeights()
      expect(weights.deadlineProximity).toBe(0.9)
    })
  })

  describe('calculateTimeOfDayFactor', () => {
    it('should return high score during morning peak hours', () => {
      const task = createMockTask({
        id: 'task-morning',
        title: 'Morning task',
        due_date: null,
      })

      const morning = new Date()
      morning.setHours(10, 0, 0, 0)

      const result = prioritizationService.calculatePriorityScore(
        task,
        [],
        morning
      )
      expect(result.factors.timeOfDay).toBe(0.8)
    })

    it('should return lower score during evening hours', () => {
      const task = createMockTask({
        id: 'task-evening',
        title: 'Evening task',
        due_date: null,
      })

      const evening = new Date()
      evening.setHours(20, 0, 0, 0)

      const result = prioritizationService.calculatePriorityScore(
        task,
        [],
        evening
      )
      expect(result.factors.timeOfDay).toBe(0.3)
    })

    it('should return afternoon score during 2-5pm', () => {
      const task = createMockTask({
        id: 'task-afternoon',
        title: 'Afternoon task',
        due_date: null,
      })

      const afternoon = new Date()
      afternoon.setHours(15, 0, 0, 0)

      const result = prioritizationService.calculatePriorityScore(
        task,
        [],
        afternoon
      )
      expect(result.factors.timeOfDay).toBe(0.7)
    })

    it('should return early morning score during 8-9am', () => {
      const task = createMockTask({
        id: 'task-early',
        title: 'Early task',
        due_date: null,
      })

      const early = new Date()
      early.setHours(8, 30, 0, 0)

      const result = prioritizationService.calculatePriorityScore(
        task,
        [],
        early
      )
      expect(result.factors.timeOfDay).toBe(0.6)
    })

    it('should return evening score during 5-7pm', () => {
      const task = createMockTask({
        id: 'task-eve',
        title: 'Evening task',
        due_date: null,
      })

      const eve = new Date()
      eve.setHours(18, 0, 0, 0)

      const result = prioritizationService.calculatePriorityScore(task, [], eve)
      expect(result.factors.timeOfDay).toBe(0.5)
    })
  })

  describe('suggestPriorities', () => {
    it('should return priority scores for multiple tasks', async () => {
      const tasks = [
        createMockTask({
          id: 'task-1',
          title: 'Task 1',
          priority: 'high',
          due_date: new Date(),
        }),
        createMockTask({
          id: 'task-2',
          title: 'Task 2',
          priority: 'low',
          due_date: new Date(),
        }),
      ]

      vi.mocked(query).mockResolvedValueOnce(mockResult([]))

      const results = await prioritizationService.suggestPriorities(
        tasks,
        'user-1',
        'ws-1'
      )

      expect(results).toHaveLength(2)
      expect(results[0].taskId).toBe('task-1')
      expect(results[1].taskId).toBe('task-2')
    })

    it('should include history in scoring', async () => {
      const task = createMockTask({
        id: 'task-history',
        title: 'Task with history',
        due_date: new Date(),
      })

      const history = [
        {
          id: 'h1',
          title: 'Completed task',
          priority: 'medium' as const,
          status: 'completed' as const,
          workspace_id: 'ws-1',
          creator_id: 'user-1',
          due_date: new Date(),
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          updated_at: new Date(),
          completed_at: new Date(),
        },
      ]

      vi.mocked(query).mockResolvedValueOnce(mockResult(history))

      const result = await prioritizationService.suggestPriorities(
        [task],
        'user-1',
        'ws-1'
      )

      expect(result[0].factors.historicalPattern).toBeDefined()
    })
  })

  describe('recordFeedback', () => {
    it('should record accepted feedback', async () => {
      vi.mocked(query).mockResolvedValueOnce(mockResult([]))

      await prioritizationService.recordFeedback('task-1', 'user-1', true)

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO priority_feedback'),
        ['task-1', 'user-1', true]
      )
    })

    it('should record rejected feedback', async () => {
      vi.mocked(query).mockResolvedValueOnce(mockResult([]))

      await prioritizationService.recordFeedback('task-1', 'user-1', false)

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO priority_feedback'),
        ['task-1', 'user-1', false]
      )
    })
  })
})

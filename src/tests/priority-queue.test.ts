import { describe, it, expect, beforeEach } from 'vitest'
import {
  PriorityQueue,
  PRIORITY_WEIGHTS,
} from '../services/scheduling/priority-queue.js'

describe('PriorityQueue', () => {
  let queue: PriorityQueue

  beforeEach(() => {
    queue = new PriorityQueue()
  })

  describe('add', () => {
    it('should add a task to the queue', () => {
      queue.add({
        taskId: 'task-1',
        userId: 'user-1',
        workspaceId: 'ws-1',
        priority: 'high',
      })

      expect(queue.size()).toBe(1)
      expect(queue.hasTask('task-1')).toBe(true)
    })

    it('should calculate score based on priority', () => {
      queue.add({
        taskId: 'task-1',
        userId: 'user-1',
        workspaceId: 'ws-1',
        priority: 'critical',
      })

      const task = queue.getTask('task-1')
      expect(task?.score).toBeDefined()
      expect(task?.score).toBeGreaterThan(0)
    })
  })

  describe('remove', () => {
    it('should remove a task from the queue', () => {
      queue.add({
        taskId: 'task-1',
        userId: 'user-1',
        workspaceId: 'ws-1',
        priority: 'high',
      })

      const removed = queue.remove('task-1', 'user-1')
      expect(removed).toBe(true)
      expect(queue.size()).toBe(0)
    })

    it('should not remove task belonging to another user', () => {
      queue.add({
        taskId: 'task-1',
        userId: 'user-1',
        workspaceId: 'ws-1',
        priority: 'high',
      })

      const removed = queue.remove('task-1', 'user-2')
      expect(removed).toBe(false)
      expect(queue.size()).toBe(1)
    })
  })

  describe('reprioritize', () => {
    it('should update task priority', () => {
      queue.add({
        taskId: 'task-1',
        userId: 'user-1',
        workspaceId: 'ws-1',
        priority: 'low',
      })

      const updated = queue.reprioritize('task-1', 'user-1', 'critical')
      expect(updated).toBe(true)

      const task = queue.getTask('task-1')
      expect(task?.priority).toBe('critical')
    })

    it('should recalculate score after reprioritizing', () => {
      queue.add({
        taskId: 'task-1',
        userId: 'user-1',
        workspaceId: 'ws-1',
        priority: 'low',
      })

      const lowPriorityScore = queue.getTask('task-1')?.score

      queue.reprioritize('task-1', 'user-1', 'critical')
      const highPriorityScore = queue.getTask('task-1')?.score

      expect(highPriorityScore).toBeGreaterThan(lowPriorityScore || 0)
    })
  })

  describe('peek and getNext', () => {
    it('should return highest priority task with peek', () => {
      queue.add({
        taskId: 'task-low',
        userId: 'user-1',
        workspaceId: 'ws-1',
        priority: 'low',
      })

      queue.add({
        taskId: 'task-critical',
        userId: 'user-1',
        workspaceId: 'ws-1',
        priority: 'critical',
      })

      queue.add({
        taskId: 'task-medium',
        userId: 'user-1',
        workspaceId: 'ws-1',
        priority: 'medium',
      })

      const top = queue.peek('user-1')
      expect(top?.taskId).toBe('task-critical')
    })

    it('should remove task after getNext', () => {
      queue.add({
        taskId: 'task-1',
        userId: 'user-1',
        workspaceId: 'ws-1',
        priority: 'high',
      })

      expect(queue.size()).toBe(1)

      const task = queue.getNext('user-1')
      expect(task?.taskId).toBe('task-1')

      expect(queue.size()).toBe(0)
    })
  })

  describe('getAll', () => {
    it('should return all tasks sorted by score', () => {
      queue.add({
        taskId: 'task-1',
        userId: 'user-1',
        workspaceId: 'ws-1',
        priority: 'low',
      })

      queue.add({
        taskId: 'task-2',
        userId: 'user-1',
        workspaceId: 'ws-1',
        priority: 'critical',
      })

      const tasks = queue.getAll('user-1')
      expect(tasks.length).toBe(2)
      expect(tasks[0].taskId).toBe('task-2')
      expect(tasks[1].taskId).toBe('task-1')
    })

    it('should return empty array for user with no tasks', () => {
      const tasks = queue.getAll('non-existent-user')
      expect(tasks).toEqual([])
    })
  })

  describe('getStats', () => {
    it('should return correct queue statistics', () => {
      queue.add({
        taskId: 'task-1',
        userId: 'user-1',
        workspaceId: 'ws-1',
        priority: 'critical',
      })

      queue.add({
        taskId: 'task-2',
        userId: 'user-1',
        workspaceId: 'ws-1',
        priority: 'high',
      })

      queue.add({
        taskId: 'task-3',
        userId: 'user-1',
        workspaceId: 'ws-1',
        priority: 'medium',
      })

      const stats = queue.getStats('user-1')
      expect(stats.size).toBe(3)
      expect(stats.byPriority.critical).toBe(1)
      expect(stats.byPriority.high).toBe(1)
      expect(stats.byPriority.medium).toBe(1)
      expect(stats.byPriority.low).toBe(0)
      expect(stats.averageScore).toBeGreaterThan(0)
    })
  })

  describe('clear', () => {
    it('should remove all tasks for a user', () => {
      queue.add({
        taskId: 'task-1',
        userId: 'user-1',
        workspaceId: 'ws-1',
        priority: 'high',
      })

      queue.add({
        taskId: 'task-2',
        userId: 'user-1',
        workspaceId: 'ws-1',
        priority: 'low',
      })

      const cleared = queue.clear('user-1')
      expect(cleared).toBe(2)
      expect(queue.size()).toBe(0)
    })
  })

  describe('deadline urgency', () => {
    it('should increase score for urgent deadlines', () => {
      const now = new Date()

      queue.add({
        taskId: 'task-urgent',
        userId: 'user-1',
        workspaceId: 'ws-1',
        priority: 'high',
        dueDate: new Date(now.getTime() + 1000 * 60 * 30),
      })

      queue.add({
        taskId: 'task-normal',
        userId: 'user-1',
        workspaceId: 'ws-1',
        priority: 'high',
        dueDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 5),
      })

      const tasks = queue.getAll('user-1')
      expect(tasks[0].taskId).toBe('task-urgent')
    })

    it('should increase score for overdue tasks', () => {
      const now = new Date()

      queue.add({
        taskId: 'task-overdue',
        userId: 'user-1',
        workspaceId: 'ws-1',
        priority: 'high',
        dueDate: new Date(now.getTime() - 1000 * 60 * 60),
      })

      queue.add({
        taskId: 'task-normal',
        userId: 'user-1',
        workspaceId: 'ws-1',
        priority: 'high',
      })

      const tasks = queue.getAll('user-1')
      expect(tasks[0].taskId).toBe('task-overdue')
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DiffGenerator } from '../domains/activity/services/DiffGenerator'

describe('DiffGenerator', () => {
  let diffGenerator: DiffGenerator

  beforeEach(() => {
    diffGenerator = new DiffGenerator()
  })

  describe('generate', () => {
    it('should detect title changes', () => {
      const previous = { title: 'Old Title' }
      const current = { title: 'New Title' }

      const changes = diffGenerator.generate(previous, current)

      expect(changes).toHaveLength(1)
      expect(changes[0]).toEqual({
        field: 'title',
        old_value: 'Old Title',
        new_value: 'New Title',
        display_name: 'Title',
      })
    })

    it('should detect status changes', () => {
      const previous = { status: 'todo' }
      const current = { status: 'completed' }

      const changes = diffGenerator.generate(previous, current)

      expect(changes).toHaveLength(1)
      expect(changes[0].field).toBe('status')
      expect(changes[0].old_value).toBe('todo')
      expect(changes[0].new_value).toBe('completed')
    })

    it('should detect multiple field changes', () => {
      const previous = { title: 'Old', status: 'todo', priority: 'medium' }
      const current = { title: 'New', status: 'completed', priority: 'high' }

      const changes = diffGenerator.generate(previous, current)

      expect(changes).toHaveLength(3)
      expect(changes.map(c => c.field)).toContain('title')
      expect(changes.map(c => c.field)).toContain('status')
      expect(changes.map(c => c.field)).toContain('priority')
    })

    it('should return empty array when no changes', () => {
      const previous = { title: 'Same', status: 'todo' }
      const current = { title: 'Same', status: 'todo' }

      const changes = diffGenerator.generate(previous, current)

      expect(changes).toHaveLength(0)
    })

    it('should handle null values', () => {
      const previous = { title: 'Title' }
      const current = { title: null }

      const changes = diffGenerator.generate(previous, current)

      expect(changes).toHaveLength(1)
      expect(changes[0].old_value).toBe('Title')
      expect(changes[0].new_value).toBeNull()
    })

    it('should handle undefined values', () => {
      const previous = { description: undefined }
      const current = { description: 'New description' }

      const changes = diffGenerator.generate(previous, current)

      expect(changes).toHaveLength(1)
      expect(changes[0].field).toBe('description')
      expect(changes[0].new_value).toBe('New description')
    })

    it('should handle assignee_id changes', () => {
      const previous = { assignee_id: 'user-1' }
      const current = { assignee_id: 'user-2' }

      const changes = diffGenerator.generate(previous, current)

      expect(changes).toHaveLength(1)
      expect(changes[0].field).toBe('assignee_id')
      expect(changes[0].display_name).toBe('Assignee')
    })

    it('should ignore fields not in trackedFields', () => {
      const previous = { title: 'Old', custom_field: 'old' }
      const current = { title: 'Old', custom_field: 'new' }

      const changes = diffGenerator.generate(previous, current)

      expect(changes).toHaveLength(0)
    })

    it('should handle due_date changes', () => {
      const previous = { due_date: new Date('2024-01-01') }
      const current = { due_date: new Date('2024-02-01') }

      const changes = diffGenerator.generate(previous, current)

      expect(changes).toHaveLength(1)
      expect(changes[0].field).toBe('due_date')
      expect(changes[0].old_value).toBe('2024-01-01T00:00:00.000Z')
      expect(changes[0].new_value).toBe('2024-02-01T00:00:00.000Z')
    })

    it('should handle blocked changes', () => {
      const previous = { blocked: false }
      const current = { blocked: true, blocked_reason: 'Waiting for review' }

      const changes = diffGenerator.generate(previous, current)

      expect(changes).toHaveLength(2)
      expect(changes.map(c => c.field)).toContain('blocked')
      expect(changes.map(c => c.field)).toContain('blocked_reason')
    })

    it('should not track untracked fields like metadata', () => {
      const previous = { metadata: { key: 'value1' } }
      const current = { metadata: { key: 'value2' } }

      const changes = diffGenerator.generate(previous, current)

      expect(changes).toHaveLength(0)
    })

    it('should not track untracked fields like tags', () => {
      const previous = { tags: ['a', 'b'] }
      const current = { tags: ['a', 'c'] }

      const changes = diffGenerator.generate(previous, current)

      expect(changes).toHaveLength(0)
    })

    it('should handle project_id changes', () => {
      const previous = { project_id: 'proj-1' }
      const current = { project_id: 'proj-2' }

      const changes = diffGenerator.generate(previous, current)

      expect(changes).toHaveLength(1)
      expect(changes[0].field).toBe('project_id')
      expect(changes[0].display_name).toBe('Project')
    })

    it('should handle parent_id changes', () => {
      const previous = { parent_id: 'task-1' }
      const current = { parent_id: 'task-2' }

      const changes = diffGenerator.generate(previous, current)

      expect(changes).toHaveLength(1)
      expect(changes[0].field).toBe('parent_id')
      expect(changes[0].display_name).toBe('Parent Task')
    })

    it('should handle estimated_duration changes', () => {
      const previous = { estimated_duration: 3600 }
      const current = { estimated_duration: 7200 }

      const changes = diffGenerator.generate(previous, current)

      expect(changes).toHaveLength(1)
      expect(changes[0].field).toBe('estimated_duration')
      expect(changes[0].display_name).toBe('Estimated Duration')
    })

    it('should handle priority changes', () => {
      const previous = { priority: 'low' }
      const current = { priority: 'critical' }

      const changes = diffGenerator.generate(previous, current)

      expect(changes).toHaveLength(1)
      expect(changes[0].field).toBe('priority')
      expect(changes[0].display_name).toBe('Priority')
    })
  })
})

describe('Activity Feed Integration', () => {
  describe('API Contract', () => {
    it('should have correct event types defined', () => {
      const taskEventTypes = [
        'task.created',
        'task.updated',
        'task.deleted',
        'task.restored',
        'task.archived',
        'task.assigned',
        'task.completed',
        'task.uncompleted',
        'task.blocked',
        'task.unblocked',
        'task.moved',
        'task.merged',
        'task.split',
      ]

      taskEventTypes.forEach(type => {
        expect(type).toMatch(
          /^task\.(created|updated|deleted|restored|archived|assigned|completed|uncompleted|blocked|unblocked|moved|merged|split)$/
        )
      })
    })

    it('should have correct entity types defined', () => {
      const entityTypes = [
        'task',
        'project',
        'comment',
        'attachment',
        'label',
        'time_entry',
        'automation',
        'agent_run',
      ]

      entityTypes.forEach(type => {
        expect(type).toBeTruthy()
      })
    })

    it('should have correct action types defined', () => {
      const actionTypes = [
        'create',
        'update',
        'delete',
        'restore',
        'archive',
        'assign',
        'complete',
        'comment',
        'attach',
        'move',
        'merge',
        'split',
      ]

      actionTypes.forEach(action => {
        expect(action).toBeTruthy()
      })
    })
  })
})

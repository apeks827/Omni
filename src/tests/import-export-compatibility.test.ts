import { describe, it, expect } from 'vitest'
import { parseImportData } from '../services/import-export.service.js'

describe('External Format Compatibility Tests', () => {
  describe('Todoist Format', () => {
    it('should parse Todoist JSON export', () => {
      const todoistData = JSON.stringify([
        {
          content: 'Buy groceries',
          priority: 4,
          due: { date: '2026-03-31' },
          labels: ['shopping', 'urgent'],
        },
        {
          content: 'Call dentist',
          priority: 2,
          due: null,
          labels: [],
        },
      ])

      const mapping = {
        content: 'title',
        priority: 'priority',
        due: 'due_date',
      }

      const result = parseImportData(todoistData, 'json', mapping)
      expect(result).toHaveLength(2)
      expect(result[0].title).toBe('Buy groceries')
      expect(result[0].priority).toBe(4)
    })

    it('should map Todoist priority levels correctly', () => {
      const todoistData = JSON.stringify([
        { content: 'P1 Task', priority: 4 },
        { content: 'P2 Task', priority: 3 },
        { content: 'P3 Task', priority: 2 },
        { content: 'P4 Task', priority: 1 },
      ])

      const mapping = { content: 'title', priority: 'priority' }
      const result = parseImportData(todoistData, 'json', mapping)

      expect(result[0].priority).toBe(4)
      expect(result[1].priority).toBe(3)
      expect(result[2].priority).toBe(2)
      expect(result[3].priority).toBe(1)
    })

    it('should handle Todoist CSV export', () => {
      const todoistCSV = `TYPE,CONTENT,PRIORITY,INDENT,AUTHOR,RESPONSIBLE,DATE,DATE_LANG,TIMEZONE
task,Buy milk,1,1,user@example.com,,2026-03-31,en,UTC
task,Pay bills,4,1,user@example.com,,2026-04-01,en,UTC`

      const mapping = {
        CONTENT: 'title',
        PRIORITY: 'priority',
        DATE: 'due_date',
      }

      const result = parseImportData(todoistCSV, 'csv', mapping)
      expect(result).toHaveLength(2)
      expect(result[0].title).toBe('Buy milk')
      expect(result[1].title).toBe('Pay bills')
    })
  })

  describe('Trello Format', () => {
    it('should parse Trello JSON export', () => {
      const trelloData = JSON.stringify([
        {
          name: 'Design homepage',
          desc: 'Create mockups for new homepage',
          due: '2026-04-01T12:00:00.000Z',
          labels: [{ name: 'Design' }, { name: 'High Priority' }],
          idList: 'list123',
        },
        {
          name: 'Review PR',
          desc: '',
          due: null,
          labels: [],
          idList: 'list456',
        },
      ])

      const mapping = {
        name: 'title',
        desc: 'description',
        due: 'due_date',
      }

      const result = parseImportData(trelloData, 'json', mapping)
      expect(result).toHaveLength(2)
      expect(result[0].title).toBe('Design homepage')
      expect(result[0].description).toBe('Create mockups for new homepage')
      expect(result[1].title).toBe('Review PR')
    })

    it('should handle Trello board structure', () => {
      const trelloData = JSON.stringify([
        { name: 'Todo Task', idList: 'todo-list' },
        { name: 'In Progress Task', idList: 'progress-list' },
        { name: 'Done Task', idList: 'done-list' },
      ])

      const mapping = { name: 'title', idList: 'project_id' }
      const result = parseImportData(trelloData, 'json', mapping)

      expect(result).toHaveLength(3)
      expect(result[0].project_id).toBe('todo-list')
      expect(result[1].project_id).toBe('progress-list')
      expect(result[2].project_id).toBe('done-list')
    })
  })

  describe('Asana Format', () => {
    it('should parse Asana JSON export', () => {
      const asanaData = JSON.stringify([
        {
          name: 'Write documentation',
          notes: 'Update API docs with new endpoints',
          due_on: '2026-04-05',
          completed: false,
          assignee: { name: 'John Doe' },
        },
        {
          name: 'Deploy to production',
          notes: '',
          due_on: '2026-04-10',
          completed: true,
          assignee: null,
        },
      ])

      const mapping = {
        name: 'title',
        notes: 'description',
        due_on: 'due_date',
        completed: 'status',
      }

      const result = parseImportData(asanaData, 'json', mapping)
      expect(result).toHaveLength(2)
      expect(result[0].title).toBe('Write documentation')
      expect(result[0].description).toBe('Update API docs with new endpoints')
      expect(result[1].title).toBe('Deploy to production')
    })

    it('should handle Asana CSV export', () => {
      const asanaCSV = `Task ID,Created At,Completed At,Last Modified,Name,Assignee,Assignee Email,Start Date,Due Date,Tags,Notes,Projects,Parent Task
123,2026-03-01,,,Setup database,John Doe,john@example.com,,2026-03-31,backend,Install PostgreSQL,Project Alpha,
124,2026-03-02,2026-03-15,,Write tests,Jane Smith,jane@example.com,,2026-03-20,testing,Unit tests for API,Project Alpha,123`

      const mapping = {
        Name: 'title',
        Notes: 'description',
        'Due Date': 'due_date',
        Tags: 'priority',
      }

      const result = parseImportData(asanaCSV, 'csv', mapping)
      expect(result).toHaveLength(2)
      expect(result[0].title).toBe('Setup database')
      expect(result[0].description).toBe('Install PostgreSQL')
      expect(result[1].title).toBe('Write tests')
    })

    it('should map Asana completion status', () => {
      const asanaData = JSON.stringify([
        { name: 'Task 1', completed: true },
        { name: 'Task 2', completed: false },
      ])

      const mapping = { name: 'title', completed: 'status' }
      const result = parseImportData(asanaData, 'json', mapping)

      expect(result[0].status).toBe(true)
      expect(result[1].status).toBe(false)
    })
  })

  describe('Generic Format Support', () => {
    it('should handle nested JSON structures with mapping', () => {
      const nestedData = JSON.stringify([
        {
          task: { title: 'Nested Task', meta: { priority: 'high' } },
          dates: { due: '2026-04-01' },
        },
      ])

      const mapping = {
        'task.title': 'title',
        'task.meta.priority': 'priority',
        'dates.due': 'due_date',
      }

      const result = parseImportData(nestedData, 'json', mapping)
      expect(result).toHaveLength(1)
    })

    it('should handle missing fields gracefully', () => {
      const incompleteData = JSON.stringify([
        { title: 'Task with title only' },
        { title: 'Task with priority', priority: 'high' },
        { description: 'Task without title' },
      ])

      const result = parseImportData(incompleteData, 'json')
      expect(result).toHaveLength(3)
      expect(result[0].title).toBe('Task with title only')
      expect(result[1].priority).toBe('high')
      expect(result[2].description).toBe('Task without title')
    })

    it('should preserve custom fields during import', () => {
      const customData = JSON.stringify([
        {
          title: 'Task with custom fields',
          custom_field_1: 'value1',
          custom_field_2: 123,
          custom_field_3: true,
        },
      ])

      const result = parseImportData(customData, 'json')
      expect(result[0].custom_field_1).toBe('value1')
      expect(result[0].custom_field_2).toBe(123)
      expect(result[0].custom_field_3).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty arrays', () => {
      const emptyData = JSON.stringify([])
      const result = parseImportData(emptyData, 'json')
      expect(result).toHaveLength(0)
    })

    it('should handle special characters in task titles', () => {
      const specialCharsData = JSON.stringify([
        { title: 'Task with "quotes"' },
        { title: "Task with 'apostrophes'" },
        { title: 'Task with, commas' },
        { title: 'Task with\nnewlines' },
      ])

      const result = parseImportData(specialCharsData, 'json')
      expect(result).toHaveLength(4)
      expect(result[0].title).toContain('quotes')
      expect(result[2].title).toContain('commas')
    })

    it('should handle very long task titles', () => {
      const longTitle = 'A'.repeat(1000)
      const data = JSON.stringify([{ title: longTitle }])
      const result = parseImportData(data, 'json')
      expect(result[0].title).toBe(longTitle)
    })

    it('should handle Unicode characters', () => {
      const unicodeData = JSON.stringify([
        { title: '任务 1' },
        { title: 'Задача 2' },
        { title: 'مهمة 3' },
        { title: '🚀 Task with emoji' },
      ])

      const result = parseImportData(unicodeData, 'json')
      expect(result).toHaveLength(4)
      expect(result[0].title).toBe('任务 1')
      expect(result[3].title).toContain('🚀')
    })
  })
})

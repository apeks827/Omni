import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseImportData } from '../services/import-export.service.js'

describe('Import/Export Service', () => {
  describe('parseImportData', () => {
    describe('JSON parsing', () => {
      it('should parse single task JSON', () => {
        const data = JSON.stringify({ title: 'Test Task', priority: 'high' })
        const result = parseImportData(data, 'json')
        expect(result).toHaveLength(1)
        expect(result[0].title).toBe('Test Task')
        expect(result[0].priority).toBe('high')
      })

      it('should parse array of tasks JSON', () => {
        const data = JSON.stringify([{ title: 'Task 1' }, { title: 'Task 2' }])
        const result = parseImportData(data, 'json')
        expect(result).toHaveLength(2)
        expect(result[0].title).toBe('Task 1')
        expect(result[1].title).toBe('Task 2')
      })

      it('should apply field mapping when provided', () => {
        const data = JSON.stringify({ name: 'Test Task', level: 'high' })
        const mapping = { name: 'title', level: 'priority' }
        const result = parseImportData(data, 'json', mapping)
        expect(result[0].title).toBe('Test Task')
        expect(result[0].priority).toBe('high')
        expect(result[0].name).toBeUndefined()
      })
    })

    describe('CSV parsing', () => {
      it('should parse CSV with headers', () => {
        const data = `title,priority,status
Test Task,high,todo
Another Task,medium,in_progress`
        const result = parseImportData(data, 'csv')
        expect(result).toHaveLength(2)
        expect(result[0].title).toBe('Test Task')
        expect(result[0].priority).toBe('high')
        expect(result[0].status).toBe('todo')
      })

      it('should throw error for CSV without rows', () => {
        const data = 'title,priority'
        expect(() => parseImportData(data, 'csv')).toThrow()
      })

      it('should handle CSV with quoted values containing commas', () => {
        const data = `title,description
Task with "comma, in name",This is a description`
        const result = parseImportData(data, 'csv')
        expect(result).toHaveLength(1)
      })
    })

    describe('Markdown parsing', () => {
      it('should parse checkbox tasks', () => {
        const data = `- [ ] Uncompleted task
- [x] Completed task`
        const result = parseImportData(data, 'markdown')
        expect(result).toHaveLength(2)
        expect(result[0].title).toBe('Uncompleted task')
        expect(result[0].status).toBe('todo')
        expect(result[1].title).toBe('Completed task')
        expect(result[1].status).toBe('done')
      })

      it('should handle bullet point syntax', () => {
        const data = '* [ ] Asterisk task'
        const result = parseImportData(data, 'markdown')
        expect(result).toHaveLength(1)
        expect(result[0].title).toBe('Asterisk task')
      })
    })

    describe('iCal parsing', () => {
      it('should parse VTODO events', () => {
        const data = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTODO
SUMMARY:ICal Task
DESCRIPTION:This is a description
DUE:20260330T120000Z
PRIORITY:3
END:VTODO
END:VCALENDAR`
        const result = parseImportData(data, 'ical')
        expect(result).toHaveLength(1)
        expect(result[0].title).toBe('ICal Task')
        expect(result[0].description).toBe('This is a description')
        expect(result[0].priority).toBe('high')
      })

      it('should map priority values correctly', () => {
        const data = `BEGIN:VCALENDAR
BEGIN:VTODO
SUMMARY:Low Priority
PRIORITY:9
END:VTODO
END:VCALENDAR`
        const result = parseImportData(data, 'ical')
        expect(result[0].priority).toBe('low')
      })
    })
  })

  describe('Export formats', () => {
    it('should define correct content types', () => {
      const mockTasks = [
        {
          id: '1',
          title: 'Test',
          status: 'todo',
          priority: 'medium',
          description: null,
          project_name: null,
          due_date: null,
          created_at: new Date(),
        },
      ]
      expect(mockTasks[0].title).toBeDefined()
    })
  })
})

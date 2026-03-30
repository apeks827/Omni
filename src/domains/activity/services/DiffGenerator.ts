import { FieldChange } from '../../../../shared/types/activity.js'

export class DiffGenerator {
  private readonly trackedFields = new Set([
    'title',
    'description',
    'status',
    'priority',
    'due_date',
    'assignee_id',
    'project_id',
    'parent_id',
    'blocked',
    'blocked_reason',
    'estimated_duration',
  ])

  private readonly fieldDisplayNames: Record<string, string> = {
    title: 'Title',
    description: 'Description',
    status: 'Status',
    priority: 'Priority',
    due_date: 'Due Date',
    assignee_id: 'Assignee',
    project_id: 'Project',
    parent_id: 'Parent Task',
    blocked: 'Blocked',
    blocked_reason: 'Block Reason',
    estimated_duration: 'Estimated Duration',
  }

  generate(previous: any, current: any): FieldChange[] {
    const changes: FieldChange[] = []

    for (const field of this.trackedFields) {
      const oldValue = previous[field]
      const newValue = current[field]

      if (!this.isEqual(oldValue, newValue)) {
        changes.push({
          field,
          old_value: this.serialize(oldValue),
          new_value: this.serialize(newValue),
          display_name: this.fieldDisplayNames[field] || field,
        })
      }
    }

    return changes
  }

  private serialize(value: any): any {
    if (value === null || value === undefined) return null
    if (value instanceof Date) return value.toISOString()
    if (typeof value === 'object') return JSON.parse(JSON.stringify(value))
    return value
  }

  private isEqual(a: any, b: any): boolean {
    return (
      JSON.stringify(this.serialize(a)) === JSON.stringify(this.serialize(b))
    )
  }
}

export default new DiffGenerator()

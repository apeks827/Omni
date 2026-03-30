import timeEntryRepository from '../repositories/TimeEntryRepository.js'
import { AppError, ErrorCodes } from '../../../utils/errors.js'

class AnalyticsService {
  async getAnalytics(
    workspaceId: string,
    userId: string,
    startDate: Date,
    endDate: Date,
    groupBy: 'task' | 'day' | 'week' | 'project' = 'task'
  ) {
    if (startDate > endDate) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'start_date must be before end_date',
        {},
        400
      )
    }

    return timeEntryRepository.getAnalytics(
      workspaceId,
      userId,
      startDate,
      endDate,
      groupBy
    )
  }

  async exportData(
    workspaceId: string,
    userId: string,
    startDate: Date,
    endDate: Date,
    format: 'csv' | 'json' = 'json'
  ) {
    const { entries } = await timeEntryRepository.findByFilters(
      workspaceId,
      userId,
      {
        start_date: startDate,
        end_date: endDate,
        limit: 10000,
        offset: 0,
      }
    )

    if (format === 'csv') {
      return this.convertToCSV(entries)
    }

    return entries
  }

  private convertToCSV(entries: any[]): string {
    const headers = [
      'date',
      'task_id',
      'start_time',
      'end_time',
      'duration_minutes',
      'type',
      'description',
    ]

    const rows = entries.map(entry => [
      new Date(entry.start_time).toISOString().split('T')[0],
      entry.task_id,
      new Date(entry.start_time).toISOString(),
      entry.end_time ? new Date(entry.end_time).toISOString() : '',
      Math.round(entry.duration_seconds / 60),
      entry.type,
      entry.description || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    return csvContent
  }
}

export default new AnalyticsService()

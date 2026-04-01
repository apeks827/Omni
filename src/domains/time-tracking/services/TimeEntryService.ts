import timeEntryRepository, {
  CreateTimeEntryData,
  TimeEntryFilters,
} from '../repositories/TimeEntryRepository.js'
import { TimeEntry } from '../models/TimeEntry.js'
import { AppError, ErrorCodes } from '../../../utils/errors.js'

class TimeEntryService {
  async createEntry(data: CreateTimeEntryData): Promise<TimeEntry> {
    if (!data.task_id) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'task_id is required',
        {},
        400
      )
    }

    if (data.duration_seconds < 0) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'duration_seconds must be non-negative',
        {},
        400
      )
    }

    if (!data.start_time) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'start_time is required',
        {},
        400
      )
    }

    return timeEntryRepository.create(data)
  }

  async getEntry(id: string, workspaceId: string, userId: string): Promise<TimeEntry> {
    const entry = await timeEntryRepository.findById(id, workspaceId, userId)
    if (!entry) {
      throw new AppError(
        ErrorCodes.NOT_FOUND,
        'Time entry not found',
        { id },
        404
      )
    }
    return entry
  }

  async listEntries(
    workspaceId: string,
    userId: string,
    filters: TimeEntryFilters
  ): Promise<{
    entries: TimeEntry[]
    total: number
    limit: number
    offset: number
  }> {
    const result = await timeEntryRepository.findByFilters(
      workspaceId,
      userId,
      filters
    )
    return {
      entries: result.entries,
      total: result.total,
      limit: filters.limit || 20,
      offset: filters.offset || 0,
    }
  }

  async updateEntry(
    id: string,
    workspaceId: string,
    userId: string,
    data: Partial<CreateTimeEntryData>
  ): Promise<TimeEntry> {
    const existing = await timeEntryRepository.findById(id, workspaceId, userId)
    if (!existing) {
      throw new AppError(
        ErrorCodes.NOT_FOUND,
        'Time entry not found',
        { id },
        404
      )
    }
    
    const entry = await timeEntryRepository.update(id, workspaceId, data)
    if (!entry) {
      throw new AppError(
        ErrorCodes.NOT_FOUND,
        'Time entry not found',
        { id },
        404
      )
    }
    return entry
  }

  async deleteEntry(id: string, workspaceId: string, userId: string): Promise<void> {
    const existing = await timeEntryRepository.findById(id, workspaceId, userId)
    if (!existing) {
      throw new AppError(
        ErrorCodes.NOT_FOUND,
        'Time entry not found',
        { id },
        404
      )
    }
    
    const deleted = await timeEntryRepository.delete(id, workspaceId)
    if (!deleted) {
      throw new AppError(
        ErrorCodes.NOT_FOUND,
        'Time entry not found',
        { id },
        404
      )
    }
  }
}

export default new TimeEntryService()

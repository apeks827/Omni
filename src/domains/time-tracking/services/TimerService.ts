import timerRepository, {
  CreateTimerStateData,
} from '../repositories/TimerRepository.js'
import timeEntryRepository from '../repositories/TimeEntryRepository.js'
import { TimerState } from '../models/TimeEntry.js'
import { AppError, ErrorCodes } from '../../../utils/errors.js'

class TimerService {
  async startTimer(data: CreateTimerStateData): Promise<TimerState> {
    const existingTimer = await timerRepository.getActiveTimer(
      data.user_id,
      data.workspace_id
    )

    if (existingTimer) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Timer already running',
        { task_id: existingTimer.task_id },
        400
      )
    }

    return timerRepository.create(data)
  }

  async pauseTimer(userId: string, workspaceId: string): Promise<TimerState> {
    const timer = await timerRepository.getActiveTimer(userId, workspaceId)

    if (!timer) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'No active timer found', {}, 404)
    }

    if (timer.status === 'paused') {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Timer already paused',
        {},
        400
      )
    }

    const now = new Date()
    const elapsedSinceStart = Math.floor(
      (now.getTime() - new Date(timer.start_time).getTime()) / 1000
    )
    const totalElapsed = timer.elapsed_seconds + elapsedSinceStart

    const updated = await timerRepository.update(userId, workspaceId, {
      status: 'paused',
      elapsed_seconds: totalElapsed,
      last_tick_at: now,
    })

    if (!updated) {
      throw new AppError(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to pause timer',
        {},
        500
      )
    }

    return updated
  }

  async resumeTimer(userId: string, workspaceId: string): Promise<TimerState> {
    const timer = await timerRepository.getActiveTimer(userId, workspaceId)

    if (!timer) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'No active timer found', {}, 404)
    }

    if (timer.status !== 'paused') {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Timer is not paused',
        {},
        400
      )
    }

    const updated = await timerRepository.update(userId, workspaceId, {
      status: 'running',
      last_tick_at: new Date(),
    })

    if (!updated) {
      throw new AppError(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to resume timer',
        {},
        500
      )
    }

    return updated
  }

  async stopTimer(
    userId: string,
    workspaceId: string,
    description?: string
  ): Promise<{ time_entry_id: string; duration_seconds: number }> {
    const timer = await timerRepository.getActiveTimer(userId, workspaceId)

    if (!timer) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'No active timer found', {}, 404)
    }

    const now = new Date()
    let totalElapsed = timer.elapsed_seconds

    if (timer.status === 'running') {
      const elapsedSinceStart = Math.floor(
        (now.getTime() - new Date(timer.start_time).getTime()) / 1000
      )
      totalElapsed += elapsedSinceStart
    }

    const timeEntry = await timeEntryRepository.create({
      task_id: timer.task_id,
      workspace_id: timer.workspace_id,
      user_id: timer.user_id,
      start_time: timer.start_time,
      end_time: now,
      duration_seconds: totalElapsed,
      type: timer.pomodoro_type ? 'pomodoro' : 'timer',
      pomodoro_type: timer.pomodoro_type,
      description,
      source: 'client',
    })

    await timerRepository.update(userId, workspaceId, {
      status: 'stopped',
    })

    return {
      time_entry_id: timeEntry.id,
      duration_seconds: totalElapsed,
    }
  }

  async getTimerStatus(
    userId: string,
    workspaceId: string
  ): Promise<TimerState | null> {
    return timerRepository.getActiveTimer(userId, workspaceId)
  }
}

export default new TimerService()

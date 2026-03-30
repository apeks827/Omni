import calendarRepository, {
  ScheduledTask,
} from '../repositories/CalendarRepository.js'
import energyService from '../../../services/calendar/energy.service.js'
import rebalancerService from '../../../services/calendar/rebalancer.js'
import habitScheduler from '../../../services/habits/scheduler.service.js'
import taskRepository from '../../tasks/repositories/TaskRepository.js'
import { AppError, ErrorCodes } from '../../../utils/errors.js'

export interface DaySchedule {
  date: string
  blocks: Array<{
    hour: number
    score: number
    scheduled_task_id?: string
    scheduled_task_title?: string
    scheduled_task_priority?: string
  }>
  energy_pattern: any
  habits: any[]
  routines: any[]
  conflicts: any[]
}

export interface WeekSchedule {
  start_date: string
  days: Array<{
    date: string
    task_count: number
    tasks: Array<{
      id: string
      title: string
      priority: string
      hour: number
    }>
  }>
  energy_pattern: any
}

class CalendarService {
  async getDaySchedule(
    userId: string,
    workspaceId: string,
    date: string
  ): Promise<DaySchedule> {
    const energyPattern = await energyService.getUserEnergyPattern(userId)

    const scheduledTasks = await calendarRepository.findScheduledTasksByDate(
      workspaceId,
      date
    )

    const habitSchedule = await habitScheduler.scheduleHabitsAndRoutines(
      userId,
      workspaceId,
      date
    )

    const blocks: DaySchedule['blocks'] = []
    for (let hour = 0; hour < 24; hour++) {
      const scheduledTask = scheduledTasks.find(t => {
        const taskHour = new Date(t.due_date).getHours()
        return taskHour === hour
      })

      blocks.push({
        hour,
        score: scheduledTask
          ? energyService.scoreTimeBlock(
              hour,
              scheduledTask.priority,
              energyPattern
            )
          : energyService.scoreTimeBlock(hour, 'medium', energyPattern),
        scheduled_task_id: scheduledTask?.id,
        scheduled_task_title: scheduledTask?.title,
        scheduled_task_priority: scheduledTask?.priority,
      })
    }

    return {
      date,
      blocks,
      energy_pattern: energyPattern,
      habits: habitSchedule.habits,
      routines: habitSchedule.routines,
      conflicts: habitSchedule.conflicts,
    }
  }

  async getWeekSchedule(
    userId: string,
    workspaceId: string,
    startDate: string
  ): Promise<WeekSchedule> {
    const energyPattern = await energyService.getUserEnergyPattern(userId)

    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 7)

    const scheduledTasks =
      await calendarRepository.findScheduledTasksByDateRange(
        workspaceId,
        startDate,
        endDate.toISOString().split('T')[0]
      )

    const days: WeekSchedule['days'] = []
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(currentDate.getDate() + i)
      const dateStr = currentDate.toISOString().split('T')[0]

      const dayTasks = scheduledTasks.filter(t => {
        const taskDate = new Date(t.due_date).toISOString().split('T')[0]
        return taskDate === dateStr
      })

      days.push({
        date: dateStr,
        task_count: dayTasks.length,
        tasks: dayTasks.map(t => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          hour: new Date(t.due_date).getHours(),
        })),
      })
    }

    return {
      start_date: startDate,
      days,
      energy_pattern: energyPattern,
    }
  }

  async updateSlot(
    userId: string,
    workspaceId: string,
    slotId: string,
    taskId?: string,
    newStartTime?: string
  ): Promise<{
    success: boolean
    task_id?: string
    new_start_time?: string
    rebalanced: boolean
    bumped?: any
  }> {
    if (!taskId && !newStartTime) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Either task_id or new_start_time is required',
        {},
        400
      )
    }

    if (taskId && newStartTime) {
      const conflictExists = await calendarRepository.checkScheduleConflict(
        workspaceId,
        taskId,
        new Date(newStartTime)
      )

      if (conflictExists) {
        throw new AppError(
          ErrorCodes.CONFLICT,
          'Conflict: another task is scheduled at this time',
          {},
          409
        )
      }

      const task = await taskRepository.findById(taskId, workspaceId)
      if (!task) {
        throw new AppError(ErrorCodes.TASK_NOT_FOUND, 'Task not found', {}, 404)
      }

      const bumped = await rebalancerService.bumpLowerPriorityTask(
        task as any,
        new Date(newStartTime),
        userId,
        workspaceId
      )

      await calendarRepository.updateTaskSchedule(
        taskId,
        new Date(newStartTime)
      )

      await rebalancerService.rebalanceSchedule({
        userId,
        workspaceId,
        triggerTaskId: taskId,
      })

      return {
        success: true,
        task_id: taskId,
        new_start_time: newStartTime,
        rebalanced: true,
        bumped,
      }
    }

    throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Invalid request', {}, 400)
  }

  async updateUserPreferences(
    userId: string,
    workspaceId: string,
    preferences: { low_energy_mode?: boolean; energy_pattern?: any }
  ): Promise<{
    success: boolean
    preferences: {
      low_energy_mode: boolean
      energy_pattern: any
    }
  }> {
    if (preferences.low_energy_mode !== undefined) {
      await calendarRepository.updateUserLowEnergyMode(
        userId,
        preferences.low_energy_mode
      )

      if (preferences.low_energy_mode) {
        await rebalancerService.rebalanceSchedule({
          userId,
          workspaceId,
        })
      }
    }

    if (preferences.energy_pattern) {
      await energyService.updateEnergyPattern(
        userId,
        preferences.energy_pattern
      )
    }

    const userPrefs = await calendarRepository.getUserPreferences(userId)

    return {
      success: true,
      preferences: {
        low_energy_mode: userPrefs?.low_energy_mode || false,
        energy_pattern: userPrefs?.energy_pattern || null,
      },
    }
  }
}

export default new CalendarService()

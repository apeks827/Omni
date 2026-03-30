import { pool } from '../../config/database.js'
import energyService from '../calendar/energy.service.js'
import { Habit, Routine } from '../../../shared/types/habits.js'

interface ScheduledHabit {
  habit_id: string
  habit_name: string
  start_time: Date
  end_time: Date
  energy_level?: string
}

interface ScheduledRoutine {
  routine_id: string
  routine_name: string
  start_time: Date
  end_time: Date
  steps: Array<{
    step_id: string
    name: string
    start_time: Date
    end_time: Date
  }>
}

interface ScheduleResult {
  habits: ScheduledHabit[]
  routines: ScheduledRoutine[]
  conflicts: Array<{
    type: 'habit' | 'routine'
    id: string
    reason: string
  }>
}

interface TimeSlot {
  start: Date
  end: Date
}

class HabitSchedulerService {
  async scheduleHabitsAndRoutines(
    userId: string,
    workspaceId: string,
    date: string
  ): Promise<ScheduleResult> {
    const startTime = Date.now()

    const habits = await this.getActiveHabits(userId, date)
    const routines = await this.getActiveRoutines(userId, date)
    const existingTasks = await this.getScheduledTasks(workspaceId, date)
    const energyPattern = await energyService.getUserEnergyPattern(userId)

    const scheduledHabits: ScheduledHabit[] = []
    const scheduledRoutines: ScheduledRoutine[] = []
    const conflicts: Array<{
      type: 'habit' | 'routine'
      id: string
      reason: string
    }> = []

    const occupiedSlots: TimeSlot[] = existingTasks.map(task => ({
      start: new Date(task.due_date),
      end: new Date(
        new Date(task.due_date).getTime() +
          (task.estimated_duration || 60) * 60000
      ),
    }))

    for (const routine of routines) {
      const result = await this.scheduleRoutine(
        routine,
        date,
        occupiedSlots,
        energyPattern
      )
      if (result.scheduled) {
        scheduledRoutines.push(result.scheduled)
        occupiedSlots.push({
          start: result.scheduled.start_time,
          end: result.scheduled.end_time,
        })
      } else if (result.conflict) {
        conflicts.push({
          type: 'routine',
          id: routine.id,
          reason: result.conflict,
        })
      }
    }

    for (const habit of habits) {
      const result = await this.scheduleHabit(
        habit,
        date,
        occupiedSlots,
        energyPattern
      )
      if (result.scheduled) {
        scheduledHabits.push(result.scheduled)
        occupiedSlots.push({
          start: result.scheduled.start_time,
          end: result.scheduled.end_time,
        })
      } else if (result.conflict) {
        conflicts.push({
          type: 'habit',
          id: habit.id,
          reason: result.conflict,
        })
      }
    }

    const elapsed = Date.now() - startTime
    if (elapsed > 2000) {
      console.warn(`Scheduling took ${elapsed}ms (target: <2000ms)`)
    }

    return {
      habits: scheduledHabits,
      routines: scheduledRoutines,
      conflicts,
    }
  }

  private async getActiveHabits(
    userId: string,
    date: string
  ): Promise<Habit[]> {
    const result = await pool.query(
      `SELECT * FROM habits 
       WHERE user_id = $1 
       ORDER BY energy_level DESC, duration_minutes ASC`,
      [userId]
    )

    return result.rows.filter(habit => this.shouldScheduleHabit(habit, date))
  }

  private shouldScheduleHabit(habit: Habit, date: string): boolean {
    const targetDate = new Date(date)
    const dayOfWeek = targetDate.getDay()

    if (habit.frequency_type === 'daily') {
      return true
    }

    if (habit.frequency_type === 'weekly' && habit.frequency_value) {
      const days = habit.frequency_value.split(',')
      const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
      return days.includes(dayNames[dayOfWeek])
    }

    if (habit.frequency_type === 'custom' && habit.frequency_value) {
      const intervalMatch = habit.frequency_value.match(/(\d+)h/)
      if (intervalMatch) {
        return true
      }
    }

    return false
  }

  private async getActiveRoutines(
    userId: string,
    date: string
  ): Promise<any[]> {
    const result = await pool.query(
      `SELECT r.*, 
        json_agg(
          json_build_object(
            'id', rs.id,
            'name', rs.name,
            'duration_minutes', rs.duration_minutes,
            'order_index', rs.order_index
          ) ORDER BY rs.order_index
        ) as steps
       FROM routines r
       LEFT JOIN routine_steps rs ON rs.routine_id = r.id
       WHERE r.user_id = $1
       GROUP BY r.id
       ORDER BY r.time_window`,
      [userId]
    )

    return result.rows
  }

  private async getScheduledTasks(workspaceId: string, date: string) {
    const result = await pool.query(
      `SELECT id, title, priority, estimated_duration, due_date
       FROM tasks
       WHERE workspace_id = $1
         AND status = 'scheduled'
         AND DATE(due_date) = $2
       ORDER BY due_date`,
      [workspaceId, date]
    )

    return result.rows
  }

  private async scheduleHabit(
    habit: Habit,
    date: string,
    occupiedSlots: TimeSlot[],
    energyPattern: any
  ): Promise<{
    scheduled?: ScheduledHabit
    conflict?: string
  }> {
    const targetDate = new Date(date)
    const preferredStart = habit.preferred_time_start
      ? this.parseTime(habit.preferred_time_start)
      : null
    const preferredEnd = habit.preferred_time_end
      ? this.parseTime(habit.preferred_time_end)
      : null

    const searchStart = preferredStart
      ? this.setTime(targetDate, preferredStart.hour, preferredStart.minute)
      : this.setTime(targetDate, 6, 0)

    const searchEnd = preferredEnd
      ? this.setTime(targetDate, preferredEnd.hour, preferredEnd.minute)
      : this.setTime(targetDate, 22, 0)

    const gaps = this.findGaps(occupiedSlots, searchStart, searchEnd)

    for (const gap of gaps) {
      const gapDuration = (gap.end.getTime() - gap.start.getTime()) / 60000

      if (gapDuration >= habit.duration_minutes) {
        const hour = gap.start.getHours()
        const score = energyService.scoreTimeBlock(
          hour,
          this.mapEnergyLevelToPriority(habit.energy_level),
          energyPattern
        )

        if (this.isEnergyMatch(habit.energy_level, score)) {
          const startTime = new Date(gap.start)
          const endTime = new Date(
            startTime.getTime() + habit.duration_minutes * 60000
          )

          return {
            scheduled: {
              habit_id: habit.id,
              habit_name: habit.name,
              start_time: startTime,
              end_time: endTime,
              energy_level: habit.energy_level,
            },
          }
        }
      }
    }

    return {
      conflict: 'No suitable time slot found within preferred window',
    }
  }

  private async scheduleRoutine(
    routine: any,
    date: string,
    occupiedSlots: TimeSlot[],
    energyPattern: any
  ): Promise<{
    scheduled?: ScheduledRoutine
    conflict?: string
  }> {
    if (!routine.steps || routine.steps.length === 0) {
      return { conflict: 'Routine has no steps' }
    }

    const totalDuration = routine.steps.reduce(
      (sum: number, step: any) => sum + step.duration_minutes,
      0
    )

    const targetDate = new Date(date)
    const timeWindow = this.getTimeWindow(routine.time_window)
    const searchStart = this.setTime(targetDate, timeWindow.startHour, 0)
    const searchEnd = this.setTime(targetDate, timeWindow.endHour, 0)

    const gaps = this.findGaps(occupiedSlots, searchStart, searchEnd)

    for (const gap of gaps) {
      const gapDuration = (gap.end.getTime() - gap.start.getTime()) / 60000

      if (gapDuration >= totalDuration) {
        const steps: Array<{
          step_id: string
          name: string
          start_time: Date
          end_time: Date
        }> = []

        let currentTime = new Date(gap.start)

        for (const step of routine.steps) {
          const stepStart = new Date(currentTime)
          const stepEnd = new Date(
            currentTime.getTime() + step.duration_minutes * 60000
          )

          steps.push({
            step_id: step.id,
            name: step.name,
            start_time: stepStart,
            end_time: stepEnd,
          })

          currentTime = stepEnd
        }

        return {
          scheduled: {
            routine_id: routine.id,
            routine_name: routine.name,
            start_time: new Date(gap.start),
            end_time: currentTime,
            steps,
          },
        }
      }
    }

    return {
      conflict: `No ${totalDuration}-minute block found in ${routine.time_window || 'any'} window`,
    }
  }

  private findGaps(
    occupiedSlots: TimeSlot[],
    searchStart: Date,
    searchEnd: Date
  ): TimeSlot[] {
    const gaps: TimeSlot[] = []
    const sorted = [...occupiedSlots]
      .filter(slot => slot.start < searchEnd && slot.end > searchStart)
      .sort((a, b) => a.start.getTime() - b.start.getTime())

    let currentTime = new Date(searchStart)

    for (const slot of sorted) {
      if (currentTime < slot.start) {
        gaps.push({
          start: new Date(currentTime),
          end: new Date(slot.start),
        })
      }
      if (slot.end > currentTime) {
        currentTime = new Date(slot.end)
      }
    }

    if (currentTime < searchEnd) {
      gaps.push({
        start: new Date(currentTime),
        end: new Date(searchEnd),
      })
    }

    return gaps
  }

  private parseTime(timeStr: string): { hour: number; minute: number } {
    const [hour, minute] = timeStr.split(':').map(Number)
    return { hour, minute }
  }

  private setTime(date: Date, hour: number, minute: number): Date {
    const result = new Date(date)
    result.setHours(hour, minute, 0, 0)
    return result
  }

  private getTimeWindow(window?: string): {
    startHour: number
    endHour: number
  } {
    switch (window) {
      case 'morning':
        return { startHour: 6, endHour: 12 }
      case 'afternoon':
        return { startHour: 12, endHour: 18 }
      case 'evening':
        return { startHour: 18, endHour: 22 }
      default:
        return { startHour: 6, endHour: 22 }
    }
  }

  private mapEnergyLevelToPriority(energyLevel?: string): string {
    switch (energyLevel) {
      case 'high':
        return 'high'
      case 'medium':
        return 'medium'
      case 'low':
        return 'low'
      default:
        return 'medium'
    }
  }

  private isEnergyMatch(
    energyLevel: string | undefined,
    score: number
  ): boolean {
    if (!energyLevel) return score >= 50

    switch (energyLevel) {
      case 'high':
        return score >= 90
      case 'medium':
        return score >= 60
      case 'low':
        return score >= 40
      default:
        return score >= 50
    }
  }

  async updateHabitCompletion(
    habitId: string,
    userId: string,
    completed: boolean
  ): Promise<void> {
    if (completed) {
      await pool.query(
        `INSERT INTO habit_completions (habit_id, skipped)
         VALUES ($1, false)`,
        [habitId]
      )

      const completions = await pool.query(
        `SELECT completed_at, skipped 
         FROM habit_completions 
         WHERE habit_id = $1 
         ORDER BY completed_at DESC 
         LIMIT 30`,
        [habitId]
      )

      let currentStreak = 0
      for (const completion of completions.rows) {
        if (completion.skipped) break
        currentStreak++
      }

      await pool.query(
        `UPDATE habits 
         SET current_streak = $1,
             best_streak = GREATEST(best_streak, $1)
         WHERE id = $2`,
        [currentStreak, habitId]
      )
    }
  }
}

export default new HabitSchedulerService()

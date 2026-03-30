import { Router, Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { pool } from '../config/database.js'
import energyService from '../services/calendar/energy.service.js'
import rebalancerService from '../services/calendar/rebalancer.js'
import habitScheduler from '../services/habits/scheduler.service.js'
import { handleError } from '../utils/errors.js'

const router = Router()

router.use(authenticateToken)

router.get('/day', async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.query
    const userId = req.userId as string
    const workspaceId = req.workspaceId as string

    if (!date || typeof date !== 'string') {
      return res
        .status(400)
        .json({ error: 'date parameter required (YYYY-MM-DD)' })
    }

    if (!userId || !workspaceId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const energyPattern = await energyService.getUserEnergyPattern(userId)

    const scheduledTasks = await pool.query(
      `SELECT t.id, t.title, t.priority, t.estimated_duration, t.due_date
       FROM tasks t
       WHERE t.workspace_id = $1 
         AND t.status = 'scheduled'
         AND DATE(t.due_date) = $2
       ORDER BY t.due_date`,
      [workspaceId, date]
    )

    const habitSchedule = await habitScheduler.scheduleHabitsAndRoutines(
      userId,
      workspaceId,
      date
    )

    const blocks: Array<{
      hour: number
      score: number
      scheduled_task_id?: string
      scheduled_task_title?: string
      scheduled_task_priority?: string
    }> = []
    for (let hour = 0; hour < 24; hour++) {
      const scheduledTask = scheduledTasks.rows.find(t => {
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

    res.json({
      date,
      blocks,
      energy_pattern: energyPattern,
      habits: habitSchedule.habits,
      routines: habitSchedule.routines,
      conflicts: habitSchedule.conflicts,
    })
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to fetch day calendar')
    res.status(status).json(body)
  }
})

router.get('/week', async (req: AuthRequest, res: Response) => {
  try {
    const { start_date } = req.query
    const userId = req.userId as string
    const workspaceId = req.workspaceId as string

    if (!start_date || typeof start_date !== 'string') {
      return res
        .status(400)
        .json({ error: 'start_date parameter required (YYYY-MM-DD)' })
    }

    const energyPattern = await energyService.getUserEnergyPattern(userId)

    const endDate = new Date(start_date)
    endDate.setDate(endDate.getDate() + 7)

    const scheduledTasks = await pool.query(
      `SELECT t.id, t.title, t.priority, t.estimated_duration, t.due_date
       FROM tasks t
       WHERE t.workspace_id = $1 
         AND t.status = 'scheduled'
         AND t.due_date >= $2
         AND t.due_date < $3
       ORDER BY t.due_date`,
      [workspaceId, start_date, endDate.toISOString().split('T')[0]]
    )

    const days: Array<{
      date: string
      task_count: number
      tasks: Array<{
        id: string
        title: string
        priority: string
        hour: number
      }>
    }> = []
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(start_date)
      currentDate.setDate(currentDate.getDate() + i)
      const dateStr = currentDate.toISOString().split('T')[0]

      const dayTasks = scheduledTasks.rows.filter(t => {
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

    res.json({ start_date, days, energy_pattern: energyPattern })
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to fetch week calendar')
    res.status(status).json(body)
  }
})

router.patch('/slots/:slotId', async (req: AuthRequest, res: Response) => {
  try {
    const { slotId } = req.params
    const { task_id, new_start_time } = req.body
    const userId = req.userId as string
    const workspaceId = req.workspaceId as string

    if (!task_id && !new_start_time) {
      return res.status(400).json({
        error: 'Either task_id or new_start_time is required',
      })
    }

    if (task_id && new_start_time) {
      const conflictCheck = await pool.query(
        `SELECT id FROM tasks
         WHERE workspace_id = $1
           AND id != $2
           AND status = 'scheduled'
           AND due_date = $3`,
        [workspaceId, task_id, new Date(new_start_time)]
      )

      if (conflictCheck.rows.length > 0) {
        return res.status(409).json({
          error: 'Conflict: another task is scheduled at this time',
        })
      }

      const task = await pool.query(
        'SELECT * FROM tasks WHERE id = $1 AND workspace_id = $2',
        [task_id, workspaceId]
      )

      if (task.rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' })
      }

      const user = await pool.query(
        'SELECT energy_pattern FROM users WHERE id = $1',
        [userId]
      )
      const energyPattern = user.rows[0]?.energy_pattern

      const bumped = await rebalancerService.bumpLowerPriorityTask(
        task.rows[0],
        new Date(new_start_time),
        userId,
        workspaceId
      )

      await pool.query(
        'UPDATE tasks SET due_date = $1, updated_at = NOW() WHERE id = $2',
        [new Date(new_start_time), task_id]
      )

      await rebalancerService.rebalanceSchedule({
        userId,
        workspaceId,
        triggerTaskId: task_id,
      })

      return res.json({
        success: true,
        task_id,
        new_start_time,
        rebalanced: true,
        bumped,
      })
    }

    res.status(400).json({ error: 'Invalid request' })
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to update slot')
    res.status(status).json(body)
  }
})

router.patch(
  '/users/me/preferences',
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId as string
      const { low_energy_mode, energy_pattern } = req.body

      if (low_energy_mode !== undefined) {
        await pool.query(
          'UPDATE users SET low_energy_mode = $1, updated_at = NOW() WHERE id = $2',
          [low_energy_mode, userId]
        )

        if (low_energy_mode) {
          const workspaceId = req.workspaceId as string
          await rebalancerService.rebalanceSchedule({
            userId,
            workspaceId,
          })
        }
      }

      if (energy_pattern) {
        await energyService.updateEnergyPattern(userId, energy_pattern)
      }

      const updatedUser = await pool.query(
        'SELECT id, email, name, workspace_id, low_energy_mode, energy_pattern FROM users WHERE id = $1',
        [userId]
      )

      res.json({
        success: true,
        preferences: {
          low_energy_mode: updatedUser.rows[0].low_energy_mode,
          energy_pattern: updatedUser.rows[0].energy_pattern,
        },
      })
    } catch (error) {
      const { status, body } = handleError(
        error,
        'Failed to update preferences'
      )
      res.status(status).json(body)
    }
  }
)

export default router

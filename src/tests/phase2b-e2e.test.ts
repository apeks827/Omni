import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import authRouter from '../routes/auth.js'
import tasksRouter from '../routes/tasks.js'
import scheduleRouter from '../routes/schedule.js'
import notificationsRouter from '../routes/notifications.js'
import { pool } from '../config/database.js'
import { cacheService } from '../services/cache/CacheService.js'
import { clearRateLimitStore } from '../middleware/rateLimit.js'

const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use('/api/auth', authRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/schedule', scheduleRouter)
app.use('/api/notifications', notificationsRouter)

const requestClient = request(app)

function getTaskId(res: any): string {
  return res.body.task?.id ?? res.body.id
}

function getTask(res: any): any {
  return res.body.task ?? res.body
}

describe('Phase 2B: Smart Scheduling E2E Tests', () => {
  let authToken: string
  let userId: string
  let workspaceId: string
  let taskId1: string
  let taskId2: string

  beforeEach(() => {
    cacheService.clear()
    clearRateLimitStore()
  })

  beforeAll(async () => {
    const registerRes = await requestClient.post('/api/auth/register').send({
      email: `scheduling-phase2b-${Date.now()}@example.com`,
      password: 'TestPass123!',
      name: 'Scheduling Tester',
    })

    expect(registerRes.status).toBe(201)
    authToken = registerRes.body.token
    userId = registerRes.body.user.id
    workspaceId = registerRes.body.user.workspace_id
  })

  afterAll(async () => {
    if (userId) {
      await pool.query('DELETE FROM users WHERE id = $1', [userId])
    }
  })

  describe('Critical Path 1: Task Input → NLP Parse → Schedule → Display', () => {
    describe('NLP Task Input', () => {
      it('should parse natural language input for task creation', async () => {
        const res = await requestClient
          .post('/api/tasks/extract')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            input: 'Buy groceries tomorrow',
          })

        expect(res.status).toBe(200)
        expect(res.body.due_date).toBeDefined()
        expect(res.body.title).toBeDefined()
      })

      it('should extract priority from natural language', async () => {
        const res = await requestClient
          .post('/api/tasks/extract')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            input: 'URGENT: Call client today',
          })

        expect(res.status).toBe(200)
        expect(res.body.priority).toBe('high')
      })

      it('should extract context tags from input', async () => {
        const res = await requestClient
          .post('/api/tasks/extract')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            input: 'Write report for work meeting',
          })

        expect(res.status).toBe(200)
        expect(res.body.tags).toBeDefined()
      })
    })

    describe('Schedule Display', () => {
      it('should display task in calendar view after scheduling', async () => {
        const taskRes = await requestClient
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Team meeting next Monday at 2pm',
            scheduled_date: new Date().toISOString(),
          })

        expect(taskRes.status).toBe(201)
        taskId1 = getTaskId(taskRes)

        const calendarRes = await requestClient
          .get('/api/schedule')
          .set('Authorization', `Bearer ${authToken}`)

        expect(calendarRes.status).toBe(200)
      })
    })
  })

  describe('Critical Path 2: Drag Task → Reschedule → Calendar Update → Notification', () => {
    beforeAll(async () => {
      const taskRes = await requestClient
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Draggable Task 1',
          scheduled_date: new Date().toISOString(),
        })
      expect(taskRes.status).toBe(201)
      taskId1 = getTaskId(taskRes)
    })

    describe('Drag-to-Reschedule', () => {
      it('should reschedule task via drag operation', async () => {
        const originalDate = new Date()
        const newDate = new Date(originalDate.getTime() + 86400000)

        const res = await requestClient
          .patch(`/api/tasks/${taskId1}/reschedule`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            new_date: newDate.toISOString(),
            method: 'drag',
          })

        expect(res.status).toBe(200)
        expect(getTask(res).due_date).toBe(newDate.toISOString())
        expect(getTask(res).reschedule_history).toBeDefined()
      })

      it('should validate reschedule target is not in past', async () => {
        const pastDate = new Date('2020-01-01')

        const res = await requestClient
          .patch(`/api/tasks/${taskId1}/reschedule`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            new_date: pastDate.toISOString(),
            method: 'drag',
          })

        expect(res.status).toBe(400)
        expect(res.body.error).toContain('past')
      })
    })

    describe('Calendar Update', () => {
      it('should reflect rescheduled task in calendar immediately', async () => {
        const taskRes = await requestClient
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Calendar Update Test Task',
            scheduled_date: new Date().toISOString(),
          })

        const taskId = getTaskId(taskRes)
        const newDate = new Date(Date.now() + 172800000)

        await requestClient
          .patch(`/api/tasks/${taskId}/reschedule`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ new_date: newDate.toISOString() })

        const calendarRes = await requestClient
          .get('/api/schedule')
          .set('Authorization', `Bearer ${authToken}`)

        expect(calendarRes.status).toBe(200)
        expect(calendarRes.body.tasks).toBeDefined()
      })
    })

    describe('Notifications', () => {
      it('should send notification after reschedule', async () => {
        const taskRes = await requestClient
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Notification Test Task',
            scheduled_date: new Date().toISOString(),
          })

        const taskId = getTaskId(taskRes)
        const newDate = new Date(Date.now() + 86400000)

        await requestClient
          .patch(`/api/tasks/${taskId}/reschedule`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ new_date: newDate.toISOString() })

        const notifRes = await requestClient
          .get('/api/notifications')
          .set('Authorization', `Bearer ${authToken}`)

        expect(notifRes.status).toBe(200)
        const rescheduleNotif = notifRes.body.notifications?.find(
          (n: any) => n.type === 'task_rescheduled' && n.task_id === taskId
        )
        expect(rescheduleNotif).toBeDefined()
      })
    })
  })

  describe('Critical Path 3: Why This Time → Tooltip → Manual Override → Persistence', () => {
    describe('Why This Time Tooltip', () => {
      it('should return explanation for scheduled time', async () => {
        const taskRes = await requestClient
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Explained Task',
            scheduled_date: new Date().toISOString(),
          })

        const taskId = getTaskId(taskRes)

        const explainRes = await requestClient
          .get(`/api/schedule/explain/${taskId}`)
          .set('Authorization', `Bearer ${authToken}`)

        expect(explainRes.status).toBe(200)
        expect(explainRes.body.reasons).toBeDefined()
        expect(explainRes.body.reasons.length).toBeGreaterThan(0)
        expect(explainRes.body.reasons[0].type).toBeDefined()
      })

      it('should explain energy level reason', async () => {
        const taskRes = await requestClient
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'High Focus Task',
            type: 'deep_work',
            scheduled_date: new Date().toISOString(),
          })

        const taskId = getTaskId(taskRes)

        const explainRes = await requestClient
          .get(`/api/schedule/explain/${taskId}`)
          .set('Authorization', `Bearer ${authToken}`)

        expect(explainRes.status).toBe(200)
        const hasEnergyReason = explainRes.body.reasons?.some(
          (r: any) => r.type === 'energy_level'
        )
        expect(hasEnergyReason).toBe(true)
      })

      it('should explain calendar availability reason', async () => {
        const taskRes = await requestClient
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Available Slot Task',
            scheduled_date: new Date().toISOString(),
          })

        const taskId = getTaskId(taskRes)

        const explainRes = await requestClient
          .get(`/api/schedule/explain/${taskId}`)
          .set('Authorization', `Bearer ${authToken}`)

        expect(explainRes.status).toBe(200)
        const hasAvailabilityReason = explainRes.body.reasons?.some(
          (r: any) => r.type === 'calendar_availability'
        )
        expect(hasAvailabilityReason).toBe(true)
      })
    })

    describe('Manual Override', () => {
      it('should allow manual override with explanation', async () => {
        const taskRes = await requestClient
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Override Test Task',
            scheduled_date: new Date().toISOString(),
          })

        const taskId = getTaskId(taskRes)
        const newDate = new Date(Date.now() + 172800000)

        const overrideRes = await requestClient
          .patch(`/api/tasks/${taskId}/reschedule`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            new_date: newDate.toISOString(),
            override: true,
            override_reason: 'User preference',
          })

        expect(overrideRes.status).toBe(200)
        expect(getTask(overrideRes).override_history).toBeDefined()
      })

      it('should track override history', async () => {
        const taskRes = await requestClient
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'History Test Task',
            scheduled_date: new Date().toISOString(),
          })

        const taskId = getTaskId(taskRes)
        const newDate = new Date(Date.now() + 172800000)

        await requestClient
          .patch(`/api/tasks/${taskId}/reschedule`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            new_date: newDate.toISOString(),
            override: true,
            override_reason: 'First override',
          })

        const historyRes = await requestClient
          .get(`/api/tasks/${taskId}/override-history`)
          .set('Authorization', `Bearer ${authToken}`)

        expect(historyRes.status).toBe(200)
        expect(historyRes.body.history?.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Critical Path 4: Conflict Detection → Suggestion → User Acceptance → Schedule Update', () => {
    describe('Conflict Detection', () => {
      it('should detect overlapping tasks', async () => {
        const date = new Date()
        date.setHours(10, 0, 0, 0)

        const task1Res = await requestClient
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Task 1',
            scheduled_date: date.toISOString(),
            duration_minutes: 60,
          })

        const task2Res = await requestClient
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Task 2 - Overlapping',
            scheduled_date: date.toISOString(),
            duration_minutes: 60,
          })

        expect(task2Res.body.conflicts).toBeDefined()
        expect(task2Res.body.conflicts?.length).toBeGreaterThan(0)
      })

      it('should return conflict details', async () => {
        const date = new Date()
        date.setHours(14, 0, 0, 0)

        const task1Res = await requestClient
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Task 1 - Conflict',
            scheduled_date: date.toISOString(),
            duration_minutes: 120,
          })

        const task2Res = await requestClient
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Task 2 - Conflict',
            scheduled_date: date.toISOString(),
            duration_minutes: 120,
          })

        expect(task2Res.body.conflicts?.[0]?.conflicting_task_id).toBe(
          getTaskId(task1Res)
        )
        expect(task2Res.body.conflicts?.[0]?.overlap_minutes).toBe(120)
      })
    })

    describe('Conflict Suggestions', () => {
      it('should suggest alternative slots for conflict', async () => {
        const date = new Date()
        date.setHours(10, 0, 0, 0)

        await requestClient
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Existing Task',
            scheduled_date: date.toISOString(),
            duration_minutes: 120,
          })

        const conflictRes = await requestClient
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Conflicting Task',
            scheduled_date: date.toISOString(),
            duration_minutes: 60,
          })

        expect(conflictRes.body.suggestions).toBeDefined()
        expect(conflictRes.body.suggestions?.length).toBeGreaterThan(0)
      })

      it('should provide suggested slot time', async () => {
        const date = new Date()
        date.setHours(10, 0, 0, 0)

        await requestClient
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Existing Task',
            scheduled_date: date.toISOString(),
            duration_minutes: 120,
          })

        const conflictRes = await requestClient
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Conflicting Task',
            scheduled_date: date.toISOString(),
            duration_minutes: 60,
          })

        expect(conflictRes.body.suggestions?.[0]?.scheduled_date).toBeDefined()
      })
    })

    describe('User Acceptance', () => {
      it('should accept conflict suggestion and update schedule', async () => {
        const date = new Date()
        date.setHours(10, 0, 0, 0)

        await requestClient
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Existing Task',
            scheduled_date: date.toISOString(),
            duration_minutes: 120,
          })

        const conflictRes = await requestClient
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Conflicting Task',
            scheduled_date: date.toISOString(),
            duration_minutes: 60,
          })

        const suggestion = conflictRes.body.suggestions?.[0]
        expect(suggestion).toBeDefined()

        const acceptRes = await requestClient
          .patch(`/api/tasks/${getTaskId(conflictRes)}/reschedule`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            new_date: suggestion.scheduled_date,
            accepted_suggestion: true,
          })

        expect(acceptRes.status).toBe(200)
      })
    })
  })

  describe('Edge Cases', () => {
    describe('Empty Calendar State', () => {
      it('should handle empty calendar gracefully', async () => {
        const res = await requestClient
          .get('/api/schedule')
          .set('Authorization', `Bearer ${authToken}`)

        expect(res.status).toBe(200)
        expect(res.body.tasks).toBeDefined()
      })
    })

    describe('Overlapping Task Drag', () => {
      it('should warn when dragging creates overlap', async () => {
        const date = new Date()
        date.setHours(10, 0, 0, 0)

        const task1Res = await requestClient
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Task 1',
            scheduled_date: date.toISOString(),
            duration_minutes: 120,
          })

        const taskId = getTaskId(task1Res)

        date.setHours(11, 0, 0, 0)
        const res = await requestClient
          .patch(`/api/tasks/${taskId}/reschedule`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            new_date: date.toISOString(),
            method: 'drag',
          })

        expect([200, 409]).toContain(res.status)
        if (res.status === 200) {
          expect(res.body.warnings).toBeDefined()
        }
      })
    })

    describe('NLP Clarification Flow', () => {
      it('should return clarification questions for ambiguous input', async () => {
        const res = await requestClient
          .post('/api/tasks/extract')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            input: 'Call them tomorrow about the project',
          })

        expect(res.status).toBe(200)
        if (res.body.requires_clarification) {
          expect(res.body.clarification_questions).toBeDefined()
        }
      })
    })

    describe('Timezone Handling', () => {
      it('should handle timezone-aware scheduling', async () => {
        const taskRes = await requestClient
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Timezone Task',
            scheduled_date: new Date().toISOString(),
            timezone: 'America/New_York',
          })

        expect(taskRes.status).toBe(201)
        expect(getTask(taskRes).timezone).toBeDefined()
      })

      it('should convert between timezones correctly', async () => {
        const res = await requestClient
          .get('/api/schedule')
          .set('Authorization', `Bearer ${authToken}`)
          .query({
            start: '2026-04-15',
            end: '2026-04-15',
            timezone: 'Asia/Tokyo',
          })

        expect(res.status).toBe(200)
        expect(res.body.timezone).toBe('Asia/Tokyo')
      })
    })

    describe('Offline/Resilience', () => {
      it('should handle offline reschedule gracefully', async () => {
        const taskRes = await requestClient
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: 'Offline Test Task',
            scheduled_date: new Date().toISOString(),
          })

        const taskId = getTaskId(taskRes)
        const newDate = new Date(Date.now() + 86400000)

        const res = await requestClient
          .patch(`/api/tasks/${taskId}/reschedule`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            new_date: newDate.toISOString(),
            offline: true,
            local_timestamp: Date.now(),
          })

        expect(res.status).toBe(200)
        expect(res.body.synced).toBeDefined()
      })
    })
  })
})

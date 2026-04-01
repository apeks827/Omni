import { query } from '../../config/database.js'
import { schedulingOptimizer } from '../ml/scheduling-optimizer.service.js'
import { taskClassifier, CognitiveLoad } from '../ml/task-classifier.service.js'

interface Task {
  id: string
  title: string
  description?: string
  type: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  due_date?: Date
  estimated_duration?: number
}

interface ScheduleRequest {
  taskId: string
  userId: string
  workspaceId: string
}

interface TimeSlot {
  start_time: Date
  end_time: Date
  confidence: number
  energy_score?: number
}

interface ScheduleResponse {
  task_id: string
  suggested_slot: TimeSlot
  reasoning: string
  alternative_slots: TimeSlot[]
}

const PRIORITY_WEIGHTS = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

const DEFAULT_DURATION_MINUTES = 60
const DEFAULT_WORK_START_HOUR = 9
const DEFAULT_WORK_END_HOUR = 17

export async function scheduleTask(
  request: ScheduleRequest
): Promise<ScheduleResponse> {
  const { taskId, userId, workspaceId } = request

  const taskResult = await query(
    'SELECT id, title, description, type, priority, due_date, estimated_duration FROM tasks WHERE id = $1 AND workspace_id = $2',
    [taskId, workspaceId]
  )

  if (taskResult.rows.length === 0) {
    throw new Error('Task not found')
  }

  const task: Task = taskResult.rows[0]

  const taskForClassification = {
    ...task,
    status: 'pending' as const,
    creator_id: userId,
    workspace_id: workspaceId,
    created_at: new Date(),
    updated_at: new Date(),
  }

  const classification = await taskClassifier.classifyTask(
    taskForClassification as any
  )

  const userResult = await query(
    'SELECT timezone, preferences FROM users WHERE id = $1 AND workspace_id = $2',
    [userId, workspaceId]
  )

  const userPreferences = userResult.rows[0]?.preferences || {}
  const workStartHour =
    userPreferences.work_start_hour || DEFAULT_WORK_START_HOUR
  const workEndHour = userPreferences.work_end_hour || DEFAULT_WORK_END_HOUR

  const existingSlotsResult = await query(
    'SELECT start_time, end_time FROM schedule_slots WHERE user_id = $1 AND status IN ($2, $3) ORDER BY start_time',
    [userId, 'scheduled', 'active']
  )

  const occupiedSlots = existingSlotsResult.rows.map(row => ({
    start: new Date(row.start_time),
    end: new Date(row.end_time),
  }))

  const priorityScore = PRIORITY_WEIGHTS[task.priority]
  const durationMinutes = task.estimated_duration || DEFAULT_DURATION_MINUTES

  const suggestedSlot = await findOptimalSlot(
    task,
    occupiedSlots,
    workStartHour,
    workEndHour,
    durationMinutes,
    priorityScore,
    userId,
    classification.load
  )

  const reasoning = buildReasoning(
    task,
    priorityScore,
    suggestedSlot,
    classification
  )

  const alternativeSlots = await findAlternativeSlots(
    occupiedSlots,
    workStartHour,
    workEndHour,
    durationMinutes,
    suggestedSlot,
    userId,
    classification.load
  )

  return {
    task_id: taskId,
    suggested_slot: suggestedSlot,
    reasoning,
    alternative_slots: alternativeSlots,
  }
}

async function findOptimalSlot(
  task: Task,
  occupiedSlots: Array<{ start: Date; end: Date }>,
  workStartHour: number,
  workEndHour: number,
  durationMinutes: number,
  priorityScore: number,
  userId: string,
  cognitiveLoad: CognitiveLoad
): Promise<TimeSlot> {
  const now = new Date()
  let searchDate = new Date(now)

  if (task.due_date) {
    const dueDate = new Date(task.due_date)
    if (dueDate < now) {
      searchDate = now
    }
  }

  let bestSlot: TimeSlot | null = null
  let bestScore = -1

  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const candidateDate = new Date(searchDate)
    candidateDate.setDate(candidateDate.getDate() + dayOffset)

    const dayStart = new Date(candidateDate)
    dayStart.setHours(workStartHour, 0, 0, 0)

    const dayEnd = new Date(candidateDate)
    dayEnd.setHours(workEndHour, 0, 0, 0)

    if (dayStart < now) {
      dayStart.setTime(now.getTime())
    }

    const freeSlots = findFreeSlots(
      occupiedSlots,
      dayStart,
      dayEnd,
      durationMinutes
    )

    for (const slot of freeSlots) {
      const hour = slot.start.getHours()
      const energyScore = await schedulingOptimizer.calculateSlotScore(
        userId,
        hour,
        cognitiveLoad
      )

      const priorityComponent = priorityScore * 0.4
      const timeComponent = ((14 - dayOffset) / 14) * 0.3
      const energyComponent = energyScore * 0.3

      const combinedScore = priorityComponent + timeComponent + energyComponent

      if (combinedScore > bestScore) {
        bestScore = combinedScore
        bestSlot = {
          start_time: slot.start,
          end_time: slot.end,
          confidence: calculateConfidence(
            priorityScore,
            dayOffset,
            task.due_date
          ),
          energy_score: energyScore,
        }
      }
    }

    if (bestSlot && dayOffset === 0) {
      break
    }
  }

  if (bestSlot) {
    return bestSlot
  }

  const fallbackStart = new Date(now)
  fallbackStart.setHours(workStartHour, 0, 0, 0)
  if (fallbackStart < now) {
    fallbackStart.setDate(fallbackStart.getDate() + 1)
  }

  const fallbackEnd = new Date(fallbackStart)
  fallbackEnd.setMinutes(fallbackEnd.getMinutes() + durationMinutes)

  return {
    start_time: fallbackStart,
    end_time: fallbackEnd,
    confidence: 0.5,
  }
}

function findFreeSlots(
  occupiedSlots: Array<{ start: Date; end: Date }>,
  dayStart: Date,
  dayEnd: Date,
  durationMinutes: number
): Array<{ start: Date; end: Date }> {
  const freeSlots: Array<{ start: Date; end: Date }> = []
  let currentStart = new Date(dayStart)

  const sortedSlots = [...occupiedSlots]
    .filter(slot => slot.start < dayEnd && slot.end > dayStart)
    .sort((a, b) => a.start.getTime() - b.start.getTime())

  for (const occupied of sortedSlots) {
    if (currentStart < occupied.start) {
      const gapMinutes =
        (occupied.start.getTime() - currentStart.getTime()) / 60000
      if (gapMinutes >= durationMinutes) {
        const slotEnd = new Date(currentStart)
        slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes)
        freeSlots.push({ start: new Date(currentStart), end: slotEnd })
      }
    }
    if (occupied.end > currentStart) {
      currentStart = new Date(occupied.end)
    }
  }

  if (currentStart < dayEnd) {
    const remainingMinutes = (dayEnd.getTime() - currentStart.getTime()) / 60000
    if (remainingMinutes >= durationMinutes) {
      const slotEnd = new Date(currentStart)
      slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes)
      freeSlots.push({ start: new Date(currentStart), end: slotEnd })
    }
  }

  return freeSlots
}

function calculateConfidence(
  priorityScore: number,
  dayOffset: number,
  dueDate?: Date
): number {
  let confidence = 0.7

  if (priorityScore >= 3) {
    confidence += 0.1
  }

  if (dayOffset === 0) {
    confidence += 0.15
  } else if (dayOffset <= 2) {
    confidence += 0.05
  }

  if (dueDate) {
    confidence += 0.05
  }

  return Math.min(confidence, 1.0)
}

function buildReasoning(
  task: Task,
  priorityScore: number,
  slot: TimeSlot,
  classification: { load: CognitiveLoad; confidence: number }
): string {
  const reasons: string[] = []

  reasons.push(`Priority: ${task.priority} (score: ${priorityScore})`)

  reasons.push(`Cognitive load: ${classification.load}`)

  if (slot.energy_score !== undefined) {
    reasons.push(`Energy alignment: ${(slot.energy_score * 100).toFixed(0)}%`)
  }

  if (task.due_date) {
    reasons.push(`Due date: ${task.due_date.toISOString().split('T')[0]}`)
  }

  const slotDate = slot.start_time.toISOString().split('T')[0]
  const slotTime = slot.start_time.toTimeString().slice(0, 5)
  reasons.push(`Suggested: ${slotDate} at ${slotTime}`)

  reasons.push(`Confidence: ${(slot.confidence * 100).toFixed(0)}%`)

  return reasons.join(' | ')
}

async function findAlternativeSlots(
  occupiedSlots: Array<{ start: Date; end: Date }>,
  workStartHour: number,
  workEndHour: number,
  durationMinutes: number,
  primarySlot: TimeSlot,
  userId: string,
  cognitiveLoad: CognitiveLoad
): Promise<TimeSlot[]> {
  const alternatives: TimeSlot[] = []
  const now = new Date()

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const candidateDate = new Date(now)
    candidateDate.setDate(candidateDate.getDate() + dayOffset)

    const dayStart = new Date(candidateDate)
    dayStart.setHours(workStartHour, 0, 0, 0)

    const dayEnd = new Date(candidateDate)
    dayEnd.setHours(workEndHour, 0, 0, 0)

    if (dayStart < now) {
      dayStart.setTime(now.getTime())
    }

    const freeSlots = findFreeSlots(
      occupiedSlots,
      dayStart,
      dayEnd,
      durationMinutes
    )

    for (const slot of freeSlots) {
      if (
        slot.start.getTime() !== primarySlot.start_time.getTime() &&
        alternatives.length < 3
      ) {
        const hour = slot.start.getHours()
        const energyScore = await schedulingOptimizer.calculateSlotScore(
          userId,
          hour,
          cognitiveLoad
        )

        alternatives.push({
          start_time: slot.start,
          end_time: slot.end,
          confidence: 0.6,
          energy_score: energyScore,
        })
      }
    }

    if (alternatives.length >= 3) break
  }

  return alternatives
}

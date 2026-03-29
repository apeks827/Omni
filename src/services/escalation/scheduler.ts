import { processTriageEscalations } from './triage.service.js'
import { query } from '../../config/database.js'

let escalationInterval: ReturnType<typeof setInterval> | null = null
const DEFAULT_INTERVAL_MS = 15 * 60 * 1000

export async function startEscalationScheduler(
  intervalMs: number = DEFAULT_INTERVAL_MS
): Promise<void> {
  if (escalationInterval) {
    console.log('Escalation scheduler already running')
    return
  }

  console.log(
    `Starting escalation scheduler with ${intervalMs / 1000 / 60}min interval`
  )

  await runEscalationCheck()

  escalationInterval = setInterval(async () => {
    try {
      await runEscalationCheck()
    } catch (error) {
      console.error('Escalation check failed:', error)
    }
  }, intervalMs)
}

export function stopEscalationScheduler(): void {
  if (escalationInterval) {
    clearInterval(escalationInterval)
    escalationInterval = null
    console.log('Escalation scheduler stopped')
  }
}

async function runEscalationCheck(): Promise<void> {
  const startTime = Date.now()
  console.log(`[${new Date().toISOString()}] Running escalation check...`)

  try {
    const escalatedCount = await processTriageEscalations()

    const duration = Date.now() - startTime
    console.log(
      `[${new Date().toISOString()}] Escalation check completed: ${escalatedCount} tasks escalated in ${duration}ms`
    )

    await logAuditRecord('escalation_check', escalatedCount, duration)
  } catch (error) {
    console.error('Escalation check failed:', error)
    throw error
  }
}

async function logAuditRecord(
  checkType: string,
  tasksAffected: number,
  durationMs: number
): Promise<void> {
  try {
    await query(
      `INSERT INTO triage_audit_log (check_type, tasks_affected, duration_ms, executed_at)
       VALUES ($1, $2, $3, $4)`,
      [checkType, tasksAffected, durationMs, new Date().toISOString()]
    )
  } catch (error) {
    console.error('Failed to log audit record:', error)
  }
}

export async function triggerManualEscalationCheck(): Promise<{
  escalatedCount: number
  duration: number
}> {
  const startTime = Date.now()
  const escalatedCount = await processTriageEscalations()
  const duration = Date.now() - startTime

  await logAuditRecord('manual_escalation_check', escalatedCount, duration)

  return { escalatedCount, duration }
}

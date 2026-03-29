import { query } from '../../config/database.js'

export interface TriageConfig {
  checkIntervalMs: number
  handoffThresholdMs: number
}

export interface StalledTask {
  id: string
  identifier: string
  title: string
  status: string
  priority: string
  assigneeAgentId: string | null
  updatedAt: string
  lastEscalatedAt: string | null
}

export interface EscalationRecord {
  taskId: string
  escalatedAt: string
  escalationType: string
  targetAgentId: string | null
}

const DEFAULT_CONFIG: TriageConfig = {
  checkIntervalMs: 15 * 60 * 1000,
  handoffThresholdMs: 30 * 60 * 1000,
}

export async function findStalledTasks(
  config: Partial<TriageConfig> = {}
): Promise<StalledTask[]> {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const now = new Date()
  const cutoff = new Date(now.getTime() - cfg.handoffThresholdMs)

  const result = await query(
    `SELECT 
      i.id, 
      i.identifier, 
      i.title, 
      i.status, 
      i.priority,
      i.assignee_agent_id as "assigneeAgentId", 
      i.updated_at as "updatedAt",
      e.escalated_at as "lastEscalatedAt"
     FROM issues i
     LEFT JOIN escalation_log e ON e.task_id = i.id AND e.escalated_at = (
       SELECT MAX(escalated_at) FROM escalation_log WHERE task_id = i.id
     )
     WHERE i.status IN ('todo', 'in_progress', 'blocked')
       AND i.updated_at < $1
       AND i.assignee_agent_id IS NOT NULL
       AND (e.escalated_at IS NULL OR e.escalated_at < $1)`,
    [cutoff.toISOString()]
  )

  return result.rows as StalledTask[]
}

export async function logEscalation(
  taskId: string,
  escalationType: string,
  targetAgentId: string | null,
  reason: string
): Promise<void> {
  await query(
    `INSERT INTO escalation_log (task_id, escalated_at, escalation_type, target_agent_id, reason)
     VALUES ($1, $2, $3, $4, $5)`,
    [taskId, new Date().toISOString(), escalationType, targetAgentId, reason]
  )
}

export async function createEscalationComment(
  taskId: string,
  assigneeAgentId: string,
  reason: string
): Promise<void> {
  const agentResult = await query('SELECT name FROM agents WHERE id = $1', [
    assigneeAgentId,
  ])

  const agentName = (agentResult.rows[0] as { name?: string })?.name || 'Unknown Agent'

  await query(
    'INSERT INTO issue_comments (issue_id, body, created_at, author_agent_id) VALUES ($1, $2, $3, $4)',
    [taskId, `@${agentName} ${reason}`, new Date().toISOString(), null]
  )
}

export async function updateTaskPriority(
  taskId: string,
  newPriority: string
): Promise<void> {
  await query(
    'UPDATE issues SET priority = $1, updated_at = $2 WHERE id = $3',
    [newPriority, new Date().toISOString(), taskId]
  )
}

export async function processTriageEscalations(
  config: Partial<TriageConfig> = {}
): Promise<number> {
  const stalledTasks = await findStalledTasks(config)
  let escalationCount = 0

  for (const task of stalledTasks) {
    if (!task.assigneeAgentId) continue

    const reason = 'Task stalled for >30min. Please provide status update or reassign.'

    await createEscalationComment(task.id, task.assigneeAgentId, reason)
    await logEscalation(
      task.id,
      'handoff_latency',
      task.assigneeAgentId,
      reason
    )

    if (task.priority === 'medium' || task.priority === 'low') {
      await updateTaskPriority(task.id, 'high')
    }

    escalationCount++
  }

  return escalationCount
}

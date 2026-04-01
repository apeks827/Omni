import { query } from '../../config/database.js'

interface Agent {
  id: string
  name: string
  role: string
  capabilities: string[]
  workspace_id: string
}

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignee_id?: string
  workspace_id: string
  created_at: Date
}

interface QueueConfig {
  workspace_id: string
  agent_id?: string
  role?: string
  capabilities?: string[]
  limit?: number
}

export class QueueService {
  async getNextTask(config: QueueConfig): Promise<Task | null> {
    const { workspace_id, agent_id, role, capabilities, limit = 1 } = config

    let queryText = `
      SELECT * FROM tasks 
      WHERE workspace_id = $1 
      AND assignee_id IS NULL 
      AND status IN ('todo', 'pending')
    `
    const params: any[] = [workspace_id]
    let paramIndex = 2

    if (role) {
      queryText += ` AND (metadata->>'required_role' = $${paramIndex} OR metadata->>'required_role' IS NULL)`
      params.push(role)
      paramIndex++
    }

    queryText += ` ORDER BY 
      CASE priority 
        WHEN 'critical' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 
      END,
      created_at ASC
      LIMIT $${paramIndex}
    `
    params.push(limit)

    const result = await query(queryText, params)
    return result.rows[0] || null
  }

  async claimTask(
    taskId: string,
    agentId: string,
    workspaceId: string
  ): Promise<Task> {
    const result = await query(
      `UPDATE tasks 
       SET assignee_id = $1, status = 'in_progress', updated_at = NOW() 
       WHERE id = $2 AND workspace_id = $3 AND assignee_id IS NULL 
       RETURNING *`,
      [agentId, taskId, workspaceId]
    )

    if (result.rows.length === 0) {
      throw new Error('Task not available for claiming')
    }

    return result.rows[0]
  }

  async autoAssignNext(
    completedTaskId: string,
    agentId: string,
    workspaceId: string
  ): Promise<Task | null> {
    const agentResult = await query(
      'SELECT id, name, role, capabilities FROM users WHERE id = $1 AND workspace_id = $2',
      [agentId, workspaceId]
    )

    if (agentResult.rows.length === 0) {
      return null
    }

    const agent = agentResult.rows[0]

    const nextTask = await this.getNextTask({
      workspace_id: workspaceId,
      agent_id: agentId,
      role: agent.role,
      capabilities: agent.capabilities,
    })

    if (!nextTask) {
      return null
    }

    return await this.claimTask(nextTask.id, agentId, workspaceId)
  }

  async getQueueStats(workspaceId: string): Promise<{
    total: number
    byPriority: Record<string, number>
    byRole: Record<string, number>
  }> {
    const totalResult = await query(
      `SELECT COUNT(*) as count FROM tasks 
       WHERE workspace_id = $1 AND assignee_id IS NULL AND status IN ('todo', 'pending')`,
      [workspaceId]
    )

    const priorityResult = await query(
      `SELECT priority, COUNT(*) as count FROM tasks 
       WHERE workspace_id = $1 AND assignee_id IS NULL AND status IN ('todo', 'pending')
       GROUP BY priority`,
      [workspaceId]
    )

    const roleResult = await query(
      `SELECT metadata->>'required_role' as role, COUNT(*) as count FROM tasks 
       WHERE workspace_id = $1 AND assignee_id IS NULL AND status IN ('todo', 'pending')
       GROUP BY metadata->>'required_role'`,
      [workspaceId]
    )

    const byPriority: Record<string, number> = {}
    priorityResult.rows.forEach(row => {
      byPriority[row.priority] = parseInt(row.count)
    })

    const byRole: Record<string, number> = {}
    roleResult.rows.forEach(row => {
      byRole[row.role || 'any'] = parseInt(row.count)
    })

    return {
      total: parseInt(totalResult.rows[0].count),
      byPriority,
      byRole,
    }
  }
}

export default new QueueService()

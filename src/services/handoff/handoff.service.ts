import { query } from '../../config/database.js'

interface HandoffTemplate {
  id: string
  workspace_id: string
  project_id?: string
  goal_id?: string
  from_status: string
  next_title: string
  next_description?: string
  assignee_role?: string
  assignee_agent_id?: string
  auto_mention?: boolean
  created_at: Date
  updated_at: Date
}

interface Handoff {
  id: string
  workspace_id: string
  source_task_id: string
  template_id: string
  target_task_id: string
  dedupe_key: string
  created_at: Date
}

interface TriggeredHandoff {
  handoff: Handoff
  sourceTask: any
  template: HandoffTemplate
  targetTask: any
}

export class HandoffService {
  async createTemplate(data: {
    workspace_id: string
    project_id?: string
    goal_id?: string
    from_status: string
    next_title: string
    next_description?: string
    assignee_role?: string
    assignee_agent_id?: string
    auto_mention?: boolean
  }): Promise<HandoffTemplate> {
    const result = await query(
      `INSERT INTO handoff_templates 
       (workspace_id, project_id, goal_id, from_status, next_title, next_description, assignee_role, assignee_agent_id, auto_mention) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        data.workspace_id,
        data.project_id,
        data.goal_id,
        data.from_status,
        data.next_title,
        data.next_description,
        data.assignee_role,
        data.assignee_agent_id,
        data.auto_mention ?? false,
      ]
    )
    return result.rows[0]
  }

  async getTemplateById(
    id: string,
    workspaceId: string
  ): Promise<HandoffTemplate | null> {
    const result = await query(
      'SELECT * FROM handoff_templates WHERE id = $1 AND workspace_id = $2',
      [id, workspaceId]
    )
    return result.rows[0] || null
  }

  async getTemplatesByProjectOrGoal(
    workspaceId: string,
    projectId?: string,
    goalId?: string
  ): Promise<HandoffTemplate[]> {
    const result = await query(
      `SELECT * FROM handoff_templates 
       WHERE workspace_id = $1 
       AND (project_id = $2 OR goal_id = $3)`,
      [workspaceId, projectId, goalId]
    )
    return result.rows
  }

  async updateTemplate(
    id: string,
    workspaceId: string,
    data: Partial<{
      project_id?: string
      goal_id?: string
      from_status: string
      next_title: string
      next_description?: string
      assignee_role?: string
      assignee_agent_id?: string
      auto_mention?: boolean
    }>
  ): Promise<HandoffTemplate> {
    const fields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    Object.entries(data).forEach(([key, value]) => {
      fields.push(`${key} = $${paramIndex}`)
      values.push(value)
      paramIndex++
    })

    fields.push('updated_at = NOW()')
    values.push(id, workspaceId)

    const result = await query(
      `UPDATE handoff_templates 
       SET ${fields.join(', ')} 
       WHERE id = $${paramIndex} AND workspace_id = $${paramIndex + 1} 
       RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      throw new Error(`Template with id ${id} not found`)
    }

    return result.rows[0]
  }

  async deleteTemplate(
    id: string,
    workspaceId: string
  ): Promise<HandoffTemplate> {
    const result = await query(
      'DELETE FROM handoff_templates WHERE id = $1 AND workspace_id = $2 RETURNING *',
      [id, workspaceId]
    )

    if (result.rows.length === 0) {
      throw new Error(`Template with id ${id} not found`)
    }

    await query(
      'DELETE FROM handoffs WHERE template_id = $1 AND workspace_id = $2',
      [id, workspaceId]
    )

    return result.rows[0]
  }

  async triggerHandoffsForTask(
    task: any,
    workspaceId: string
  ): Promise<TriggeredHandoff[]> {
    const templatesResult = await query(
      `SELECT * FROM handoff_templates 
       WHERE workspace_id = $1 
       AND from_status = $2 
       AND (project_id = $3 OR goal_id = $4)`,
      [workspaceId, task.status, task.project_id, task.goal_id]
    )

    const matchingTemplates = templatesResult.rows
    const triggeredHandoffs: TriggeredHandoff[] = []

    for (const template of matchingTemplates) {
      const dedupeKey = `${task.id}:${template.id}`

      const existingResult = await query(
        'SELECT * FROM handoffs WHERE dedupe_key = $1 AND workspace_id = $2',
        [dedupeKey, workspaceId]
      )

      if (existingResult.rows.length > 0) {
        continue
      }

      const targetTaskResult = await query(
        `INSERT INTO tasks 
         (title, description, status, priority, project_id, assignee_id, creator_id, workspace_id, parent_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
         RETURNING *`,
        [
          template.next_title,
          template.next_description,
          'pending',
          task.priority || 'medium',
          task.project_id,
          null,
          task.creator_id,
          workspaceId,
          task.id,
        ]
      )

      const targetTask = targetTaskResult.rows[0]

      const handoffResult = await query(
        `INSERT INTO handoffs 
         (workspace_id, source_task_id, template_id, target_task_id, dedupe_key) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [workspaceId, task.id, template.id, targetTask.id, dedupeKey]
      )

      const handoff = handoffResult.rows[0]

      triggeredHandoffs.push({
        handoff,
        sourceTask: task,
        template,
        targetTask,
      })
    }

    return triggeredHandoffs
  }

  async getHandoffsForTask(
    taskId: string,
    workspaceId: string
  ): Promise<{ source: TriggeredHandoff[]; target: TriggeredHandoff[] }> {
    const sourceResult = await query(
      `SELECT h.*, 
              t1.* as source_task, 
              t2.* as target_task, 
              ht.* as template
       FROM handoffs h
       JOIN tasks t1 ON h.source_task_id = t1.id
       JOIN tasks t2 ON h.target_task_id = t2.id
       JOIN handoff_templates ht ON h.template_id = ht.id
       WHERE h.source_task_id = $1 AND h.workspace_id = $2`,
      [taskId, workspaceId]
    )

    const targetResult = await query(
      `SELECT h.*, 
              t1.* as source_task, 
              t2.* as target_task, 
              ht.* as template
       FROM handoffs h
       JOIN tasks t1 ON h.source_task_id = t1.id
       JOIN tasks t2 ON h.target_task_id = t2.id
       JOIN handoff_templates ht ON h.template_id = ht.id
       WHERE h.target_task_id = $1 AND h.workspace_id = $2`,
      [taskId, workspaceId]
    )

    return {
      source: sourceResult.rows,
      target: targetResult.rows,
    }
  }

  async getAllTemplates(workspaceId: string): Promise<HandoffTemplate[]> {
    const result = await query(
      'SELECT * FROM handoff_templates WHERE workspace_id = $1 ORDER BY created_at DESC',
      [workspaceId]
    )
    return result.rows
  }

  async getAllHandoffs(workspaceId: string): Promise<Handoff[]> {
    const result = await query(
      'SELECT * FROM handoffs WHERE workspace_id = $1 ORDER BY created_at DESC',
      [workspaceId]
    )
    return result.rows
  }
}

export default new HandoffService()

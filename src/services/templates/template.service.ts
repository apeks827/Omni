import { pool } from '../../config/database.js'

interface CreateTemplateData {
  user_id: string
  workspace_id: string
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  estimated_duration?: number
  checklist?: string[]
  variables?: Record<string, string>
}

interface UpdateTemplateData {
  title?: string
  description?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  estimated_duration?: number
  checklist?: string[]
  variables?: Record<string, string>
}

interface InstantiateTemplateData {
  project_id?: string
  variables?: Record<string, string>
}

export class TemplateService {
  async createTemplate(data: CreateTemplateData) {
    const result = await pool.query(
      `INSERT INTO task_templates (
        user_id, workspace_id, title, description, priority,
        estimated_duration, checklist, variables
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        data.user_id,
        data.workspace_id,
        data.title,
        data.description || null,
        data.priority || null,
        data.estimated_duration || null,
        JSON.stringify(data.checklist || []),
        JSON.stringify(data.variables || {}),
      ]
    )
    return result.rows[0]
  }

  async listTemplates(userId: string, workspaceId: string) {
    const result = await pool.query(
      'SELECT * FROM task_templates WHERE user_id = $1 AND workspace_id = $2 ORDER BY created_at DESC',
      [userId, workspaceId]
    )
    return result.rows
  }

  async getTemplate(id: string, userId: string, workspaceId: string) {
    const result = await pool.query(
      'SELECT * FROM task_templates WHERE id = $1 AND user_id = $2 AND workspace_id = $3',
      [id, userId, workspaceId]
    )
    if (result.rows.length === 0) {
      throw new Error('Template not found')
    }
    return result.rows[0]
  }

  async updateTemplate(
    id: string,
    userId: string,
    workspaceId: string,
    data: UpdateTemplateData
  ) {
    const fields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (data.title !== undefined) {
      fields.push(`title = $${paramIndex}`)
      values.push(data.title)
      paramIndex++
    }

    if (data.description !== undefined) {
      fields.push(`description = $${paramIndex}`)
      values.push(data.description)
      paramIndex++
    }

    if (data.priority !== undefined) {
      fields.push(`priority = $${paramIndex}`)
      values.push(data.priority)
      paramIndex++
    }

    if (data.estimated_duration !== undefined) {
      fields.push(`estimated_duration = $${paramIndex}`)
      values.push(data.estimated_duration)
      paramIndex++
    }

    if (data.checklist !== undefined) {
      fields.push(`checklist = $${paramIndex}`)
      values.push(JSON.stringify(data.checklist))
      paramIndex++
    }

    if (data.variables !== undefined) {
      fields.push(`variables = $${paramIndex}`)
      values.push(JSON.stringify(data.variables))
      paramIndex++
    }

    if (fields.length === 0) {
      return this.getTemplate(id, userId, workspaceId)
    }

    fields.push('updated_at = NOW()')
    values.push(id, userId, workspaceId)

    const result = await pool.query(
      `UPDATE task_templates SET ${fields.join(', ')} 
       WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} AND workspace_id = $${paramIndex + 2}
       RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      throw new Error('Template not found')
    }

    return result.rows[0]
  }

  async deleteTemplate(id: string, userId: string, workspaceId: string) {
    const result = await pool.query(
      'DELETE FROM task_templates WHERE id = $1 AND user_id = $2 AND workspace_id = $3 RETURNING id',
      [id, userId, workspaceId]
    )
    if (result.rows.length === 0) {
      throw new Error('Template not found')
    }
  }

  async instantiateTemplate(
    id: string,
    userId: string,
    workspaceId: string,
    data: InstantiateTemplateData
  ) {
    const template = await this.getTemplate(id, userId, workspaceId)

    const variables = { ...data.variables }
    const now = new Date()
    variables.date = now.toISOString().split('T')[0]
    variables.week_number = this.getWeekNumber(now).toString()

    if (data.project_id) {
      const projectResult = await pool.query(
        'SELECT name FROM projects WHERE id = $1 AND workspace_id = $2',
        [data.project_id, workspaceId]
      )
      if (projectResult.rows.length > 0) {
        variables.project_name = projectResult.rows[0].name
      }
    }

    const title = this.substituteVariables(template.title, variables)
    const description = template.description
      ? this.substituteVariables(template.description, variables)
      : null

    const result = await pool.query(
      `INSERT INTO tasks (
        title, description, status, priority, project_id,
        creator_id, workspace_id, estimated_duration
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        title,
        description,
        'pending',
        template.priority || 'medium',
        data.project_id || null,
        userId,
        workspaceId,
        template.estimated_duration || null,
      ]
    )

    return result.rows[0]
  }

  private substituteVariables(
    text: string,
    variables: Record<string, string>
  ): string {
    let result = text
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g')
      result = result.replace(regex, value)
    }
    return result
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    )
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  }
}

export default new TemplateService()

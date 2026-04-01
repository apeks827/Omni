import { query } from '../../../config/database.js'

interface Label {
  id: string
  name: string
  color?: string
  project_id?: string
  workspace_id: string
  created_at: Date
  updated_at: Date
}

class LabelRepository {
  async findAll(workspaceId: string): Promise<Label[]> {
    const result = await query(
      'SELECT * FROM labels WHERE workspace_id = $1 ORDER BY name ASC',
      [workspaceId]
    )
    return result.rows
  }

  async findById(id: string, workspaceId: string): Promise<Label | null> {
    const result = await query(
      'SELECT * FROM labels WHERE id = $1 AND workspace_id = $2',
      [id, workspaceId]
    )
    return result.rows.length > 0 ? result.rows[0] : null
  }

  async create(
    name: string,
    color: string | undefined,
    projectId: string | undefined,
    workspaceId: string
  ): Promise<Label> {
    const result = await query(
      'INSERT INTO labels (name, color, project_id, workspace_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, color, projectId, workspaceId]
    )
    return result.rows[0]
  }

  async update(
    id: string,
    name: string,
    color: string | undefined,
    projectId: string | undefined,
    workspaceId: string
  ): Promise<Label | null> {
    const result = await query(
      'UPDATE labels SET name = $1, color = $2, project_id = $3 WHERE id = $4 AND workspace_id = $5 RETURNING *',
      [name, color, projectId, id, workspaceId]
    )
    return result.rows.length > 0 ? result.rows[0] : null
  }

  async delete(id: string, workspaceId: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM labels WHERE id = $1 AND workspace_id = $2 RETURNING id',
      [id, workspaceId]
    )
    return result.rows.length > 0
  }

  async projectExists(
    projectId: string,
    workspaceId: string
  ): Promise<boolean> {
    const result = await query(
      'SELECT id FROM projects WHERE id = $1 AND workspace_id = $2',
      [projectId, workspaceId]
    )
    return result.rows.length > 0
  }

  async validateLabelIds(
    labelIds: string[],
    workspaceId: string
  ): Promise<boolean> {
    if (labelIds.length === 0) return true
    const placeholders = labelIds.map((_, i) => `$${i + 1}`).join(', ')
    const result = await query(
      `SELECT id FROM labels WHERE id IN (${placeholders}) AND workspace_id = $${labelIds.length + 1}`,
      [...labelIds, workspaceId]
    )
    return result.rows.length === labelIds.length
  }
}

export default new LabelRepository()

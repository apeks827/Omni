import { query } from '../../../config/database.js'

interface Project {
  id: string
  name: string
  description?: string
  owner_id: string
  workspace_id: string
  created_at: Date
  updated_at: Date
}

class ProjectRepository {
  async findAll(workspaceId: string): Promise<Project[]> {
    const result = await query(
      'SELECT * FROM projects WHERE workspace_id = $1 ORDER BY created_at DESC',
      [workspaceId]
    )
    return result.rows
  }

  async findById(id: string, workspaceId: string): Promise<Project | null> {
    const result = await query(
      'SELECT * FROM projects WHERE id = $1 AND workspace_id = $2',
      [id, workspaceId]
    )
    return result.rows.length > 0 ? result.rows[0] : null
  }

  async create(
    name: string,
    description: string | undefined,
    userId: string,
    workspaceId: string
  ): Promise<Project> {
    const result = await query(
      'INSERT INTO projects (name, description, owner_id, workspace_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, userId, workspaceId]
    )
    return result.rows[0]
  }

  async update(
    id: string,
    name: string,
    description: string | undefined,
    workspaceId: string
  ): Promise<Project | null> {
    const result = await query(
      'UPDATE projects SET name = $1, description = $2 WHERE id = $3 AND workspace_id = $4 RETURNING *',
      [name, description, id, workspaceId]
    )
    return result.rows.length > 0 ? result.rows[0] : null
  }

  async delete(id: string, workspaceId: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM projects WHERE id = $1 AND workspace_id = $2 RETURNING id',
      [id, workspaceId]
    )
    return result.rows.length > 0
  }
}

export default new ProjectRepository()

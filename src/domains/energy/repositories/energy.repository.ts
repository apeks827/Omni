import { query } from '../../../config/database.js'

interface Task {
  id: string
  title: string
  description?: string
  type: string
  estimated_duration?: number
}

class EnergyRepository {
  async findTaskById(
    taskId: string,
    workspaceId: string
  ): Promise<Task | null> {
    const result = await query(
      'SELECT id, title, description, type, estimated_duration FROM tasks WHERE id = $1 AND workspace_id = $2',
      [taskId, workspaceId]
    )
    return result.rows.length > 0 ? result.rows[0] : null
  }
}

export default new EnergyRepository()

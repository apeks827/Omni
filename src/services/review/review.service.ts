import { query } from '../../config/database.js'

interface ReviewTask {
  id: string
  workspace_id: string
  source_task_id: string
  reviewer_agent_id: string
  review_status: 'pending' | 'approved' | 'revise'
  review_comment?: string
  created_at: Date
  updated_at: Date
  completed_at?: Date
}

interface ReviewTemplate {
  id: string
  workspace_id: string
  project_id?: string
  goal_id?: string
  from_status: string
  reviewer_agent_id: string
  approved_status: string
  revise_status: string
}

export class ReviewService {
  async createReviewTask(data: {
    workspace_id: string
    source_task_id: string
    reviewer_agent_id: string
  }): Promise<ReviewTask> {
    const result = await query(
      `INSERT INTO review_tasks 
       (workspace_id, source_task_id, reviewer_agent_id, review_status) 
       VALUES ($1, $2, $3, 'pending') 
       RETURNING *`,
      [data.workspace_id, data.source_task_id, data.reviewer_agent_id]
    )
    return result.rows[0]
  }

  async getReviewTask(
    sourceTaskId: string,
    workspaceId: string
  ): Promise<ReviewTask | null> {
    const result = await query(
      `SELECT * FROM review_tasks 
       WHERE source_task_id = $1 AND workspace_id = $2 
       ORDER BY created_at DESC LIMIT 1`,
      [sourceTaskId, workspaceId]
    )
    return result.rows[0] || null
  }

  async updateReviewStatus(
    reviewTaskId: string,
    workspaceId: string,
    status: 'approved' | 'revise',
    comment?: string
  ): Promise<ReviewTask> {
    const result = await query(
      `UPDATE review_tasks 
       SET review_status = $1, review_comment = $2, completed_at = NOW(), updated_at = NOW() 
       WHERE id = $3 AND workspace_id = $4 
       RETURNING *`,
      [status, comment, reviewTaskId, workspaceId]
    )

    if (result.rows.length === 0) {
      throw new Error(`Review task with id ${reviewTaskId} not found`)
    }

    return result.rows[0]
  }

  async triggerReviewForTask(
    task: any,
    workspaceId: string
  ): Promise<ReviewTask | null> {
    const templatesResult = await query(
      `SELECT * FROM handoff_templates 
       WHERE workspace_id = $1 
       AND from_status = $2 
       AND review_template = true
       AND (project_id = $3 OR goal_id = $4)
       LIMIT 1`,
      [workspaceId, task.status, task.project_id, task.goal_id]
    )

    if (templatesResult.rows.length === 0) {
      return null
    }

    const template = templatesResult.rows[0]

    const existingReview = await this.getReviewTask(task.id, workspaceId)
    if (existingReview && existingReview.review_status === 'pending') {
      return existingReview
    }

    const reviewTask = await this.createReviewTask({
      workspace_id: workspaceId,
      source_task_id: task.id,
      reviewer_agent_id: template.reviewer_agent_id,
    })

    return reviewTask
  }

  async handleReviewDecision(
    reviewTaskId: string,
    workspaceId: string,
    decision: 'approved' | 'revise',
    comment?: string
  ): Promise<{ reviewTask: ReviewTask; updatedSourceTask: any }> {
    const reviewTask = await this.updateReviewStatus(
      reviewTaskId,
      workspaceId,
      decision,
      comment
    )

    const templatesResult = await query(
      `SELECT ht.* FROM handoff_templates ht
       JOIN review_tasks rt ON rt.source_task_id = rt.source_task_id
       WHERE rt.id = $1 AND rt.workspace_id = $2 AND ht.review_template = true
       LIMIT 1`,
      [reviewTaskId, workspaceId]
    )

    const template = templatesResult.rows[0]
    const newStatus =
      decision === 'approved'
        ? template.approved_status
        : template.revise_status

    const taskResult = await query(
      `UPDATE tasks 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2 AND workspace_id = $3 
       RETURNING *`,
      [newStatus, reviewTask.source_task_id, workspaceId]
    )

    return {
      reviewTask,
      updatedSourceTask: taskResult.rows[0],
    }
  }

  async getPendingReviewsForAgent(
    agentId: string,
    workspaceId: string
  ): Promise<ReviewTask[]> {
    const result = await query(
      `SELECT rt.*, t.title as task_title, t.status as task_status 
       FROM review_tasks rt
       JOIN tasks t ON rt.source_task_id = t.id
       WHERE rt.reviewer_agent_id = $1 
       AND rt.workspace_id = $2 
       AND rt.review_status = 'pending'
       ORDER BY rt.created_at ASC`,
      [agentId, workspaceId]
    )
    return result.rows
  }
}

export default new ReviewService()

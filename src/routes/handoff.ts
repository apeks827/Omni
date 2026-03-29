import { Router } from 'express'
import { Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import handoffService from '../services/handoff/handoff.service.js'

const router = Router()

router.use(authenticateToken)

router.post('/templates', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId
    const {
      project_id,
      goal_id,
      from_status,
      next_title,
      next_description,
      assignee_role,
      assignee_agent_id,
      auto_mention,
    } = req.body

    if (!from_status || !next_title) {
      return res
        .status(400)
        .json({ error: 'from_status and next_title are required' })
    }

    const template = await handoffService.createTemplate({
      workspace_id: workspaceId as string,
      project_id,
      goal_id,
      from_status,
      next_title,
      next_description,
      assignee_role,
      assignee_agent_id,
      auto_mention,
    })

    res.status(201).json(template)
  } catch (error) {
    console.error('Error creating handoff template:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/templates', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId
    const projectId =
      typeof req.query.project_id === 'string'
        ? req.query.project_id
        : undefined
    const goalId =
      typeof req.query.goal_id === 'string' ? req.query.goal_id : undefined

    let templates
    if (projectId || goalId) {
      templates = await handoffService.getTemplatesByProjectOrGoal(
        workspaceId as string,
        projectId,
        goalId
      )
    } else {
      templates = await handoffService.getAllTemplates(workspaceId as string)
    }

    res.json(templates)
  } catch (error) {
    console.error('Error fetching handoff templates:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/templates/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const workspaceId = req.workspaceId

    const template = await handoffService.getTemplateById(
      id as string,
      workspaceId as string
    )

    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }

    res.json(template)
  } catch (error) {
    console.error('Error fetching handoff template:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/templates/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const workspaceId = req.workspaceId
    const {
      project_id,
      goal_id,
      from_status,
      next_title,
      next_description,
      assignee_role,
      assignee_agent_id,
      auto_mention,
    } = req.body

    const template = await handoffService.updateTemplate(
      id as string,
      workspaceId as string,
      {
        project_id: project_id as string | undefined,
        goal_id: goal_id as string | undefined,
        from_status,
        next_title,
        next_description,
        assignee_role: assignee_role as string | undefined,
        assignee_agent_id: assignee_agent_id as string | undefined,
        auto_mention,
      }
    )

    res.json(template)
  } catch (error) {
    console.error('Error updating handoff template:', error)
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/templates/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const workspaceId = req.workspaceId

    await handoffService.deleteTemplate(id as string, workspaceId as string)

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting handoff template:', error)
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/trigger/:taskId', async (req: AuthRequest, res: Response) => {
  try {
    const taskId = req.params.taskId as string
    const workspaceId = req.workspaceId

    const taskResult = await handoffService.getHandoffsForTask(
      taskId,
      workspaceId as string
    )

    if (!taskResult) {
      return res.status(404).json({ error: 'Task not found' })
    }

    const triggeredHandoffs = await handoffService.triggerHandoffsForTask(
      { id: taskId, ...req.body },
      workspaceId as string
    )

    res.json(triggeredHandoffs)
  } catch (error) {
    console.error('Error triggering handoffs:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/task/:taskId', async (req: AuthRequest, res: Response) => {
  try {
    const taskId = req.params.taskId as string
    const workspaceId = req.workspaceId

    const handoffs = await handoffService.getHandoffsForTask(
      taskId,
      workspaceId as string
    )

    res.json(handoffs)
  } catch (error) {
    console.error('Error fetching task handoffs:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/all', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId

    const handoffs = await handoffService.getAllHandoffs(workspaceId as string)

    res.json(handoffs)
  } catch (error) {
    console.error('Error fetching all handoffs:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

import { Router } from 'express'
import { Request, Response } from 'express'
import { query } from '../config/database.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { validate, validateParams } from '../middleware/validation.js'
import {
  createLabelSchema,
  updateLabelSchema,
  uuidParamSchema,
} from '../validation/schemas.js'

const router = Router()

const hasWorkspaceProject = async (projectId: string, workspaceId: string) => {
  const result = await query(
    'SELECT id FROM projects WHERE id = $1 AND workspace_id = $2',
    [projectId, workspaceId]
  )

  return result.rows.length > 0
}

interface Label {
  id: string
  name: string
  color?: string
  project_id?: string
  workspace_id: string
  created_at: Date
  updated_at: Date
}

router.use(authenticateToken) // Apply auth to all routes

// Labels are workspace-scoped through their associated project or directly via workspace_id
interface WorkspaceLabel extends Label {
  workspace_id: string
}

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId
    const result = await query(
      'SELECT * FROM labels WHERE workspace_id = $1 ORDER BY name ASC',
      [workspaceId]
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching labels:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get(
  '/:id',
  validateParams(uuidParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const workspaceId = req.workspaceId
      const result = await query(
        'SELECT * FROM labels WHERE id = $1 AND workspace_id = $2',
        [id, workspaceId]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Label not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Error fetching label:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

router.post(
  '/',
  validate(createLabelSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, color, project_id } = req.body
      const workspaceId = req.workspaceId

      if (project_id) {
        const projectExists = await hasWorkspaceProject(
          project_id,
          workspaceId as string
        )

        if (!projectExists) {
          return res
            .status(400)
            .json({ error: 'Invalid project_id for workspace' })
        }
      }

      const result = await query(
        'INSERT INTO labels (name, color, project_id, workspace_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, color, project_id, workspaceId]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Error creating label:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

router.put(
  '/:id',
  validateParams(uuidParamSchema),
  validate(updateLabelSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const { name, color, project_id } = req.body
      const workspaceId = req.workspaceId

      if (project_id) {
        const projectExists = await hasWorkspaceProject(
          project_id,
          workspaceId as string
        )

        if (!projectExists) {
          return res
            .status(400)
            .json({ error: 'Invalid project_id for workspace' })
        }
      }

      const result = await query(
        'UPDATE labels SET name = $1, color = $2, project_id = $3 WHERE id = $4 AND workspace_id = $5 RETURNING *',
        [name, color, project_id, id, workspaceId]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Label not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Error updating label:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

router.delete(
  '/:id',
  validateParams(uuidParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const workspaceId = req.workspaceId
      const result = await query(
        'DELETE FROM labels WHERE id = $1 AND workspace_id = $2 RETURNING id',
        [id, workspaceId]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Label not found' })
      }

      res.status(204).send()
    } catch (error) {
      console.error('Error deleting label:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router

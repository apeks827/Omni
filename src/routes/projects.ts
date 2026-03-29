import { Router } from 'express'
import { Request, Response } from 'express'
import { query } from '../config/database.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { validate, validateParams } from '../middleware/validation.js'
import {
  createProjectSchema,
  updateProjectSchema,
  uuidParamSchema,
} from '../validation/schemas.js'

const router = Router()

interface Project {
  id: string
  name: string
  description?: string
  owner_id: string
  workspace_id: string
  created_at: Date
  updated_at: Date
}

// Apply authentication to all routes
router.use(authenticateToken)

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId
    const result = await query(
      'SELECT * FROM projects WHERE workspace_id = $1 ORDER BY created_at DESC',
      [workspaceId]
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching projects:', error)
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
        'SELECT * FROM projects WHERE id = $1 AND workspace_id = $2',
        [id, workspaceId]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Error fetching project:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

router.post(
  '/',
  validate(createProjectSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, description } = req.body
      const userId = req.userId
      const workspaceId = req.workspaceId
      const result = await query(
        'INSERT INTO projects (name, description, owner_id, workspace_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, description, userId, workspaceId]
      )

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Error creating project:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

router.put(
  '/:id',
  validateParams(uuidParamSchema),
  validate(updateProjectSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const { name, description } = req.body
      const workspaceId = req.workspaceId
      const result = await query(
        'UPDATE projects SET name = $1, description = $2 WHERE id = $3 AND workspace_id = $4 RETURNING *',
        [name, description, id, workspaceId]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Error updating project:', error)
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
        'DELETE FROM projects WHERE id = $1 AND workspace_id = $2 RETURNING id',
        [id, workspaceId]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' })
      }

      res.status(204).send()
    } catch (error) {
      console.error('Error deleting project:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router

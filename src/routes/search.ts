import { Router, Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { validate } from '../middleware/validation.js'
import {
  searchTasksSchema,
  searchSuggestionsSchema,
  searchTitlesSchema,
} from '../validation/schemas.js'
import searchService from '../services/search.service.js'
import { handleError } from '../utils/errors.js'

const router = Router()

router.use(authenticateToken)

router.post(
  '/tasks',
  validate(searchTasksSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { query, status, priority, project_id, label_id } = req.body
      const workspaceId = req.workspaceId as string

      const results = await searchService.searchTasks(query, workspaceId, {
        status,
        priority,
        project_id,
        label_id,
      })

      res.json({
        results,
        count: results.length,
        query,
      })
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to search tasks')
      res.status(status).json(body)
    }
  }
)

router.post(
  '/suggestions',
  validate(searchSuggestionsSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { prefix, limit } = req.body
      const workspaceId = req.workspaceId as string

      const suggestions = await searchService.searchSuggestions(
        prefix,
        workspaceId,
        limit
      )

      res.json({
        suggestions,
        count: suggestions.length,
        prefix,
      })
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to get suggestions')
      res.status(status).json(body)
    }
  }
)

router.post(
  '/titles',
  validate(searchTitlesSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { prefix, limit } = req.body
      const workspaceId = req.workspaceId as string

      const titles = await searchService.searchTitles(
        prefix,
        workspaceId,
        limit
      )

      res.json({
        titles,
        count: titles.length,
        prefix,
      })
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to search titles')
      res.status(status).json(body)
    }
  }
)

export default router

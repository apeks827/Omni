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
      const userId = req.userId as string

      const results = await searchService.searchTasks(query, workspaceId, {
        status,
        priority,
        project_id,
        label_id,
      })

      if (query.trim()) {
        await searchService.recordSearchHistory(
          userId,
          workspaceId,
          query,
          { status, priority, project_id, label_id },
          results.length
        )
      }

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

router.post('/saved', async (req: AuthRequest, res: Response) => {
  try {
    const { name, query, filters } = req.body
    const userId = req.userId as string
    const workspaceId = req.workspaceId as string

    const savedSearch = await searchService.createSavedSearch(
      userId,
      workspaceId,
      name,
      query,
      filters
    )

    res.status(201).json(savedSearch)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to create saved search')
    res.status(status).json(body)
  }
})

router.get('/saved', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId as string
    const workspaceId = req.workspaceId as string

    const savedSearches = await searchService.getSavedSearches(
      userId,
      workspaceId
    )

    res.json(savedSearches)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to get saved searches')
    res.status(status).json(body)
  }
})

router.get('/saved/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const userId = req.userId as string
    const workspaceId = req.workspaceId as string

    const savedSearch = await searchService.getSavedSearch(
      id,
      userId,
      workspaceId
    )

    if (!savedSearch) {
      return res.status(404).json({ error: 'Saved search not found' })
    }

    res.json(savedSearch)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to get saved search')
    res.status(status).json(body)
  }
})

router.patch('/saved/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const { name, query, filters } = req.body
    const userId = req.userId as string
    const workspaceId = req.workspaceId as string

    const savedSearch = await searchService.updateSavedSearch(
      id,
      userId,
      workspaceId,
      { name, query, filters }
    )

    if (!savedSearch) {
      return res.status(404).json({ error: 'Saved search not found' })
    }

    res.json(savedSearch)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to update saved search')
    res.status(status).json(body)
  }
})

router.delete('/saved/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const userId = req.userId as string
    const workspaceId = req.workspaceId as string

    const deleted = await searchService.deleteSavedSearch(
      id,
      userId,
      workspaceId
    )

    if (!deleted) {
      return res.status(404).json({ error: 'Saved search not found' })
    }

    res.status(204).send()
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to delete saved search')
    res.status(status).json(body)
  }
})

router.get('/history', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId as string
    const workspaceId = req.workspaceId as string
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20

    const history = await searchService.getSearchHistory(
      userId,
      workspaceId,
      limit
    )

    res.json(history)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to get search history')
    res.status(status).json(body)
  }
})

export default router

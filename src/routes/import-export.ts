import { Router } from 'express'
import { Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { validate } from '../middleware/validation.js'
import { handleError } from '../utils/errors.js'
import { userRateLimit } from '../middleware/rateLimit.js'
import {
  exportTasksSchema,
  importPreviewSchema,
  importTasksSchema,
} from '../validation/schemas.js'
import {
  exportTasks,
  previewImport,
  importTasks,
} from '../services/import-export.service.js'

const router = Router()

router.use(authenticateToken)

const exportRateLimit = userRateLimit({
  windowMs: 60000,
  max: 5,
  message: 'Rate limit exceeded: 5 exports per minute',
})

const importRateLimit = userRateLimit({
  windowMs: 60000,
  max: 3,
  message: 'Rate limit exceeded: 3 imports per minute',
})

router.post(
  '/export',
  exportRateLimit,
  validate(exportTasksSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const workspaceId = req.workspaceId as string
      const { format, filters } = req.body

      const result = await exportTasks(workspaceId, format, filters)

      res.setHeader('Content-Type', result.contentType)
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${result.filename}"`
      )
      res.send(result.data)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to export tasks')
      res.status(status).json(body)
    }
  }
)

router.post(
  '/import/preview',
  importRateLimit,
  validate(importPreviewSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const workspaceId = req.workspaceId as string
      const { data, format, mapping } = req.body

      const preview = await previewImport(workspaceId, data, format, mapping)

      res.json(preview)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to preview import')
      res.status(status).json(body)
    }
  }
)

router.post(
  '/import',
  importRateLimit,
  validate(importTasksSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const workspaceId = req.workspaceId as string
      const userId = req.userId as string
      const { data, format, mapping, options } = req.body

      const result = await importTasks(
        workspaceId,
        userId,
        data,
        format,
        mapping,
        options
      )

      res.json(result)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to import tasks')
      res.status(status).json(body)
    }
  }
)

export default router

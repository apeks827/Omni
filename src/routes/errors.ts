import express from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { handleError } from '../utils/errors.js'
import errorService from '../domains/errors/services/error.service.js'

const router = express.Router()

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { layer, severity, resolved, limit = '50' } = req.query

    const filters = {
      layer: layer as string | undefined,
      severity: severity as string | undefined,
      resolved:
        resolved === 'true' ? true : resolved === 'false' ? false : undefined,
      limit: parseInt(limit as string),
    }

    const errors = await errorService.listErrors(filters)
    res.json(errors)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to fetch error events')
    res.status(status).json(body)
  }
})

router.patch(
  '/:id/resolve',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params as { id: string }
      const resolved = await errorService.resolveError(id)
      res.json(resolved)
    } catch (error) {
      const { status, body } = handleError(
        error,
        'Failed to resolve error event'
      )
      res.status(status).json(body)
    }
  }
)

router.get(
  '/correlation/:correlationId',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const { correlationId } = req.params as { correlationId: string }
      const errors = await errorService.getErrorsByCorrelationId(correlationId)
      res.json(errors)
    } catch (error) {
      const { status, body } = handleError(
        error,
        'Failed to fetch correlated errors'
      )
      res.status(status).json(body)
    }
  }
)

export default router

import { Router, Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { validate } from '../middleware/validation.js'
import { extractRequestSchema } from '../validation/schemas.js'
import intentService from '../services/intent/IntentService.js'
import { handleError } from '../utils/errors.js'

const router = Router()

router.use(authenticateToken)

router.post(
  '/',
  validate(extractRequestSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { input } = req.body

      const parsedIntent = await intentService.parseIntent(input)

      res.status(201).json(parsedIntent)
    } catch (error) {
      const { status, body } = handleError(error, 'Failed to parse intent')
      res.status(status).json(body)
    }
  }
)

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id =
      typeof req.params.id === 'string' ? req.params.id : req.params.id[0]

    const intent = intentService.getIntent(id)

    if (!intent) {
      return res.status(404).json({ error: 'Intent not found' })
    }

    res.json(intent)
  } catch (error) {
    const { status, body } = handleError(error, 'Failed to fetch intent')
    res.status(status).json(body)
  }
})

export default router

import { Router } from 'express'
import { rateLimit } from '../middleware/rateLimit.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validation/schemas.js'
import { handleError } from '../utils/errors.js'
import authService from '../domains/auth/services/auth.service.js'
import { logAuditEvent } from '../utils/security.js'

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts, please try again later.',
})

const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many password reset attempts, please try again later.',
})

const tokenRefreshRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many token refresh attempts, please try again later.',
})

const router = Router()

router.post('/register', authRateLimit, async (req, res) => {
  try {
    const validated = registerSchema.safeParse(req.body)
    if (!validated.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validated.error.issues.map(issue => issue.message),
      })
    }

    const ip = req.ip || req.header('x-forwarded-for') || 'unknown'
    const userAgent = req.header('user-agent') || 'unknown'

    const result = await authService.register(validated.data, ip, userAgent)
    res.status(201).json(result)
  } catch (error: any) {
    if (error.message === 'User with this email already exists') {
      return res.status(409).json({ error: error.message })
    }
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/login', authRateLimit, async (req, res) => {
  try {
    const validated = loginSchema.safeParse(req.body)
    if (!validated.success) {
      const ip = req.ip || req.header('x-forwarded-for') || 'unknown'
      const userAgent = req.header('user-agent') || 'unknown'
      await logAuditEvent(
        'login_failed_input_validation',
        null,
        ip,
        userAgent,
        {
          email: req.body.email,
        }
      )
      return res.status(400).json({
        error: 'Validation failed',
        details: validated.error.issues.map(issue => issue.message),
      })
    }

    const ip = req.ip || req.header('x-forwarded-for') || 'unknown'
    const userAgent = req.header('user-agent') || 'unknown'

    const result = await authService.login(validated.data, ip, userAgent)
    res.json(result)
  } catch (error: any) {
    if (
      error.message ===
      'Account temporarily locked due to multiple failed login attempts'
    ) {
      return res.status(423).json({ error: error.message })
    }
    if (error.message === 'Invalid email or password') {
      return res.status(401).json({ error: error.message })
    }
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const result = await authService.getCurrentUser(userId)
    res.json(result)
  } catch (error: any) {
    if (error.message === 'User not found') {
      return res.status(404).json({ error: error.message })
    }
    const { status, body } = handleError(error, 'Failed to fetch user')
    res.status(status).json(body)
  }
})

router.post(
  '/refresh',
  tokenRefreshRateLimit,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const ip = req.ip || req.header('x-forwarded-for') || 'unknown'
      const userAgent = req.header('user-agent') || 'unknown'

      const result = await authService.refreshToken(userId, ip, userAgent)
      res.json(result)
    } catch (error: any) {
      if (error.message === 'User not found') {
        return res.status(401).json({ error: error.message })
      }
      console.error('Token refresh error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

router.post('/forgot-password', passwordResetRateLimit, async (req, res) => {
  try {
    const validated = forgotPasswordSchema.safeParse(req.body)
    if (!validated.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validated.error.issues.map(issue => issue.message),
      })
    }

    const ip = req.ip || req.header('x-forwarded-for') || 'unknown'
    const userAgent = req.header('user-agent') || 'unknown'

    await authService.requestPasswordReset(validated.data.email, ip, userAgent)
    res.json({
      message:
        'If an account with this email exists, a password reset link has been sent.',
    })
  } catch (error: any) {
    if (error.message === 'Too many password reset attempts') {
      return res.status(429).json({ error: error.message })
    }
    console.error('Forgot password error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/reset-password', authRateLimit, async (req, res) => {
  try {
    const validated = resetPasswordSchema.safeParse(req.body)
    if (!validated.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validated.error.issues.map(issue => issue.message),
      })
    }

    const ip = req.ip || req.header('x-forwarded-for') || 'unknown'
    const userAgent = req.header('user-agent') || 'unknown'

    await authService.resetPassword(validated.data, ip, userAgent)
    res.json({ message: 'Password has been reset successfully' })
  } catch (error: any) {
    if (error.message === 'Invalid or expired reset token') {
      return res.status(400).json({ error: error.message })
    }
    console.error('Reset password error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/logout', async (req, res) => {
  res.json({ message: 'Logged out successfully' })
})

export default router

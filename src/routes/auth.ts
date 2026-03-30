import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { query } from '../config/database.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { rateLimit } from '../middleware/rateLimit.js'
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validation/schemas.js'
import {
  generateSecureToken,
  hashToken,
  verifyToken,
  isAccountLocked,
  recordFailedLoginAttempt,
  clearFailedLoginAttempts,
  logAuditEvent,
  isPasswordResetRateLimited,
} from '../utils/security.js'

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts, please try again later.',
})

// Specific rate limiter for password reset requests
const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: 'Too many password reset attempts, please try again later.',
})

// Rate limiter for token refresh
const tokenRefreshRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 refreshes per minute
  message: 'Too many token refresh attempts, please try again later.',
})

const router = Router()

// Register endpoint
router.post('/register', authRateLimit, async (req, res) => {
  try {
    const validated = registerSchema.safeParse(req.body)
    if (!validated.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validated.error.issues.map(issue => issue.message),
      })
    }
    const { email, password, name } = validated.data

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [
      email,
    ])
    if (existingUser.rows.length > 0) {
      return res
        .status(409)
        .json({ error: 'User with this email already exists' })
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Generate a new workspace ID for the user
    const workspaceId = randomUUID()

    // Create workspace first
    await query(
      'INSERT INTO workspaces (id, name, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())',
      [workspaceId, `${name}'s Workspace`]
    )

    // Create user
    const result = await query(
      'INSERT INTO users (id, email, password_hash, name, workspace_id, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW()) RETURNING id, email, name, workspace_id, created_at, updated_at',
      [email, hashedPassword, name, workspaceId]
    )

    const user = result.rows[0]

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, workspaceId: user.workspace_id },
      process.env.JWT_SECRET as string,
      { expiresIn: '30d' }
    )

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        workspace_id: user.workspace_id,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Login endpoint
router.post('/login', authRateLimit, async (req, res) => {
  try {
    const validated = loginSchema.safeParse(req.body)
    if (!validated.success) {
      // Get IP and user agent for security logging
      const ip = req.ip || req.header('x-forwarded-for') || 'unknown'
      const userAgent = req.header('user-agent') || 'unknown'
      await logAuditEvent(
        'login_failed_input_validation',
        null,
        ip,
        userAgent,
        { email: req.body.email }
      )
      return res.status(400).json({
        error: 'Validation failed',
        details: validated.error.issues.map(issue => issue.message),
      })
    }
    const { email, password } = validated.data

    // Get IP and user agent for security logging
    const ip = req.ip || req.header('x-forwarded-for') || 'unknown'
    const userAgent = req.header('user-agent') || 'unknown'

    // Check if account is locked
    const isLocked = await isAccountLocked(email, ip)
    if (isLocked) {
      await logAuditEvent('login_failed_account_locked', null, ip, userAgent, {
        email,
      })
      return res.status(423).json({
        error:
          'Account temporarily locked due to multiple failed login attempts. Please try again later.',
      })
    }

    // Find user
    const result = await query(
      'SELECT id, email, password_hash, name, workspace_id, created_at, updated_at FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      // Record failed attempt even if user doesn't exist (to prevent user enumeration)
      await recordFailedLoginAttempt(email, ip)
      await logAuditEvent('login_failed_user_not_found', null, ip, userAgent, {
        email,
      })
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const user = result.rows[0]

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      await recordFailedLoginAttempt(email, ip)
      await logAuditEvent(
        'login_failed_invalid_password',
        user.id,
        ip,
        userAgent,
        { email: user.email }
      )
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Clear any failed login attempts on successful login
    await clearFailedLoginAttempts(email, ip)

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, workspaceId: user.workspace_id },
      process.env.JWT_SECRET as string,
      { expiresIn: '30d' }
    )

    // Log successful login
    await logAuditEvent('login_success', user.id, ip, userAgent, {
      email: user.email,
    })

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        workspace_id: user.workspace_id,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get current user endpoint
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const authReq = req as AuthRequest
    const userId = authReq.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const result = await query(
      'SELECT id, email, name, workspace_id, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const user = result.rows[0]

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        workspace_id: user.workspace_id,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Token refresh endpoint
router.post('/refresh', tokenRefreshRateLimit, async (req, res) => {
  try {
    const authReq = req as AuthRequest
    const userId = authReq.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Get IP and user agent for security logging
    const ip = req.ip || req.header('x-forwarded-for') || 'unknown'
    const userAgent = req.header('user-agent') || 'unknown'

    // Verify user still exists
    const result = await query(
      'SELECT id, email, workspace_id FROM users WHERE id = $1',
      [userId]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' })
    }

    const user = result.rows[0]

    // Generate new JWT token with extended expiration
    const token = jwt.sign(
      { userId: user.id, workspaceId: user.workspace_id },
      process.env.JWT_SECRET as string,
      { expiresIn: '30d' }
    )

    // Update last activity
    await query('UPDATE users SET last_activity_at = NOW() WHERE id = $1', [
      userId,
    ])

    // Log token refresh
    await logAuditEvent('token_refreshed', userId, ip, userAgent, {
      email: user.email,
    })

    res.json({ token })
  } catch (error) {
    console.error('Token refresh error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Password reset request endpoint
router.post('/forgot-password', passwordResetRateLimit, async (req, res) => {
  try {
    const validated = forgotPasswordSchema.safeParse(req.body)

    // Get IP and user agent for security logging
    const ip = req.ip || req.header('x-forwarded-for') || 'unknown'
    const userAgent = req.header('user-agent') || 'unknown'

    if (!validated.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validated.error.issues.map(issue => issue.message),
      })
    }

    const { email } = validated.data

    // Check if password reset is rate limited
    const isRateLimited = await isPasswordResetRateLimited(email)
    if (isRateLimited) {
      await logAuditEvent('password_reset_rate_limited', null, ip, userAgent, {
        email,
      })
      return res.status(429).json({
        error: 'Too many password reset attempts. Please try again later.',
      })
    }

    // Check if user exists (but don't reveal if they do for security)
    const userResult = await query('SELECT id FROM users WHERE email = $1', [
      email,
    ])

    if (userResult.rows.length > 0) {
      // User exists, create a password reset token
      const user = userResult.rows[0]
      const token = generateSecureToken(32) // 32 bytes = 256 bits
      const tokenHash = await hashToken(token)

      // Set expiration to 1 hour from now
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

      // Store the reset token
      await query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) 
         VALUES ($1, $2, $3)`,
        [user.id, tokenHash, expiresAt.toISOString()]
      )

      // Log the password reset request
      await logAuditEvent('password_reset_requested', user.id, ip, userAgent, {
        email,
      })

      // In a real implementation, we would send an email with the reset link
      // For now, we simulate the process but don't expose the token in the response
      console.log(`Password reset token generated for ${email}: ${token}`)
    } else {
      // Even if user doesn't exist, still log the attempt (but don't store a token)
      await logAuditEvent(
        'password_reset_requested_nonexistent',
        null,
        ip,
        userAgent,
        { email }
      )
    }

    // Always return success to prevent user enumeration
    res.json({
      message:
        'If an account with this email exists, a password reset link has been sent.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Password reset endpoint
router.post('/reset-password', authRateLimit, async (req, res) => {
  try {
    const validated = resetPasswordSchema.safeParse(req.body)

    // Get IP and user agent for security logging
    const ip = req.ip || req.header('x-forwarded-for') || 'unknown'
    const userAgent = req.header('user-agent') || 'unknown'

    if (!validated.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validated.error.issues.map(issue => issue.message),
      })
    }

    const { token, newPassword } = validated.data

    // Find the token in the database

    const tokenResult = await query(
      `SELECT id, user_id, token_hash, expires_at, used_at 
       FROM password_reset_tokens 
       WHERE expires_at > NOW() AND used_at IS NULL`
    )

    // Look for a matching token
    let matchingTokenRecord: any = null
    for (const record of tokenResult.rows) {
      const isValid = await verifyToken(token, record.token_hash)
      if (isValid) {
        matchingTokenRecord = record
        break
      }
    }

    if (!matchingTokenRecord) {
      await logAuditEvent(
        'password_reset_failed_invalid_token',
        null,
        ip,
        userAgent,
        {}
      )
      return res.status(400).json({ error: 'Invalid or expired reset token' })
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update the user's password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, matchingTokenRecord.user_id]
    )

    // Mark the token as used
    await query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
      [matchingTokenRecord.id]
    )

    // Log the successful password change
    await logAuditEvent(
      'password_changed_via_reset',
      matchingTokenRecord.user_id,
      ip,
      userAgent,
      {}
    )

    res.json({ message: 'Password has been reset successfully' })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Logout endpoint (client-side token removal)
router.post('/logout', async (req, res) => {
  // Simply instruct client to remove token
  res.json({ message: 'Logged out successfully' })
})

export default router

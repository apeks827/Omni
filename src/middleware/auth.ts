import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { query } from '../config/database.js'

export interface AuthRequest extends Request {
  userId?: string
  workspaceId?: string
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  const secret = process.env.JWT_SECRET
  if (!secret) {
    console.error('JWT_SECRET is not configured')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  jwt.verify(token, secret, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' })
    }

    const userId = (decoded as any).userId
    const workspaceId = (decoded as any).workspaceId

    try {
      const result = await query(
        'SELECT last_activity_at FROM users WHERE id = $1',
        [userId]
      )

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'User not found' })
      }

      const lastActivity = result.rows[0].last_activity_at
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      if (lastActivity && new Date(lastActivity) < thirtyDaysAgo) {
        return res
          .status(401)
          .json({ error: 'Session expired due to inactivity' })
      }

      await query('UPDATE users SET last_activity_at = NOW() WHERE id = $1', [
        userId,
      ])

      req.userId = userId
      req.workspaceId = workspaceId
      next()
    } catch (error) {
      console.error('Auth middleware error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  })
}

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  userId?: string
  workspaceId?: string
}

export const authenticateToken = (
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

  jwt.verify(
    token,
    secret,
    (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' })
      }

      req.userId = (decoded as any).userId
      req.workspaceId = (decoded as any).workspaceId
      next()
    }
  )
}

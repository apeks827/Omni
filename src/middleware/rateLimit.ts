import { Request, Response, NextFunction } from 'express'
import { AuthRequest } from './auth.js'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

export const clearRateLimitStore = (): void => {
  for (const key in store) {
    delete store[key]
  }
}

export const rateLimit = (options: {
  windowMs: number
  max: number
  message?: string
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.header('x-forwarded-for') || 'default'
    const now = Date.now()

    if (!store[key] || now > store[key].resetTime) {
      store[key] = {
        count: 1,
        resetTime: now + options.windowMs,
      }
      return next()
    }

    store[key].count++

    if (store[key].count > options.max) {
      return res.status(429).json({
        error: options.message || 'Too many requests, please try again later.',
      })
    }

    next()
  }
}

export const userRateLimit = (options: {
  windowMs: number
  max: number
  message?: string
}) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.userId || req.ip || 'default'
    const now = Date.now()

    if (!store[userId] || now > store[userId].resetTime) {
      store[userId] = {
        count: 1,
        resetTime: now + options.windowMs,
      }
      return next()
    }

    store[userId].count++

    if (store[userId].count > options.max) {
      return res.status(429).json({
        error: options.message || 'Too many requests, please try again later.',
      })
    }

    next()
  }
}

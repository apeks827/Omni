import { Request, Response, NextFunction } from 'express'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

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

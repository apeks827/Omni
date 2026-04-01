import { Request, Response, NextFunction } from 'express'
import { cacheService } from '../services/cache/CacheService.js'
import { AuthRequest } from './auth.js'
import crypto from 'crypto'

interface CacheOptions {
  ttl: number
  keyPrefix?: string
  varyBy?: (req: AuthRequest) => string
}

export function cacheMiddleware(options: CacheOptions) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next()
    }

    const workspaceId = req.workspaceId || 'anonymous'
    const queryHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(req.query))
      .digest('hex')
      .substring(0, 16)

    const varyPart = options.varyBy ? options.varyBy(req) : ''
    const prefix = options.keyPrefix || req.path
    const cacheKey = `${prefix}:${queryHash}:${workspaceId}:${varyPart}`

    const cached = cacheService.get<any>(cacheKey)

    if (cached) {
      res.setHeader('X-Cache', 'HIT')
      res.setHeader('X-Cache-Key', cacheKey)
      return res.json(cached)
    }

    res.setHeader('X-Cache', 'MISS')
    res.setHeader('X-Cache-Key', cacheKey)

    const originalJson = res.json.bind(res)
    res.json = function (body: any) {
      if (res.statusCode === 200) {
        cacheService.set(cacheKey, body, options.ttl)
      }
      return originalJson(body)
    }

    next()
  }
}

export function invalidateCache(pattern: string) {
  return cacheService.invalidatePattern(pattern)
}

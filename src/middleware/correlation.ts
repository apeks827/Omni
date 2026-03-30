import { Request, Response, NextFunction } from 'express'
import {
  generateCorrelationId,
  createChildLogger,
  runWithContext,
} from '../utils/logger.js'

export interface RequestContext {
  correlationId: string
  requestId: string
  logger: ReturnType<typeof createChildLogger>
}

declare global {
  namespace Express {
    interface Request {
      context?: RequestContext
    }
  }
}

export const correlationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const correlationId =
    (req.headers['x-correlation-id'] as string) || generateCorrelationId()
  const requestId =
    (req.headers['x-request-id'] as string) || generateCorrelationId()

  const contextMap = new Map([
    ['correlationId', correlationId],
    ['requestId', requestId],
  ])

  const logger = createChildLogger({
    correlationId,
    requestId,
    method: req.method,
    path: req.path,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  })

  req.context = {
    correlationId,
    requestId,
    logger,
  }

  res.setHeader('X-Correlation-ID', correlationId)
  res.setHeader('X-Request-ID', requestId)

  const startTime = Date.now()

  const originalEnd = res.end
  res.end = function (
    this: Response,
    ...args: Parameters<Response['end']>
  ): ReturnType<Response['end']> {
    const duration = Date.now() - startTime

    const logLevel =
      res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'
    logger[logLevel](
      {
        statusCode: res.statusCode,
        duration,
        contentLength: res.get('content-length'),
      },
      `HTTP ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`
    )

    return originalEnd.apply(this, args)
  } as typeof res.end

  runWithContext(contextMap, () => {
    next()
  })
}

export const getRequestLogger = (req: Request) => {
  return req.context?.logger
}

export const getCorrelationIdFromRequest = (
  req: Request
): string | undefined => {
  return req.context?.correlationId
}

export default correlationMiddleware

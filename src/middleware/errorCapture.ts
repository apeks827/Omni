import { Request, Response, NextFunction } from 'express'
import { randomUUID } from 'crypto'
import { query } from '../config/database.js'
import { AuthRequest } from './auth.js'
import { AppError, ErrorCodes } from '../utils/errors.js'
import { logger } from '../utils/logger.js'

export interface ErrorCaptureRequest extends AuthRequest {
  correlationId?: string
}

export const correlationMiddleware = (
  req: ErrorCaptureRequest,
  res: Response,
  next: NextFunction
) => {
  const correlationId =
    (req.headers['x-correlation-id'] as string) || randomUUID()
  req.correlationId = correlationId
  res.setHeader('X-Correlation-ID', correlationId)
  next()
}

export const captureError = async (
  layer: 'frontend' | 'backend' | 'orchestration',
  errorType: string,
  message: string,
  options: {
    correlationId: string
    stackTrace?: string
    context?: Record<string, any>
    userId?: string
    taskId?: string
    severity?: 'critical' | 'error' | 'warning' | 'info'
  }
) => {
  try {
    await query(
      `INSERT INTO error_events 
       (correlation_id, layer, error_type, message, stack_trace, context, user_id, task_id, severity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        options.correlationId,
        layer,
        errorType,
        message,
        options.stackTrace || null,
        options.context ? JSON.stringify(options.context) : null,
        options.userId || null,
        options.taskId || null,
        options.severity || 'error',
      ]
    )
  } catch (err) {
    console.error('Failed to capture error event:', err)
  }
}

export const errorHandler = async (
  err: Error,
  req: ErrorCaptureRequest,
  res: Response,
  next: NextFunction
) => {
  const correlationId = req.correlationId || randomUUID()

  if (err instanceof AppError) {
    await captureError('backend', err.code, err.message, {
      correlationId,
      stackTrace: err.stack,
      context: {
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body,
        details: err.details,
      },
      userId: req.userId,
      severity: err.statusCode >= 500 ? 'error' : 'warning',
    })

    return res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      details: err.details,
      correlationId,
    })
  }

  logger.error({ error: err, correlationId }, 'Unhandled error')

  await captureError('backend', err.name || 'UnknownError', err.message, {
    correlationId,
    stackTrace: err.stack,
    context: {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
    },
    userId: req.userId,
    severity: 'error',
  })

  res.status(500).json({
    code: ErrorCodes.INTERNAL_ERROR,
    message: 'Internal server error',
    correlationId,
  })
}

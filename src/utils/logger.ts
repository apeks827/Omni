import pino from 'pino'
import { AsyncLocalStorage } from 'async_hooks'

const asyncLocalStorage = new AsyncLocalStorage<Map<string, string>>()

const logLevel =
  process.env.LOG_LEVEL ||
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

const baseLogger = pino({
  level: logLevel,
  formatters: {
    level: label => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(process.env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
})

export const logger = baseLogger

export const createChildLogger = (bindings: Record<string, unknown>) => {
  return baseLogger.child(bindings)
}

export const getCorrelationContext = (): Map<string, string> | undefined => {
  return asyncLocalStorage.getStore()
}

export const getCorrelationId = (): string | undefined => {
  const store = asyncLocalStorage.getStore()
  return store?.get('correlationId')
}

export const getRequestId = (): string | undefined => {
  const store = asyncLocalStorage.getStore()
  return store?.get('requestId')
}

export const runWithContext = <T>(
  context: Map<string, string>,
  fn: () => T
): T => {
  return asyncLocalStorage.run(context, fn)
}

export const generateCorrelationId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

export const createRequestLogger = (req: {
  headers: Record<string, unknown>
}) => {
  const correlationId =
    (req.headers['x-correlation-id'] as string) || generateCorrelationId()
  const requestId =
    (req.headers['x-request-id'] as string) || generateCorrelationId()

  const context = new Map([
    ['correlationId', correlationId],
    ['requestId', requestId],
  ])

  return {
    correlationId,
    requestId,
    context,
    logger: baseLogger.child({
      correlationId,
      requestId,
    }),
  }
}

export const getLogContext = (): Record<string, string> => {
  const store = asyncLocalStorage.getStore()
  if (!store) return {}

  return Object.fromEntries(store)
}

export default logger

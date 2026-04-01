import { logger } from './logger.js'

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    }
  }
}

export const ErrorCodes = {
  TASK_NOT_FOUND: 'task_not_found',
  PROJECT_NOT_FOUND: 'project_not_found',
  USER_NOT_FOUND: 'user_not_found',
  LABEL_NOT_FOUND: 'label_not_found',
  GOAL_NOT_FOUND: 'goal_not_found',
  KEY_RESULT_NOT_FOUND: 'key_result_not_found',
  WORKSPACE_NOT_FOUND: 'workspace_not_found',
  NOT_FOUND: 'not_found',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  INVALID_INPUT: 'invalid_input',
  DUPLICATE_ENTRY: 'duplicate_entry',
  INTERNAL_ERROR: 'internal_error',
  INVALID_CREDENTIALS: 'invalid_credentials',
  TOKEN_EXPIRED: 'token_expired',
  TOKEN_INVALID: 'token_invalid',
  VALIDATION_ERROR: 'validation_error',
  CONFLICT: 'conflict',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  DATABASE_ERROR: 'database_error',
  SERVICE_UNAVAILABLE: 'service_unavailable',
  // Platform Integration Errors
  PLATFORM_ASSIGNEE_AGENT_ID_ERROR: 'platform_assignee_agent_id_error',
  PLATFORM_EXECUTION_LOCK_ERROR: 'platform_execution_lock_error',
  PLATFORM_API_ERROR: 'platform_api_error',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

export const NotFoundError = (resource: string, id?: string) =>
  new AppError(
    ErrorCodes.NOT_FOUND,
    `${resource}${id ? ` with id ${id}` : ''} not found`,
    { resource, id },
    404
  )

export const UnauthorizedError = (message = 'Authentication required') =>
  new AppError(ErrorCodes.UNAUTHORIZED, message, {}, 401)

export const ForbiddenError = (message = 'Access denied') =>
  new AppError(ErrorCodes.FORBIDDEN, message, {}, 403)

export const ValidationError = (details: Record<string, unknown>) =>
  new AppError(ErrorCodes.VALIDATION_ERROR, 'Validation failed', details, 400)

export const ConflictError = (
  message: string,
  details?: Record<string, unknown>
) => new AppError(ErrorCodes.CONFLICT, message, details, 409)

export const DatabaseError = (message = 'Database operation failed') =>
  new AppError(ErrorCodes.DATABASE_ERROR, message, {}, 500)

export const PlatformAssigneeAgentIdError = (
  details?: Record<string, unknown>
) =>
  new AppError(
    ErrorCodes.PLATFORM_ASSIGNEE_AGENT_ID_ERROR,
    'Platform API error: assigneeAgentId field causes 500 error',
    details,
    500
  )

export const PlatformExecutionLockError = (details?: Record<string, unknown>) =>
  new AppError(
    ErrorCodes.PLATFORM_EXECUTION_LOCK_ERROR,
    'Platform API error: execution lock conflict prevents task update',
    details,
    500
  )

export const PlatformApiError = (
  message: string,
  details?: Record<string, unknown>
) =>
  new AppError(
    ErrorCodes.PLATFORM_API_ERROR,
    `Platform API error: ${message}`,
    details,
    500
  )

export function handleError(
  error: unknown,
  defaultMessage = 'Internal server error'
) {
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      body: error.toJSON(),
    }
  }

  logger.error({ error }, 'Unhandled error')

  return {
    status: 500,
    body: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: defaultMessage,
      details: {},
    },
  }
}

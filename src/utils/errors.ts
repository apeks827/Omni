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
  WORKSPACE_NOT_FOUND: 'workspace_not_found',
  NOT_FOUND: 'not_found',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  INVALID_INPUT: 'invalid_input',
  DUPLICATE_ENTRY: 'duplicate_entry',
  INTERNAL_ERROR: 'internal_error',
  INVALID_CREDENTIALS: 'invalid_credentials',
  TOKEN_EXPIRED: 'token_expired',
  VALIDATION_ERROR: 'validation_error',
} as const

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

  console.error('Unhandled error:', error)

  return {
    status: 500,
    body: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: defaultMessage,
      details: {},
    },
  }
}

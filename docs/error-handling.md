# API Error Handling

## Overview

Standardized error handling across all API routes using AppError class and centralized error middleware.

## Error Response Format

All API errors return a consistent JSON structure:

```json
{
  "code": "error_code",
  "message": "Human-readable error message",
  "details": {},
  "correlationId": "uuid-for-tracking"
}
```

## HTTP Status Codes

| Status | Usage                                                    |
| ------ | -------------------------------------------------------- |
| 400    | Bad Request - Invalid input, validation errors           |
| 401    | Unauthorized - Authentication required or failed         |
| 403    | Forbidden - Authenticated but not authorized             |
| 404    | Not Found - Resource doesn't exist                       |
| 409    | Conflict - Resource conflict (duplicate, state mismatch) |
| 429    | Too Many Requests - Rate limit exceeded                  |
| 500    | Internal Server Error - Unexpected server errors         |
| 503    | Service Unavailable - External service down              |

## Error Codes

### Authentication & Authorization

- `unauthorized` (401) - Authentication required
- `invalid_credentials` (401) - Wrong username/password
- `token_expired` (401) - JWT token expired
- `token_invalid` (401) - JWT token malformed
- `forbidden` (403) - Access denied

### Validation

- `validation_error` (400) - Input validation failed
- `invalid_input` (400) - Generic invalid input

### Resource Errors

- `task_not_found` (404)
- `project_not_found` (404)
- `user_not_found` (404)
- `label_not_found` (404)
- `goal_not_found` (404)
- `key_result_not_found` (404)
- `workspace_not_found` (404)
- `not_found` (404) - Generic not found

### Conflict Errors

- `conflict` (409) - Generic conflict
- `duplicate_entry` (409) - Resource already exists

### System Errors

- `internal_error` (500) - Unexpected server error
- `database_error` (500) - Database operation failed
- `service_unavailable` (503) - External service unavailable
- `rate_limit_exceeded` (429) - Too many requests

## Usage in Routes

### Throwing Errors

Use helper functions from `src/utils/errors.ts`:

```typescript
import {
  NotFoundError,
  ValidationError,
  UnauthorizedError,
} from '../utils/errors.js'

// Not found
if (!task) {
  throw NotFoundError('Task', taskId)
}

// Validation error
if (!req.body.title) {
  throw ValidationError({ title: 'Title is required' })
}

// Unauthorized
if (!req.userId) {
  throw UnauthorizedError()
}
```

### Async Route Handlers

Express error middleware automatically catches errors thrown in async handlers:

```typescript
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const task = await taskService.getTask(req.params.id, req.workspaceId)

  if (!task) {
    throw NotFoundError('Task', req.params.id)
  }

  res.json(task)
})
```

### Custom AppError

For specific cases, create custom AppError instances:

```typescript
import { AppError, ErrorCodes } from '../utils/errors.js'

throw new AppError(
  ErrorCodes.CONFLICT,
  'Task is already assigned',
  { taskId, assigneeId },
  409
)
```

## Error Middleware

The error handler in `src/middleware/errorCapture.ts`:

1. Catches all thrown errors
2. Logs errors with correlation ID
3. Stores errors in `error_events` table
4. Returns standardized JSON response
5. Includes correlation ID for tracking

## Correlation IDs

Every request gets a correlation ID for tracking:

- Auto-generated if not provided
- Returned in `X-Correlation-ID` header
- Included in error responses
- Logged with all errors
- Stored in error_events table

## Migration Guide

### Before (Inconsistent)

```typescript
router.get('/:id', async (req, res) => {
  try {
    const task = await getTask(req.params.id)
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }
    res.json(task)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
```

### After (Standardized)

```typescript
import { NotFoundError } from '../utils/errors.js'

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const task = await taskService.getTask(req.params.id, req.workspaceId)

  if (!task) {
    throw NotFoundError('Task', req.params.id)
  }

  res.json(task)
})
```

## Benefits

1. **Consistency** - All errors follow same format
2. **Traceability** - Correlation IDs track requests
3. **Debugging** - Errors logged and stored in database
4. **Client-friendly** - Structured error codes for UI handling
5. **Maintainability** - Centralized error logic
6. **Type safety** - TypeScript error types

## Testing

Mock error scenarios:

```typescript
import { NotFoundError } from '../utils/errors.js'

it('should return 404 when task not found', async () => {
  jest.spyOn(taskService, 'getTask').mockResolvedValue(null)

  const response = await request(app).get('/api/tasks/123').expect(404)

  expect(response.body.code).toBe('not_found')
  expect(response.body.correlationId).toBeDefined()
})
```

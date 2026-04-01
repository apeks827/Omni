# API Endpoints Documentation

## Overview

Complete reference for all Omni task manager API endpoints with expected latency targets.

## Authentication

All endpoints require authentication via JWT token (except `/api/auth/*`).

**Header**: `Authorization: Bearer <token>`

## Endpoints

### Authentication

#### POST /api/auth/register

Create new user account.

**Target Latency**: <300ms (avg), <500ms (p99)

**Request**:

```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "User Name"
}
```

**Response**: `201 Created`

```json
{
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

#### POST /api/auth/login

Authenticate user and get token.

**Target Latency**: <300ms (avg), <500ms (p99)

**Request**:

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response**: `200 OK`

```json
{
  "token": "jwt-token",
  "user": { "id": "uuid", "email": "...", "name": "..." }
}
```

### Tasks

#### GET /api/tasks

List tasks with optional filters.

**Target Latency**: <50ms (avg), <100ms (p99)

**Query Parameters**:

- `status`: Filter by status (todo, in_progress, done)
- `priority`: Filter by priority (low, medium, high, critical)
- `project_id`: Filter by project UUID
- `label_id`: Filter by label UUID
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)

**Response**: `200 OK`

```json
{
  "tasks": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

#### GET /api/tasks/:id

Get single task by ID.

**Target Latency**: <100ms (avg), <200ms (p99)

**Response**: `200 OK`

```json
{
  "id": "uuid",
  "title": "Task title",
  "description": "Task description",
  "status": "todo",
  "priority": "medium",
  "project_id": "uuid",
  "assignee_id": "uuid",
  "creator_id": "uuid",
  "due_date": "2026-04-01T00:00:00Z",
  "created_at": "2026-03-30T12:00:00Z",
  "updated_at": "2026-03-30T12:00:00Z"
}
```

#### POST /api/tasks

Create new task.

**Target Latency**: <200ms (avg), <400ms (p99)

**Request**:

```json
{
  "title": "New task",
  "description": "Task description",
  "status": "todo",
  "priority": "medium",
  "project_id": "uuid",
  "assignee_id": "uuid",
  "due_date": "2026-04-01T00:00:00Z"
}
```

**Response**: `201 Created`

#### PATCH /api/tasks/:id

Update existing task.

**Target Latency**: <150ms (avg), <300ms (p99)

**Request**: Partial task object

**Response**: `200 OK`

#### DELETE /api/tasks/:id

Delete task.

**Target Latency**: <100ms (avg), <200ms (p99)

**Response**: `204 No Content`

### Projects

#### GET /api/projects

List all projects.

**Target Latency**: <50ms (avg), <100ms (p99)

**Response**: `200 OK`

```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "Project name",
      "description": "Project description",
      "created_at": "2026-03-30T12:00:00Z"
    }
  ]
}
```

#### POST /api/projects

Create new project.

**Target Latency**: <150ms (avg), <300ms (p99)

#### PATCH /api/projects/:id

Update project.

**Target Latency**: <150ms (avg), <300ms (p99)

#### DELETE /api/projects/:id

Delete project.

**Target Latency**: <100ms (avg), <200ms (p99)

### Goals

#### GET /api/goals

List all goals.

**Target Latency**: <50ms (avg), <100ms (p99)

#### POST /api/goals

Create new goal.

**Target Latency**: <150ms (avg), <300ms (p99)

#### PATCH /api/goals/:id

Update goal.

**Target Latency**: <150ms (avg), <300ms (p99)

### Labels

#### GET /api/labels

List all labels.

**Target Latency**: <50ms (avg), <100ms (p99)

#### POST /api/labels

Create new label.

**Target Latency**: <100ms (avg), <200ms (p99)

### Health & Metrics

#### GET /api/health

Health check endpoint.

**Target Latency**: <10ms (avg), <50ms (p99)

**Response**: `200 OK`

```json
{
  "status": "ok",
  "timestamp": "2026-03-30T12:00:00Z"
}
```

#### GET /api/metrics

Prometheus metrics endpoint.

**Target Latency**: <50ms (avg), <100ms (p99)

## Error Responses

All endpoints may return:

- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

**Error Format**:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

## Rate Limiting

- **Default**: 100 requests per minute per user
- **Auth endpoints**: 10 requests per minute per IP
- **Bulk operations**: 10 requests per minute per user

## Caching

See [caching-strategy.md](./caching-strategy.md) for cache behavior and headers.

## References

- [performance-benchmarks.md](./performance-benchmarks.md)
- [performance-sla.md](./performance-sla.md)
- [OMN-657: API Performance: Benchmarks & Documentation](/OMN/issues/OMN-657)

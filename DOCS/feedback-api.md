# Feedback API Documentation

## Overview

Backend API for capturing user feedback submissions for product improvement.

## Endpoints

### POST /api/feedback

Submit user feedback.

**Request Body (FormData)**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| category | string | Yes | One of: `bug`, `confusion`, `feature_request` |
| description | string | Yes | Feedback description (max 5000 chars) |
| severity | string | No | One of: `low`, `medium`, `high` (default: `medium`) |
| repro_steps | string | No | Steps to reproduce (for bugs) |
| page | string | No | Page/surface where feedback was submitted |
| session_id | string | No | Session identifier |
| app_version | string | No | App version |
| environment | JSON | No | Device/browser/OS metadata |
| contact_permission | boolean | No | User allows contact |
| screenshot | File | No | Screenshot attachment |

**Response (201)**:

```json
{
  "success": true,
  "feedbackId": "uuid",
  "message": "Feedback submitted successfully"
}
```

**Error Response (400)**:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Category is required"
}
```

### GET /api/feedback

List feedback with optional filters.

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| severity | string | Filter by severity |
| status | string | Filter by status |
| start_date | ISO date | Filter from date |
| end_date | ISO date | Filter to date |
| limit | number | Results per page (default: 50) |
| offset | number | Pagination offset |

**Response (200)**:

```json
{
  "data": [
    {
      "id": "uuid",
      "workspace_id": "uuid",
      "user_id": "uuid",
      "category": "bug",
      "description": "...",
      "severity": "high",
      "repro_steps": "...",
      "page": "/tasks",
      "app_version": "1.0.0",
      "environment": { "browser": "Chrome", "os": "MacOS" },
      "screenshot_url": null,
      "contact_permission": false,
      "status": "pending",
      "reviewed_by": null,
      "reviewed_at": null,
      "reviewer_notes": null,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 50
}
```

### GET /api/feedback/:id

Get single feedback by ID.

**Response (200)**:

```json
{
  "id": "uuid",
  "workspace_id": "uuid",
  "category": "bug",
  ...
}
```

### PATCH /api/feedback/:id/status

Update feedback status for triage.

**Request Body**:

```json
{
  "status": "reviewed",
  "reviewer_notes": "Looking into this"
}
```

**Valid Statuses**: `pending`, `reviewed`, `resolved`, `dismissed`

**Response (200)**: Updated feedback object.

## Frontend Integration

Use the `FeedbackApiClient` from `client/src/services/feedbackApi.ts`:

```typescript
import { FeedbackApiClient } from '../services/feedbackApi'

const api = FeedbackApiClient.getInstance()

await api.submitFeedback({
  category: 'bug',
  description: 'Found an issue with task creation',
  severity: 'high',
  reproSteps: '1. Go to tasks\n2. Click create\n3. See error',
  page: window.location.pathname,
  sessionId: sessionStorage.getItem('sessionId'),
  appVersion: import.meta.env.VITE_APP_VERSION,
  environment: {
    browser: navigator.userAgent,
    os: navigator.platform,
  },
})
```

## Database Schema

Table: `user_feedback`

- `id` UUID PRIMARY KEY
- `workspace_id` UUID REFERENCES workspaces
- `user_id` UUID REFERENCES users
- `category` VARCHAR (bug/confusion/feature_request)
- `description` TEXT
- `severity` VARCHAR (low/medium/high)
- `repro_steps` TEXT
- `page` VARCHAR
- `app_version` VARCHAR
- `environment` JSONB
- `screenshot_url` VARCHAR
- `contact_permission` BOOLEAN
- `status` VARCHAR (pending/reviewed/resolved/dismissed)
- `reviewed_by` UUID
- `reviewed_at` TIMESTAMP
- `reviewer_notes` TEXT
- `created_at` TIMESTAMP
- `updated_at` TIMESTAMP

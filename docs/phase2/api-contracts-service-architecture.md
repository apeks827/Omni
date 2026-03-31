# Phase 2 Backend: API Contracts & Service Architecture

**Status:** Draft v1  
**Owner:** Backend Engineer  
**Related:** [OMN-751](/OMN/issues/OMN-751) | [OMN-46](/OMN/issues/OMN-46) | [OMN-30](/OMN/issues/OMN-30)

## Context

Phase 1 established core CRUD APIs, layered architecture, and foundational services (auth, scheduling, NLP). Phase 2 extends the platform with collaboration, event sourcing, and advanced notification/webhook capabilities. This document defines the API contracts and service architecture for those Phase 2 capabilities.

**Dependencies:**

- OMN-597 (Goal/OKR tables) — coordinate with Database Engineer
- OMN-63 (Phase 1 API patterns) — follow existing conventions
- Existing `src/domains/` layered services — extend patterns

**Assumptions:**

- Workspace-isolated multi-tenant model (per Phase 1)
- REST API with JSON; future GraphQL migration path
- Auth via JWT bearer tokens (existing middleware)
- Events stored in Postgres via existing activity models

---

## 1. API Contract Spec

### 1.1 Task Relationships

Task relationships model parent/child hierarchies and task dependencies.

#### Endpoints

| Method   | Path                                      | Description                      |
| -------- | ----------------------------------------- | -------------------------------- |
| `GET`    | `/api/tasks/:taskId/relationships`        | Get all relationships for a task |
| `POST`   | `/api/tasks/:taskId/relationships`        | Create a relationship            |
| `DELETE` | `/api/tasks/:taskId/relationships/:relId` | Remove a relationship            |
| `GET`    | `/api/tasks/:taskId/subtasks`             | Get child tasks (read-only view) |
| `GET`    | `/api/tasks/:taskId/dependencies`         | Get blocked-by / blocking tasks  |
| `PATCH`  | `/api/tasks/:taskId/relationships/:relId` | Update relationship metadata     |

#### Relationship Types

```typescript
type TaskRelationshipType =
  | 'parent_child' // Hierarchical decomposition
  | 'blocks' // This task blocks another
  | 'blocked_by' // This task is blocked by another
  | 'related' // General relation
  | 'depends_on' // Must complete before another
```

#### Data Models

**Request: Create relationship**

```json
{
  "target_task_id": "uuid",
  "relationship_type": "blocks",
  "metadata": {
    "description": "Must finish design spec before implementation",
    "urgency": "high"
  }
}
```

**Response: TaskRelationship**

```json
{
  "id": "uuid",
  "source_task_id": "uuid",
  "target_task_id": "uuid",
  "relationship_type": "blocks",
  "metadata": {},
  "created_by": "uuid",
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

**Response: Task with relationships (extended)**

```json
{
  "id": "uuid",
  "title": "string",
  "parent_id": "uuid | null",
  "relationships": {
    "subtasks": ["uuid"],
    "blocked_by": ["uuid"],
    "blocking": ["uuid"],
    "related": ["uuid"],
    "depends_on": ["uuid"]
  }
}
```

#### Behavior

- Creating a `blocks` relationship automatically adds the target to the source's `blocked_by` view
- Circular dependency detection: if `A blocks B` and `B blocks A` is detected, reject with 409
- Workspace isolation: target_task_id must belong to the same workspace as source
- Cascade: deleting a parent task leaves subtasks orphaned (parent_id set to null), does not delete children

---

### 1.2 User Collaboration & Permissions

Collaboration enables sharing tasks with team members and controlling access.

#### Endpoints

| Method   | Path                                        | Description                               |
| -------- | ------------------------------------------- | ----------------------------------------- |
| `POST`   | `/api/tasks/:taskId/share`                  | Share task with user or team              |
| `GET`    | `/api/tasks/:taskId/shared-with`            | List users/teams with access              |
| `DELETE` | `/api/tasks/:taskId/share/:shareId`         | Revoke access                             |
| `POST`   | `/api/tasks/:taskId/access-request`         | Request access to a task                  |
| `GET`    | `/api/tasks/:taskId/access-requests`        | List pending access requests (owner only) |
| `PATCH`  | `/api/tasks/:taskId/access-requests/:reqId` | Approve/reject access request             |
| `GET`    | `/api/tasks/:taskId/access-policy`          | Get current access policy                 |
| `PATCH`  | `/api/tasks/:taskId/access-policy`          | Update access policy                      |

#### Share Modes

```typescript
type ShareMode = 'view' | 'comment' | 'edit' | 'admin'
type ShareTarget =
  | { type: 'user'; user_id: string }
  | { type: 'team'; team_id: string }
```

#### Data Models

**Request: Share task**

```json
{
  "target": { "type": "user", "user_id": "uuid" },
  "share_mode": "edit",
  "notify": true,
  "message": "Can you review this before Friday?"
}
```

**Response: TaskAccess**

```json
{
  "id": "uuid",
  "task_id": "uuid",
  "access_type": "user",
  "access_id": "uuid",
  "share_mode": "edit",
  "granted_by": "uuid",
  "granted_at": "ISO8601",
  "expires_at": "ISO8601 | null"
}
```

**Request: Access policy**

```json
{
  "default_access": "private",
  "inherit_from_project": true,
  "allowed_share_modes": ["view", "comment", "edit"],
  "require_approval_for_edit": false
}
```

#### Behavior

- Task creator has implicit `admin` access (cannot be revoked)
- Workspace members with `admin` role can access tasks by default
- Access requests are async: creator receives a notification; they approve/reject
- Sharing a task with edit access does NOT reassign the task (assignee_id unchanged)
- Delegation via `TaskAssignment.response` flow (pending → accepted/declined) remains separate

---

### 1.3 Notifications & Webhooks

Notifications surface in-app events; webhooks push events to external systems.

#### In-App Notifications

| Method   | Path                             | Description                         |
| -------- | -------------------------------- | ----------------------------------- |
| `GET`    | `/api/notifications`             | List user notifications (paginated) |
| `PATCH`  | `/api/notifications/:id/read`    | Mark notification as read           |
| `PATCH`  | `/api/notifications/read-all`    | Mark all as read                    |
| `DELETE` | `/api/notifications/:id`         | Dismiss notification                |
| `GET`    | `/api/notifications/preferences` | Get notification preferences        |
| `PATCH`  | `/api/notifications/preferences` | Update preferences                  |
| `POST`   | `/api/notifications/snooze/:id`  | Snooze notification                 |

#### Webhooks

| Method   | Path                           | Description             |
| -------- | ------------------------------ | ----------------------- |
| `GET`    | `/api/webhooks`                | List workspace webhooks |
| `POST`   | `/api/webhooks`                | Register a webhook      |
| `PATCH`  | `/api/webhooks/:id`            | Update webhook          |
| `DELETE` | `/api/webhooks/:id`            | Delete webhook          |
| `POST`   | `/api/webhooks/:id/test`       | Send test payload       |
| `GET`    | `/api/webhooks/:id/deliveries` | List delivery attempts  |

#### Webhook Payload Format

```typescript
interface WebhookPayload {
  id: string
  timestamp: string
  event: WebhookEventType
  workspace_id: string
  actor_id: string
  target: {
    type: 'task' | 'project' | 'goal'
    id: string
  }
  data: Record<string, unknown>
  delivery_id: string
}

type WebhookEventType =
  | 'task.created'
  | 'task.updated'
  | 'task.deleted'
  | 'task.completed'
  | 'task.assigned'
  | 'task.shared'
  | 'task.commented'
  | 'goal.created'
  | 'goal.updated'
  | 'goal.completed'
  | 'habit.logged'
  | 'routine.triggered'
```

#### Webhook Configuration

```json
{
  "url": "https://example.com/webhooks/omni",
  "events": ["task.created", "task.completed", "task.assigned"],
  "secret": "whsec_...",
  "active": true,
  "retry_policy": {
    "max_attempts": 3,
    "backoff": "exponential"
  }
}
```

#### Behavior

- Webhooks delivered with HMAC-SHA256 signature in `X-Omni-Signature` header
- Delivery logs stored for 30 days
- Failed deliveries retry with exponential backoff (1m, 5m, 30m)
- Notification preferences: per-type flags for `in_app`, `email`, `push`

---

### 1.4 Analytics & Events

Event log for activity feed, audit trails, and analytics dashboards.

#### Endpoints

| Method | Path                          | Description                                  |
| ------ | ----------------------------- | -------------------------------------------- |
| `GET`  | `/api/activities`             | List activity events (paginated, filterable) |
| `GET`  | `/api/activities/:id`         | Get single event                             |
| `GET`  | `/api/analytics/summary`      | Aggregated workspace analytics               |
| `GET`  | `/api/analytics/productivity` | Productivity metrics                         |
| `GET`  | `/api/analytics/tasks`        | Task completion analytics                    |
| `GET`  | `/api/activities/export`      | Export activity log (CSV/JSON)               |

#### Activity Event Model

```typescript
interface ActivityEvent {
  id: string
  workspace_id: string
  user_id: string
  event_type: ActivityEventType
  entity_type: 'task' | 'project' | 'goal' | 'habit' | 'routine' | 'comment'
  entity_id: string
  action: ActionType // 'created' | 'updated' | 'deleted' | 'completed' | 'shared' | ...
  field_changes?: FieldChange[]
  previous_value?: unknown
  new_value?: unknown
  metadata?: Record<string, unknown>
  source: SourceType // 'ui' | 'api' | 'scheduler' | 'webhook' | 'habit_trigger'
  parent_entity_type?: EntityType
  parent_entity_id?: string
  related_entity_type?: EntityType
  related_entity_id?: string
  created_at: string
}

interface FieldChange {
  field: string
  display_name: string
  previous_value: unknown
  new_value: unknown
}
```

#### Analytics Response

```json
{
  "period": { "from": "ISO8601", "to": "ISO8601" },
  "summary": {
    "tasks_completed": 47,
    "tasks_created": 62,
    "tasks_overdue": 5,
    "average_completion_time_minutes": 180,
    "on_time_rate": 0.89,
    "streak_days": 12
  },
  "by_project": [
    { "project_id": "uuid", "name": "Backend", "completed": 23, "created": 30 }
  ],
  "by_priority": {
    "critical": { "completed": 5, "avg_time": 60 },
    "high": { "completed": 18, "avg_time": 120 },
    "medium": { "completed": 20, "avg_time": 240 },
    "low": { "completed": 4, "avg_time": 480 }
  }
}
```

#### Behavior

- Activity events are immutable audit records
- Filterable by entity_type, user_id, event_type, date range
- Export: streaming response for large datasets; format param: `?format=csv|json`
- Analytics computed from activity event log (no separate aggregation tables unless needed for perf)

---

## 2. Service Architecture

### 2.1 Service Map

```
┌─────────────────────────────────────────────────────────────┐
│                     Router Layer (src/routes/)              │
│  tasks.ts | projects.ts | notifications.ts | activities.ts  │
│  webhooks.ts | collaboration.ts | analytics.ts              │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                  Service Layer (src/domains/)                │
│                                                              │
│  TaskRelationshipService   CollaborationService             │
│  NotificationService       WebhookService                    │
│  ActivityService           AnalyticsService                  │
│  (extends existing: IntentService, SchedulingEngine, etc.)  │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                Repository Layer (src/domains/*/repositories/) │
│  TaskRelationshipRepository | WebhookRepository              │
│  NotificationRepository     | ActivityRepository              │
│  CollaborationRepository     | AnalyticsRepository            │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 New Services

#### TaskRelationshipService (`src/domains/tasks/services/TaskRelationshipService.ts`)

```typescript
class TaskRelationshipService {
  constructor(
    private taskRelRepo: TaskRelationshipRepository,
    private taskRepo: TaskRepository
  ) {}

  async getRelationships(
    taskId: string,
    workspaceId: string
  ): Promise<TaskRelationship[]>
  async createRelationship(
    data: CreateRelationshipInput,
    workspaceId: string
  ): Promise<TaskRelationship>
  async updateRelationship(
    relId: string,
    workspaceId: string,
    updates: UpdateRelationshipInput
  ): Promise<TaskRelationship>
  async deleteRelationship(relId: string, workspaceId: string): Promise<void>
  async getSubtasks(parentId: string, workspaceId: string): Promise<Task[]>
  async getDependencies(
    taskId: string,
    workspaceId: string
  ): Promise<Dependencies>
  async detectCircularDependency(
    sourceId: string,
    targetId: string
  ): Promise<boolean>
}
```

#### CollaborationService (`src/domains/collaboration/services/CollaborationService.ts`)

```typescript
class CollaborationService {
  constructor(
    private collabRepo: CollaborationRepository,
    private taskRepo: TaskRepository,
    private notificationService: NotificationService
  ) {}

  async shareTask(
    taskId: string,
    data: ShareTaskInput,
    actorId: string
  ): Promise<TaskAccess>
  async revokeAccess(accessId: string, actorId: string): Promise<void>
  async getAccessList(taskId: string): Promise<TaskAccess[]>
  async requestAccess(
    taskId: string,
    userId: string,
    message?: string
  ): Promise<AccessRequest>
  async approveAccessRequest(
    requestId: string,
    approverId: string
  ): Promise<TaskAccess>
  async rejectAccessRequest(
    requestId: string,
    approverId: string
  ): Promise<void>
  async getAccessPolicy(taskId: string): Promise<AccessPolicy>
  async updateAccessPolicy(
    taskId: string,
    policy: AccessPolicy,
    actorId: string
  ): Promise<AccessPolicy>
  async canAccess(
    taskId: string,
    userId: string,
    requiredMode: ShareMode
  ): Promise<boolean>
}
```

#### WebhookService (`src/services/webhooks/WebhookService.ts`)

```typescript
class WebhookService {
  constructor(
    private webhookRepo: WebhookRepository,
    private deliveryRepo: WebhookDeliveryRepository,
    private httpClient: HttpClient
  ) {}

  async registerWebhook(
    workspaceId: string,
    config: WebhookConfig
  ): Promise<Webhook>
  async updateWebhook(
    webhookId: string,
    updates: Partial<WebhookConfig>
  ): Promise<Webhook>
  async deleteWebhook(webhookId: string): Promise<void>
  async listWebhooks(workspaceId: string): Promise<Webhook[]>
  async listDeliveries(
    webhookId: string,
    limit?: number
  ): Promise<WebhookDelivery[]>
  async emitEvent(payload: WebhookPayload): Promise<void>
  async deliverWebhook(
    webhook: Webhook,
    payload: WebhookPayload
  ): Promise<DeliveryResult>
  async retryFailedDeliveries(): Promise<void>
}
```

#### AnalyticsService (`src/services/analytics/AnalyticsService.ts`)

```typescript
class AnalyticsService {
  constructor(
    private activityRepo: ActivityRepository,
    private taskRepo: TaskRepository
  ) {}

  async getActivityLog(
    filters: ActivityFilters,
    workspaceId: string
  ): Promise<PaginatedResult<ActivityEvent>>
  async getSummaryAnalytics(
    period: DateRange,
    workspaceId: string
  ): Promise<AnalyticsSummary>
  async getProductivityMetrics(
    userId: string,
    period: DateRange
  ): Promise<ProductivityMetrics>
  async getTaskAnalytics(
    projectId: string | null,
    period: DateRange,
    workspaceId: string
  ): Promise<TaskAnalytics>
  async exportActivityLog(
    filters: ActivityFilters,
    format: 'csv' | 'json',
    workspaceId: string
  ): Promise<Stream>
}
```

### 2.3 Extension of Existing Services

| Existing Service      | Phase 2 Extension                                                    |
| --------------------- | -------------------------------------------------------------------- |
| `TaskService`         | Add `getWithRelationships()`, `updateWithRelationshipTracking()`     |
| `NotificationService` | Extend to support webhook-triggered events; add snooze support       |
| `ActivityService`     | Add event sourcing for relationship changes and collaboration events |
| `IntentService`       | Already Phase 2 — coordinate for relationship inference              |

---

## 3. Data Models & Schema Changes

### 3.1 New Tables

#### task_relationships

```sql
CREATE TABLE task_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  target_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPMZ DEFAULT NOW(),
  UNIQUE(source_task_id, target_task_id, relationship_type),
  CHECK (relationship_type IN ('parent_child', 'blocks', 'blocked_by', 'related', 'depends_on')),
  CHECK (source_task_id != target_task_id)
);

CREATE INDEX idx_task_relationships_source ON task_relationships(source_task_id);
CREATE INDEX idx_task_relationships_target ON task_relationships(target_task_id);
CREATE INDEX idx_task_relationships_type ON task_relationships(relationship_type);
```

#### task_access

```sql
CREATE TABLE task_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  access_type VARCHAR(20) NOT NULL,
  access_id UUID NOT NULL,
  share_mode VARCHAR(20) NOT NULL DEFAULT 'view',
  granted_by UUID NOT NULL REFERENCES users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (access_type IN ('user', 'team')),
  CHECK (share_mode IN ('view', 'comment', 'edit', 'admin'))
);

CREATE INDEX idx_task_access_task ON task_access(task_id);
CREATE INDEX idx_task_access_lookup ON task_access(access_type, access_id);
```

#### access_requests

```sql
CREATE TABLE access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES users(id),
  requested_mode VARCHAR(20) NOT NULL,
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX idx_access_requests_task ON access_requests(task_id, status);
```

#### webhooks

```sql
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  url VARCHAR(2048) NOT NULL,
  events TEXT[] NOT NULL,
  secret VARCHAR(255),
  active BOOLEAN DEFAULT true,
  retry_policy JSONB DEFAULT '{"max_attempts": 3, "backoff": "exponential"}',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhooks_workspace ON webhooks(workspace_id, active);
```

#### webhook_deliveries

```sql
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_id UUID NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  attempt_number INTEGER DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  next_retry_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (status IN ('pending', 'success', 'failed', 'retrying'))
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id, created_at DESC);
CREATE INDEX idx_webhook_deliveries_pending ON webhook_deliveries(status, next_retry_at) WHERE status = 'retrying';
```

### 3.2 Schema Extension: Existing Tables

#### tasks table extension

Add nullable `goal_id` column (already planned in OMN-700):

```sql
ALTER TABLE tasks ADD COLUMN goal_id UUID REFERENCES goals(id) ON DELETE SET NULL;
CREATE INDEX idx_tasks_goal ON tasks(goal_id) WHERE goal_id IS NOT NULL;
```

#### activity_events table (already exists)

Already supports entity_type, action, field_changes. Ensure new Phase 2 events are covered by existing enum:

```typescript
// Extend shared/types/activity.ts
type ActivityEventType =
  | 'task.created'
  | 'task.updated'
  | 'task.deleted'
  | 'task.completed'
  | 'task.assigned'
  | 'task.shared'
  | 'task.access_changed'
  | 'task.relationship_added'
  | 'task.relationship_removed'
  | 'goal.created'
  | 'goal.updated'
  | 'goal.completed'
  | 'habit.logged'
  | 'routine.triggered'
  | 'webhook.delivery_succeeded'
  | 'webhook.delivery_failed'
```

---

## 4. Implementation Sequence

### Step 1: Foundation (parallel safe)

- Create `task_relationships` table + repository
- Create `task_access` + `access_requests` tables + repository
- Add `TaskRelationshipService`
- Add `CollaborationService`

### Step 2: Notifications & Webhooks (depends on Step 1)

- Create `webhooks` + `webhook_deliveries` tables + repositories
- Add `WebhookService` with retry logic
- Extend `NotificationService` with webhook event emission
- Add webhook delivery scheduler (cron or queue)

### Step 3: Analytics & Events (depends on Step 2)

- Extend `ActivityEvent` types for Phase 2 events
- Add `AnalyticsService` with aggregation queries
- Add activity export endpoint
- Performance: consider materialized views for heavy analytics if needed

### Step 4: Integration & Testing

- Wire services into routes (follow layered architecture pattern)
- Add unit tests for all new services
- Add integration tests for circular dependency detection, access control
- Update OpenAPI spec (docs/openapi.yaml)

---

## 5. Open Questions

1. **Circular dependency limit depth?** How many levels of `blocks` chain before we call it circular?
2. **Webhook retry queue:** Use Postgres-based queue (existing pattern) or external queue?
3. **Analytics materialized views:** Pre-aggregate daily/weekly, or compute on-demand?
4. **Collaboration vs delegation:** TaskAssignment (delegation with response) and TaskAccess (sharing) are separate. Should they unify?
5. **External calendar integration for webhooks?** If yes, event types needed?

---

## 6. Alignment with Existing Architecture

- **Layered pattern:** All new code follows Router → Service → Repository pattern per `docs/layered-architecture.md`
- **Error handling:** Use existing `AppError` / `ErrorCodes` from `src/utils/errors.ts`
- **Validation:** Use existing middleware in `src/middleware/`; add schemas to `src/validation/schemas.ts`
- **Testing:** Follow existing patterns in `src/tests/`; all services need unit tests
- **Auth:** Existing `authenticateToken` middleware; add workspace-scoped access checks in services

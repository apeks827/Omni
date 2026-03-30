# Activity Feed System - Technical Specification

## Overview

The Activity Feed system provides a comprehensive audit trail of all changes to tasks, projects, and related entities. It enables users to view task history, track changes over time, and understand who made what changes when.

## Data Model

### ActivityEvent (new table)

```typescript
interface ActivityEvent {
  id: string // UUID
  workspace_id: string // FK to workspaces.id
  user_id: string // FK to users.id (actor)

  // Event classification
  event_type: ActivityEventType
  entity_type: EntityType
  entity_id: string // ID of the affected entity

  // Change details
  action:
    | 'create'
    | 'update'
    | 'delete'
    | 'restore'
    | 'archive'
    | 'assign'
    | 'complete'
    | 'comment'
    | 'attach'
    | 'move'
    | 'merge'
    | 'split'
  field_changes?: FieldChange[] // For update events
  previous_value?: any // For single-field changes
  new_value?: any

  // Context
  metadata?: Record<string, any> // Flexible metadata
  source: 'client' | 'api' | 'import' | 'webhook' | 'automation' | 'agent'

  // References
  parent_entity_type?: EntityType // For subtasks, comments, etc.
  parent_entity_id?: string
  related_entity_type?: EntityType // Related task, project, etc.
  related_entity_id?: string

  // Timestamps
  created_at: Date
}

type ActivityEventType =
  | 'task.created'
  | 'task.updated'
  | 'task.deleted'
  | 'task.restored'
  | 'task.archived'
  | 'task.assigned'
  | 'task.completed'
  | 'task.uncompleted'
  | 'task.blocked'
  | 'task.unblocked'
  | 'task.moved'
  | 'task.merged'
  | 'task.split'
  | 'comment.added'
  | 'comment.updated'
  | 'comment.deleted'
  | 'attachment.added'
  | 'attachment.removed'
  | 'project.created'
  | 'project.updated'
  | 'project.deleted'
  | 'label.added'
  | 'label.removed'
  | 'time_entry.added'
  | 'time_entry.removed'
  | 'automation.triggered'
  | 'automation.disabled'
  | 'agent.executed'
  | 'agent.failed'

type EntityType =
  | 'task'
  | 'project'
  | 'comment'
  | 'attachment'
  | 'label'
  | 'time_entry'
  | 'automation'
  | 'agent_run'

interface FieldChange {
  field: string
  old_value: any
  new_value: any
  display_name?: string // Human-readable field name
}
```

### ActivityFeed (cached aggregation)

```typescript
interface ActivityFeed {
  id: string
  workspace_id: string
  user_id?: string // For personal feeds
  entity_type?: EntityType // For entity-specific feeds
  entity_id?: string

  // Feed configuration
  filter_types?: ActivityEventType[]
  filter_users?: string[]
  filter_actions?: string[]

  // Caching
  last_fetched_at: Date
  cache_key: string
}
```

### Updates to Existing Models

Add to Task interface:

```typescript
interface Task {
  // ... existing fields ...
  activity_count: number // Cached count of activity events
  last_activity_at: Date // Most recent activity
}
```

## Change Tracking Mechanisms

### Application-Level Tracking (Primary)

Change capture at the service layer for maximum control and context:

```typescript
// Example: TaskService.ts
class TaskService {
  async updateTask(id: string, updates: Partial<Task>, userId: string) {
    const task = await this.getTask(id)
    const previousState = { ...task }

    // Apply updates
    const updated = await this.repo.update(id, updates)

    // Generate field-level diff
    const fieldChanges = this.diffGenerator.generate(previousState, updated)

    // Create activity event
    await this.activityService.log({
      event_type: 'task.updated',
      entity_type: 'task',
      entity_id: id,
      action: 'update',
      field_changes: fieldChanges,
      user_id: userId,
      workspace_id: task.workspace_id,
    })

    return updated
  }
}
```

### Trigger-Based Tracking (Fallback/Integrity)

PostgreSQL triggers for guaranteed capture even if application logic fails:

```sql
-- Example: Task status change trigger
CREATE OR REPLACE FUNCTION log_task_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO activity_events (
      id, workspace_id, user_id, event_type, entity_type, entity_id,
      action, field_changes, created_at
    ) VALUES (
      gen_random_uuid(),
      NEW.workspace_id,
      NEW.checked_out_by,
      'task.' || NEW.status,
      'task',
      NEW.id,
      'update',
      jsonb_build_array(
        jsonb_build_object(
          'field', 'status',
          'old_value', OLD.status,
          'new_value', NEW.status
        )
      ),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_status_change_trigger
AFTER UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION log_task_status_change();
```

### Event Types and Tracked Fields

| Event Type          | Tracked Fields                                                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| task.created        | All initial fields                                                                                                   |
| task.updated        | title, description, status, priority, due_date, assignee_id, project_id, blocked, blocked_reason, estimated_duration |
| task.completed      | completed_at, status                                                                                                 |
| task.assigned       | assignee_id (old → new)                                                                                              |
| task.blocked        | blocked, blocked_reason                                                                                              |
| task.moved          | project_id, parent_id                                                                                                |
| project.updated     | name, description                                                                                                    |
| comment.added       | Full comment content                                                                                                 |
| label.added/removed | label_id                                                                                                             |

## Diff Generation

### Field-Level Diff Algorithm

```typescript
// services/DiffGenerator.ts
class DiffGenerator {
  private readonly trackedFields = new Set([
    'title',
    'description',
    'status',
    'priority',
    'due_date',
    'assignee_id',
    'project_id',
    'parent_id',
    'blocked',
    'blocked_reason',
    'estimated_duration',
  ])

  private readonly fieldDisplayNames: Record<string, string> = {
    title: 'Title',
    description: 'Description',
    status: 'Status',
    priority: 'Priority',
    due_date: 'Due Date',
    assignee_id: 'Assignee',
    project_id: 'Project',
    parent_id: 'Parent Task',
    blocked: 'Blocked',
    blocked_reason: 'Block Reason',
    estimated_duration: 'Estimated Duration',
  }

  generate(previous: any, current: any): FieldChange[] {
    const changes: FieldChange[] = []

    for (const field of this.trackedFields) {
      const oldValue = previous[field]
      const newValue = current[field]

      if (!this.isEqual(oldValue, newValue)) {
        changes.push({
          field,
          old_value: this.serialize(oldValue),
          new_value: this.serialize(newValue),
          display_name: this.fieldDisplayNames[field] || field,
        })
      }
    }

    return changes
  }

  private serialize(value: any): any {
    if (value === null || value === undefined) return null
    if (value instanceof Date) return value.toISOString()
    if (typeof value === 'object') return JSON.parse(JSON.stringify(value))
    return value
  }

  private isEqual(a: any, b: any): boolean {
    return (
      JSON.stringify(this.serialize(a)) === JSON.stringify(this.serialize(b))
    )
  }
}
```

### Value Formatting for Display

```typescript
// Formatters for human-readable diff display
const valueFormatters: Record<string, (value: any) => string> = {
  status: v => v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, ' '),
  priority: v => v.charAt(0).toUpperCase() + v.slice(1),
  due_date: v => (v ? new Date(v).toLocaleDateString() : 'Not set'),
  assignee_id: (v, users) => users.get(v)?.name || 'Unassigned',
  project_id: (v, projects) => projects.get(v)?.name || 'No Project',
  blocked: v => (v ? 'Yes' : 'No'),
  estimated_duration: v =>
    v ? `${Math.floor(v / 60)}h ${v % 60}m` : 'Not set',
}
```

## API Contracts

### Activity Events

```
GET    /api/activity                    List activity events (feed)
GET    /api/activity/:id                Get single event
GET    /api/activity/export             Export activity events
GET    /api/tasks/:id/activity          Task-specific activity
GET    /api/projects/:id/activity       Project-specific activity
```

#### GET /api/activity

Query params:

- `entity_type`: Filter by entity type
- `entity_id`: Filter by specific entity
- `event_type`: Filter by event type(s), comma-separated
- `user_id`: Filter by actor
- `action`: Filter by action type
- `start_date`: Filter by date range start
- `end_date`: Filter by date range end
- `limit`: Results per page (default 50, max 200)
- `cursor`: Pagination cursor (base64 encoded)
- `include_metadata`: Include metadata in response (default true)

Response (200):

```json
{
  "events": [
    {
      "id": "uuid",
      "event_type": "task.updated",
      "entity_type": "task",
      "entity_id": "uuid",
      "action": "update",
      "field_changes": [
        {
          "field": "status",
          "old_value": "in_progress",
          "new_value": "completed",
          "display_name": "Status"
        }
      ],
      "user": {
        "id": "uuid",
        "name": "John Doe",
        "avatar_url": "https://..."
      },
      "entity": {
        "id": "uuid",
        "title": "Implement feature",
        "type": "task"
      },
      "metadata": {},
      "source": "client",
      "created_at": "2026-03-30T10:00:00Z"
    }
  ],
  "pagination": {
    "has_more": true,
    "next_cursor": "eyJsYXN0X2lkIjogInV1aWQifQ==",
    "total_count": 150
  }
}
```

#### GET /api/activity/export

Query params: `start_date`, `end_date`, `entity_type`, `format` (csv|json), `include_details` (boolean)

Response (200):

CSV format:

```csv
timestamp,event_type,entity_type,entity_id,entity_title,user_id,user_name,action,field,old_value,new_value
2026-03-30T10:00:00Z,task.updated,task,uuid,"Implement feature",uuid,"John Doe",update,status,in_progress,completed
```

#### GET /api/tasks/:id/activity

Returns activity events for a specific task, including subtask activities.

Response (200):

```json
{
  "events": [...],
  "task": {
    "id": "uuid",
    "title": "Parent Task",
    "activity_count": 15
  },
  "subtasks_activity": [
    {
      "task_id": "uuid",
      "task_title": "Subtask 1",
      "events": [...]
    }
  ],
  "pagination": {...}
}
```

## Aggregation & Feed Views

### Precomputed Aggregations

```typescript
// Periodic aggregation for efficient feed generation
interface ActivityAggregation {
  id: string
  workspace_id: string
  period_start: Date
  period_end: Date
  period_type: 'hour' | 'day' | 'week' | 'month'

  // Counts
  total_events: number
  events_by_type: Record<string, number>
  events_by_user: Record<string, number>
  events_by_entity_type: Record<string, number>

  // Latest for each entity (for "last modified" views)
  latest_by_entity: Record<string, ActivityEventSummary>

  created_at: Date
}

interface ActivityEventSummary {
  id: string
  event_type: string
  user_id: string
  created_at: Date
}
```

### Feed Generation Queries

```sql
-- Activity feed with actor and entity info (optimized)
SELECT
  ae.id,
  ae.event_type,
  ae.entity_type,
  ae.entity_id,
  ae.action,
  ae.field_changes,
  ae.created_at,
  ROW_TO_JSON(u.*) as user,
  ROW_TO_JSON(t.*) as entity
FROM activity_events ae
JOIN users u ON u.id = ae.user_id
LEFT JOIN tasks t ON ae.entity_type = 'task' AND ae.entity_id = t.id
WHERE ae.workspace_id = $1
  AND ae.created_at > $2
  AND ($3::varchar[] IS NULL OR ae.event_type = ANY($3))
ORDER BY ae.created_at DESC
LIMIT $4;

-- Activity by entity with all related changes
SELECT
  ae.*,
  jsonb_agg(
    jsonb_build_object(
      'field', ae2.field,
      'old_value', ae2.old_value,
      'new_value', ae2.new_value
    )
  ) FILTER (WHERE ae2.id IS NOT NULL) as related_changes
FROM activity_events ae
LEFT JOIN LATERAL (
  SELECT * FROM unnest(ae.field_changes) AS t(field, old_value, new_value)
) ae2 ON true
WHERE ae.entity_type = 'task' AND ae.entity_id = $1
GROUP BY ae.id
ORDER BY ae.created_at DESC;
```

### Composite Feeds

For views combining multiple entity types:

```typescript
interface CompositeFeedItem {
  id: string
  event_type: string
  entity_type: string
  entity_id: string
  entity_title: string
  user_id: string
  user_name: string
  user_avatar: string
  created_at: Date
  summary: string // Human-readable summary
  action_verb: string // "completed", "commented on", etc.
}
```

## Filtering & Pagination Strategy

### Cursor-Based Pagination

```typescript
// Cursor format (base64 encoded JSON)
interface ActivityCursor {
  last_id: string
  last_created_at: Date
}

// Response includes cursor for next page
function getNextCursor(events: ActivityEvent[]): string | null {
  if (events.length === 0) return null
  const last = events[events.length - 1]
  return Buffer.from(
    JSON.stringify({
      last_id: last.id,
      last_created_at: last.created_at,
    })
  ).toString('base64')
}
```

### Feed Filtering Options

| Filter      | Type         | Description                       |
| ----------- | ------------ | --------------------------------- |
| event_type  | string[]     | Event types to include            |
| entity_type | string[]     | Entity types to include           |
| entity_id   | string       | Specific entity                   |
| user_id     | string[]     | Filter by actors                  |
| action      | string[]     | Action types                      |
| date_range  | {start, end} | Date filter                       |
| search      | string       | Full-text search in entity titles |

### Feed Types

```typescript
enum FeedType {
  ALL = 'all', // All workspace activity
  TASK = 'task', // Specific task + subtasks
  PROJECT = 'project', // Project and its tasks
  USER = 'user', // User's own activity
  FOLLOWING = 'following', // Only followed items
  TEAM = 'team', // Team member activity
}
```

## Export Functionality

### Export Options

```typescript
interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx'
  date_range?: { start: Date; end: Date }
  entity_types?: EntityType[]
  event_types?: ActivityEventType[]
  include_field_changes: boolean
  include_user_info: boolean
  include_entity_details: boolean
  group_by?: 'entity' | 'user' | 'date' | 'event_type'
}
```

### Export API Endpoints

```
GET    /api/activity/export              Full workspace export
GET    /api/tasks/:id/activity/export   Task + subtasks export
GET    /api/projects/:id/activity/export Project export
```

### Export Query Optimization

```sql
-- Export with streaming for large datasets
CREATE INDEX idx_activity_events_workspace_created
ON activity_events(workspace_id, created_at DESC);

CREATE INDEX idx_activity_events_entity
ON activity_events(entity_type, entity_id);

-- For scheduled exports, use materialized views
CREATE MATERIALIZED VIEW activity_daily_summary AS
SELECT
  DATE(created_at) as date,
  event_type,
  COUNT(*) as count
FROM activity_events
GROUP BY DATE(created_at), event_type;

CREATE UNIQUE INDEX ON activity_daily_summary(date, event_type);
```

## File Structure

```
src/
  domains/
    activity/
      routes/
        activity.ts              # Activity feed endpoints
        activity-export.ts       # Export endpoints
      services/
        ActivityService.ts       # Core activity logic
        ActivityAggregator.ts    # Aggregation logic
        DiffGenerator.ts         # Field diff generation
        FeedBuilder.ts           # Feed construction
      repositories/
        ActivityRepository.ts    # Activity queries
      models/
        ActivityEvent.ts
        ActivityAggregation.ts
      listeners/
        task-listeners.ts        # Task change listeners
        project-listeners.ts    # Project change listeners
shared/
  types/
    activity.ts                  # Shared type definitions
```

## Implementation Notes

### Batch Processing

For high-volume workspaces:

1. Use message queue for async event processing
2. Batch inserts for multiple rapid changes
3. Debounce rapid successive updates to same entity

### Performance Targets

- Feed query: < 200ms for 100 events
- Export (1000 events): < 3s
- Aggregation refresh: < 5s for daily rollups

### Retention Policy

- Activity events: Retain indefinitely (auditable)
- Aggregations: 90 days for hourly, 2 years for daily
- Feed cache: 1 hour TTL

## Dependencies

- PostgreSQL: Activity event storage (existing)
- Redis: Feed caching (existing)
- No new external dependencies required

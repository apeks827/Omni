# Database Schema Documentation

## Overview

Omni uses PostgreSQL as its primary database, following a workspace-isolated multi-tenant design. All tables are designed for the AI-first Personal COO architecture.

## Schema Design Principles

1. **Workspace Isolation**: All user data is scoped to workspaces
2. **Audit Trail**: Status transitions and decisions are logged
3. **Flexible Metadata**: JSONB columns for extensibility
4. **Performance**: Composite indexes for common query patterns

## Core Tables

### users

User accounts with timezone and preferences for contextual experience.

| Column        | Type      | Description      |
| ------------- | --------- | ---------------- |
| id            | UUID      | Primary key      |
| email         | VARCHAR   | Unique email     |
| password_hash | VARCHAR   | Bcrypt hash      |
| name          | VARCHAR   | Display name     |
| timezone      | VARCHAR   | User timezone    |
| preferences   | JSONB     | User preferences |
| created_at    | TIMESTAMP | Creation time    |

### workspaces

Top-level organizational units providing data isolation.

| Column     | Type      | Description    |
| ---------- | --------- | -------------- |
| id         | UUID      | Primary key    |
| name       | VARCHAR   | Workspace name |
| owner_id   | UUID      | Owner user ID  |
| created_at | TIMESTAMP | Creation time  |

### projects

Groupings for related tasks within a workspace.

| Column       | Type      | Description   |
| ------------ | --------- | ------------- |
| id           | UUID      | Primary key   |
| name         | VARCHAR   | Project name  |
| workspace_id | UUID      | Workspace FK  |
| created_at   | TIMESTAMP | Creation time |

### tasks

Core task entity with full scheduling context.

| Column             | Type      | Description                                       |
| ------------------ | --------- | ------------------------------------------------- |
| id                 | UUID      | Primary key                                       |
| title              | VARCHAR   | Task title                                        |
| description        | TEXT      | Task details                                      |
| type               | VARCHAR   | task/habit/routine                                |
| status             | VARCHAR   | pending/scheduled/in_progress/completed/cancelled |
| priority           | VARCHAR   | low/medium/high/critical                          |
| context            | JSONB     | AI context data                                   |
| project_id         | UUID      | Project FK                                        |
| assignee_id        | UUID      | Assigned user                                     |
| creator_id         | UUID      | Created by                                        |
| workspace_id       | UUID      | Workspace FK                                      |
| due_date           | TIMESTAMP | Due date                                          |
| estimated_duration | INTEGER   | Estimated minutes                                 |
| actual_duration    | INTEGER   | Actual minutes                                    |
| completed_at       | TIMESTAMP | Completion time                                   |
| checked_out_at     | TIMESTAMP | Checkout time                                     |
| checked_out_by     | UUID      | Checked out by                                    |
| blocked            | BOOLEAN   | Is blocked                                        |
| blocked_reason     | TEXT      | Block reason                                      |
| parent_id          | UUID      | Parent task                                       |

### labels

Tags for categorizing tasks.

| Column       | Type    | Description  |
| ------------ | ------- | ------------ |
| id           | UUID    | Primary key  |
| name         | VARCHAR | Label name   |
| color        | VARCHAR | Hex color    |
| workspace_id | UUID    | Workspace FK |
| project_id   | UUID    | Project FK   |

### schedule_slots

Scheduled time blocks for tasks.

| Column           | Type      | Description                        |
| ---------------- | --------- | ---------------------------------- |
| id               | UUID      | Primary key                        |
| user_id          | UUID      | User FK                            |
| task_id          | UUID      | Task FK                            |
| start_time       | TIMESTAMP | Slot start                         |
| end_time         | TIMESTAMP | Slot end                           |
| status           | VARCHAR   | scheduled/active/completed/skipped |
| context_snapshot | JSONB     | Context at scheduling              |

### decision_log

Audit trail for AI scheduling decisions.

| Column           | Type    | Description      |
| ---------------- | ------- | ---------------- |
| id               | UUID    | Primary key      |
| user_id          | UUID    | User FK          |
| decision_type    | VARCHAR | Type of decision |
| input_data       | JSONB   | Decision inputs  |
| output_data      | JSONB   | Decision outputs |
| explanation      | TEXT    | Human-readable   |
| confidence_score | NUMERIC | Model confidence |

### user_context

Contextual information tracking.

| Column       | Type      | Description     |
| ------------ | --------- | --------------- |
| id           | UUID      | Primary key     |
| user_id      | UUID      | User FK         |
| context_type | VARCHAR   | Type of context |
| context_data | JSONB     | Context data    |
| recorded_at  | TIMESTAMP | Record time     |

### handoff_templates

Templates for task handoffs.

### handoffs

Task handoff records between agents/users.

### audit_logs

System-wide audit logging.

### custom_fields

Custom field definitions.

### task_custom_field_values

Custom field values per task.

### task_labels

Task-label associations.

### task_status_transitions

Status change audit trail.

### password_reset_tokens

Password reset tokens.

### failed_login_attempts

Login attempt tracking.

### schema_migrations

Migration tracking table.

## Indexes

### Performance Indexes

- `idx_tasks_workspace_id` - Workspace filtering
- `idx_tasks_project_id` - Project filtering
- `idx_tasks_assignee_id` - Assignment lookups
- `idx_tasks_status` - Status filtering
- `idx_tasks_priority` - Priority sorting
- `idx_tasks_due_date` - Due date queries
- `idx_tasks_created_at` - Time-based queries

### Partial Indexes

- `idx_tasks_assignee_status` - Unassigned tasks
- `idx_tasks_blocked` - Blocked tasks only
- `idx_tasks_completed_at` - Completed tasks
- `idx_tasks_parent_id` - Subtasks

### GIN Indexes

- `idx_tasks_metadata` - JSONB metadata queries

## Migrations

Migrations are numbered sequentially (00-99) and run automatically via `npm run migrate`.

To run migrations manually:

```bash
npm run migrate
```

## Connection Pool

Pool settings:

- Max connections: 20
- Idle timeout: 30s
- Connection timeout: 2s
- SSL in production

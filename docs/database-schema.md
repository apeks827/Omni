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

User accounts with timezone and preferences for contextual experience. Each user belongs to exactly one workspace for row-level isolation.

| Column        | Type      | Description             |
| ------------- | --------- | ----------------------- |
| id            | UUID      | Primary key             |
| email         | VARCHAR   | Unique email            |
| password_hash | VARCHAR   | Bcrypt hash             |
| name          | VARCHAR   | Display name            |
| timezone      | VARCHAR   | User timezone           |
| preferences   | JSONB     | User preferences        |
| workspace_id  | UUID      | Workspace FK (NOT NULL) |
| created_at    | TIMESTAMP | Creation time           |

**Constraints:**

- `UNIQUE (email, workspace_id)` - Email unique within workspace
- `FOREIGN KEY (workspace_id) REFERENCES workspaces(id)`

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

Core task entity with full scheduling context. Supports soft delete via `deleted_at`.

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
| deleted_at         | TIMESTAMP | Soft delete timestamp (NULL = active)             |

**Constraints:**

- `CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled'))`
- `CHECK (priority IN ('low', 'medium', 'high', 'critical'))`

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

Templates for task handoffs with structured prompts.

| Column       | Type      | Description             |
| ------------ | --------- | ----------------------- |
| id           | UUID      | Primary key             |
| workspace_id | UUID      | Workspace FK            |
| name         | VARCHAR   | Template name           |
| prompt       | TEXT      | Handoff prompt template |
| created_by   | UUID      | Creator user ID         |
| created_at   | TIMESTAMP | Creation time           |
| updated_at   | TIMESTAMP | Last update time        |

### handoffs

Task handoff records between agents/users.

| Column       | Type      | Description                         |
| ------------ | --------- | ----------------------------------- |
| id           | UUID      | Primary key                         |
| task_id      | UUID      | Task FK                             |
| from_agent   | VARCHAR   | Source agent ID                     |
| to_agent     | VARCHAR   | Target agent ID                     |
| prompt       | TEXT      | Handoff context                     |
| status       | VARCHAR   | pending/accepted/declined/completed |
| created_at   | TIMESTAMP | Creation time                       |
| completed_at | TIMESTAMP | Completion time                     |

### audit_logs

System-wide audit logging for compliance.

| Column       | Type      | Description                        |
| ------------ | --------- | ---------------------------------- |
| id           | UUID      | Primary key                        |
| workspace_id | UUID      | Workspace FK                       |
| user_id      | UUID      | Acting user                        |
| action       | VARCHAR   | Action type (create/update/delete) |
| entity_type  | VARCHAR   | Entity type                        |
| entity_id    | UUID      | Entity ID                          |
| old_data     | JSONB     | Previous state                     |
| new_data     | JSONB     | New state                          |
| ip_address   | VARCHAR   | Client IP                          |
| created_at   | TIMESTAMP | Timestamp                          |

### custom_fields

Custom field definitions per workspace.

| Column       | Type      | Description                     |
| ------------ | --------- | ------------------------------- |
| id           | UUID      | Primary key                     |
| workspace_id | UUID      | Workspace FK                    |
| name         | VARCHAR   | Field name                      |
| field_type   | VARCHAR   | text/number/date/boolean/select |
| options      | JSONB     | Options for select type         |
| required     | BOOLEAN   | Is required                     |
| created_at   | TIMESTAMP | Creation time                   |

### task_custom_field_values

Custom field values per task.

| Column          | Type      | Description      |
| --------------- | --------- | ---------------- |
| id              | UUID      | Primary key      |
| task_id         | UUID      | Task FK          |
| custom_field_id | UUID      | Custom field FK  |
| value           | TEXT      | Field value      |
| created_at      | TIMESTAMP | Creation time    |
| updated_at      | TIMESTAMP | Last update time |

**Constraints:**

- `UNIQUE (task_id, custom_field_id)`

### task_labels

Task-label associations.

| Column   | Type | Description |
| -------- | ---- | ----------- |
| task_id  | UUID | Task FK     |
| label_id | UUID | Label FK    |

**Constraints:**

- `PRIMARY KEY (task_id, label_id)`

### task_status_transitions

Status change audit trail with transition rules.

| Column      | Type      | Description          |
| ----------- | --------- | -------------------- |
| id          | UUID      | Primary key          |
| task_id     | UUID      | Task FK              |
| from_status | VARCHAR   | Previous status      |
| to_status   | VARCHAR   | New status           |
| changed_by  | UUID      | User who made change |
| reason      | TEXT      | Reason for change    |
| created_at  | TIMESTAMP | Transition time      |

### password_reset_tokens

Password reset tokens for auth flow.

| Column     | Type      | Description         |
| ---------- | --------- | ------------------- |
| id         | UUID      | Primary key         |
| user_id    | UUID      | User FK             |
| token_hash | VARCHAR   | Hashed reset token  |
| expires_at | TIMESTAMP | Expiration time     |
| used_at    | TIMESTAMP | When token was used |
| created_at | TIMESTAMP | Creation time       |

### failed_login_attempts

Login attempt tracking for brute-force protection.

| Column     | Type      | Description        |
| ---------- | --------- | ------------------ |
| id         | UUID      | Primary key        |
| user_id    | UUID      | User FK (nullable) |
| email      | VARCHAR   | Attempted email    |
| ip_address | VARCHAR   | Client IP          |
| user_agent | VARCHAR   | Client user agent  |
| success    | BOOLEAN   | Login success      |
| created_at | TIMESTAMP | Attempt time       |

**Constraints:**

- Index on `(email, created_at)` for rate limiting queries
- Index on `(ip_address, created_at)` for IP blocking

### schema_migrations

Migration tracking table with rollback support.

| Column         | Type      | Description                       |
| -------------- | --------- | --------------------------------- |
| id             | SERIAL    | Primary key                       |
| version        | VARCHAR   | Migration filename (unique)       |
| applied_at     | TIMESTAMP | When applied                      |
| rolled_back_at | TIMESTAMP | When rolled back (NULL if active) |

## Indexes

### Performance Indexes

```sql
CREATE INDEX idx_tasks_workspace_id ON tasks(workspace_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
```

### Partial Indexes

```sql
CREATE INDEX idx_tasks_unassigned ON tasks(id) WHERE assignee_id IS NULL;
CREATE INDEX idx_tasks_blocked ON tasks(id) WHERE blocked = true;
CREATE INDEX idx_tasks_completed ON tasks(completed_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_parent ON tasks(parent_id) WHERE parent_id IS NOT NULL;
```

### GIN Indexes

```sql
CREATE INDEX idx_tasks_context ON tasks USING GIN (context);
```

**Note:** GIN index targets `context` JSONB column for efficient AI context queries.

## Migrations

Migrations are numbered sequentially (00-99) and run automatically via `npm run migrate`.

### Running Migrations

```bash
# Apply all pending migrations
npm run migrate

# Rollback last migration
npm run migrate rollback

# Rollback specific migration
npm run migrate rollback 06_create_tasks_table.sql

# Check migration status
npm run migrate status
```

### Creating Migrations

1. Create forward migration: `migrations/XX_description.sql`
2. Create rollback migration: `migrations/XX_description.rollback.sql`
3. Use sequential numbering (00, 01, 02...)
4. Include rollback support for all schema changes

### Migration Best Practices

- Always wrap DDL in transactions (handled automatically by migrate script)
- Test rollback scripts before deploying
- Add indexes with `IF NOT EXISTS` for idempotency
- Use `CHECK` constraints for enum-like columns
- Add table/column comments for documentation

## Connection Pool

Pool settings for horizontal scaling:

- Max connections per instance: 20
- Idle timeout: 30s
- Connection timeout: 2s
- SSL in production

**Horizontal Scaling Strategy:**

- Use PgBouncer or similar connection pooler for multi-instance deployments
- Each API server instance maintains its own pool of 20 connections
- Connection pooler manages total database connections across all instances
- Recommended: PgBouncer in transaction mode for stateless API servers

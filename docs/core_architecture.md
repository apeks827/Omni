# Core Architecture: Task Manager

## Overview

This document defines the core architecture for the task manager system, outlining the data models, API contracts, and architectural principles that will guide the implementation.

## Architecture Principles

1. **Performance First**: All core operations must meet strict latency requirements (<100ms for task creation, <50ms for search)
2. **Scalability**: Architecture must support growth from single-user to multi-tenant platform
3. **Reliability**: System must maintain 99.9% uptime with robust error handling
4. **Security**: Privacy by design with secure authentication and authorization
5. **Extensibility**: Modular design allowing new features without breaking changes

## Data Model

### Task Entity

```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL DEFAULT 'task' CHECK (type IN ('task', 'habit', 'routine')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    context JSONB,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_duration INTEGER,
    actual_duration INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Project Entity

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### User Entity

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    workspace_id UUID NOT NULL,
    timezone VARCHAR(50),
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Workspace Entity

```sql
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Contract

### Task Operations

#### GET /api/tasks

Retrieve tasks with filtering and pagination

- Query parameters: status, priority, project_id, limit, offset
- Authentication: Required
- Response: Array of Task objects

#### GET /api/tasks/:id

Retrieve a specific task

- Authentication: Required (workspace isolation)
- Response: Single Task object

#### POST /api/tasks

Create a new task

- Body: { title, description?, type?, status?, priority?, project_id?, assignee_id?, due_date?, context? }
- Authentication: Required
- Response: Created Task object

#### PUT /api/tasks/:id

Update an existing task

- Body: { title?, description?, type?, status?, priority?, project_id?, assignee_id?, due_date?, context? }
- Authentication: Required (workspace isolation)
- Response: Updated Task object

#### DELETE /api/tasks/:id

Delete a task

- Authentication: Required (workspace isolation)
- Response: 204 No Content

## Performance Requirements

- Task creation: <100ms p95 latency
- Task retrieval: <50ms p95 latency
- Task search/filtering: <50ms p95 latency
- 99.9% uptime requirement
- Support for 10k+ tasks per user

## Security Considerations

- All endpoints require authentication via JWT
- Workspace-based isolation to prevent cross-user data access
- Input validation and sanitization
- Rate limiting to prevent abuse
- Proper SQL injection prevention through parameterized queries

## Deployment Architecture

- PostgreSQL database with connection pooling
- Node.js/Express API server with horizontal scaling capability
- Reverse proxy/load balancer for traffic distribution
- Redis for caching and session storage (future enhancement)
- CDN for static assets (future enhancement)

## Future Extensibility Points

- Labels/Tags system for enhanced categorization
- Subtasks for hierarchical task organization
- Activity logging for audit trails
- Notification system for task updates
- Integration with external calendar systems
- AI-powered task suggestions and prioritization
- Agent execution runtime for autonomous workflows
- Real-time WebSocket communication for live updates
- Paperclip integration for task management workflow

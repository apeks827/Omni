# Core Architecture: Omni Task Manager

**Last Updated**: 2026-03-30  
**Status**: Implemented

## Overview

This document defines the core architecture for Omni, an AI-first personal operating system. The system has evolved significantly with layered architecture, goal-tracking, energy management, and autonomous agent capabilities.

## Architecture Principles

1. **Performance First**: All core operations must meet strict latency requirements (<100ms for task creation, <50ms for search)
2. **Scalability**: Architecture must support growth from single-user to multi-tenant platform
3. **Reliability**: System must maintain 99.9% uptime with robust error handling
4. **Security**: Privacy by design with secure authentication and authorization
5. **Extensibility**: Modular design allowing new features without breaking changes
6. **AI-First**: Built from the ground up for intelligent automation and decision-making
7. **Layered Architecture**: Clean separation via Router → Service → Repository pattern

## Implemented Domain Structure

```
src/
├── routes/              # HTTP layer (zero SQL)
│   ├── tasks.ts, projects.ts, labels.ts
│   ├── goals.ts, key_results.ts, task_goal_links.ts
│   ├── calendar.ts, schedule.ts, energy.ts
│   ├── comments.ts, activities.ts
│   ├── auth.ts, quota.ts, errors.ts
│   └── handoff.ts, escalation.ts, metrics.ts
├── domains/             # Business domains (layered)
│   ├── tasks/           # services + repositories
│   ├── projects/
│   ├── labels/
│   ├── goals/           # OKR tracking
│   ├── calendar/        # External calendar sync
│   ├── schedule/        # Intelligent scheduling
│   ├── energy/           # Energy pattern learning
│   ├── comments/
│   ├── activities/
│   ├── auth/
│   ├── quota/           # Rate limiting
│   └── errors/
├── middleware/          # Auth, validation, rate limiting
├── models/              # TypeScript interfaces
└── utils/               # Shared utilities
```

## Data Model (Implemented)

See [docs/database-schema.md](docs/database-schema.md) for complete schema.

### Core Entities

| Entity                | Purpose              | Key Fields                                                 |
| --------------------- | -------------------- | ---------------------------------------------------------- |
| users                 | User accounts        | email, password_hash, timezone, preferences                |
| workspaces            | Data isolation       | id, name, owner_id                                         |
| projects              | Task grouping        | id, name, workspace_id                                     |
| tasks                 | Core unit            | type (task/habit/routine), status, priority, context JSONB |
| labels                | Task categorization  | name, color, workspace_id                                  |
| goals                 | OKR tracking         | title, level (company/team/personal)                       |
| key_results           | Goal metrics         | title, metric_type, target_value                           |
| task_goal_links       | Task-to-goal mapping | task_id, goal_id                                           |
| activities            | Audit trail          | entity_type, action, metadata                              |
| comments              | Task discussions     | task_id, content, author_id                                |
| schedule_slots        | Time allocation      | task_id, start_time, end_time                              |
| energy_levels         | Energy tracking      | date, hour, level                                          |
| daily_energy_patterns | Energy patterns      | day_of_week, hour, avg_energy                              |

### AI/Context Fields

```sql
-- Tasks include AI context
context JSONB,           -- AI-extracted context
ai_priority FLOAT,       -- AI-calculated priority
ai_suggested_time JSONB, -- AI-suggested scheduling
energy_level VARCHAR,    -- Required energy (low/medium/high)
focus_area VARCHAR,      -- Category for focus tracking
```

## API Structure

### Core Routes (Implemented)

| Route              | Purpose             | Domain     |
| ------------------ | ------------------- | ---------- |
| `/api/tasks`       | CRUD + search       | tasks      |
| `/api/projects`    | Project management  | projects   |
| `/api/labels`      | Label management    | labels     |
| `/api/goals`       | OKR tracking        | goals      |
| `/api/key-results` | Goal metrics        | goals      |
| `/api/calendar`    | External sync       | calendar   |
| `/api/schedule`    | Schedule generation | schedule   |
| `/api/energy`      | Energy patterns     | energy     |
| `/api/comments`    | Task discussions    | comments   |
| `/api/activities`  | Audit trail         | activity   |
| `/api/auth`        | Authentication      | auth       |
| `/api/quota`       | Rate limiting       | quota      |
| `/api/handoff`     | Agent handoffs      | handoff    |
| `/api/escalation`  | Escalation handling | escalation |
| `/api/metrics`     | Performance metrics | metrics    |

### WebSocket Events

- `task.updated` - Real-time task changes
- `schedule.changed` - Schedule updates
- `context.changed` - Context changes

## Performance Requirements

- Task creation: <100ms p95 latency
- Task retrieval: <50ms p95 latency
- Task search/filtering: <50ms p95 latency
- 99.9% uptime requirement
- Support for 10k+ tasks per user

## Security Implementation

- JWT authentication with refresh tokens
- Workspace-based isolation (all queries scoped)
- Rate limiting per user (quota system)
- Input validation via Zod schemas
- Parameterized queries (SQL injection prevention)

## Deployment

- PostgreSQL with connection pooling
- Node.js/Express API (horizontal scaling capable)
- Docker containerization
- Deploy scripts: `deploy-staging.sh`, `deploy-prod.sh`
- GitHub Actions CI/CD

## Related Documentation

- [docs/database-schema.md](docs/database-schema.md) - Full schema
- [docs/layered-architecture.md](docs/layered-architecture.md) - Layered pattern
- [docs/phase2/architecture_deep_dive.md](docs/phase2/architecture_deep_dive.md) - Phase 2 plans
- [architecture.md](../architecture.md) - Target AI-first architecture

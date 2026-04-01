# Agent Queue System

## Overview

The queue system enables autonomous agent workflow by automatically assigning tasks when agents complete their current work. This eliminates idle time and ensures continuous productivity.

## Architecture

### Components

1. **Queue Service** (`src/services/queue/queue.service.ts`)
   - Task prioritization and routing
   - Competency-based matching
   - Auto-assignment on task completion

2. **Queue API** (`src/routes/queue.ts`)
   - `GET /api/queue/next` - Get next available task
   - `POST /api/queue/claim/:taskId` - Claim a specific task
   - `POST /api/queue/auto-assign` - Auto-assign after completion
   - `GET /api/queue/stats` - Queue statistics

3. **Database Schema** (`migrations/24_add_queue_tracking.sql`)
   - Task metadata for role/competency routing
   - Optimized indexes for queue queries

## Usage

### Auto-Assignment Flow

When an agent completes a task (status → `completed`), the system automatically:

1. Finds the next highest-priority unassigned task
2. Matches based on agent role and capabilities
3. Claims and assigns the task to the agent
4. Updates task status to `in_progress`

### Manual Task Claiming

Agents can manually claim tasks:

```bash
POST /api/queue/claim/:taskId
Authorization: Bearer <token>
```

### Queue Priority

Tasks are ordered by:

1. Priority (critical > high > medium > low)
2. Creation time (oldest first)

### Role-Based Routing

Tasks can specify required roles in metadata:

```json
{
  "metadata": {
    "required_role": "engineer"
  }
}
```

## Integration

The queue system integrates with:

- Task completion flow (automatic next-task assignment)
- Handoff automation (template-based task creation)
- Scheduling system (time-based task allocation)

## Configuration

No additional configuration required. The system activates automatically when:

- Tasks have `assignee_id = NULL`
- Task status is `todo` or `pending`

## Monitoring

Check queue health:

```bash
GET /api/queue/stats
```

Returns:

- Total unassigned tasks
- Tasks by priority
- Tasks by required role

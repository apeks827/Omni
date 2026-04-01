# Time Tracking System - Technical Specification

## Overview

Time tracking enables users to track actual time spent on tasks, with support for manual entries, active timers, and Pomodoro sessions. This system persists timer state across browser refreshes and provides analytics for productivity insights.

## Data Model

### TimeEntry (new table)

```typescript
interface TimeEntry {
  id: string // UUID
  task_id: string // FK to tasks.id
  workspace_id: string // FK to workspaces.id
  user_id: string // FK to users.id (timer owner)

  // Timing
  start_time: Date // When timer started (or entry began)
  end_time?: Date // When timer stopped (null if running)
  duration_seconds: number // Total duration in seconds

  // Classification
  type: 'manual' | 'timer' | 'pomodoro'
  pomodoro_type?: 'work' | 'break' | 'long_break' // For pomodoro sessions

  // Metadata
  description?: string // Optional notes for manual entries
  source: 'client' | 'api' | 'import'

  // Timestamps
  created_at: Date
  updated_at: Date
}
```

### TimerSession (Redis/in-memory state)

```typescript
interface TimerSession {
  id: string
  task_id: string
  user_id: string
  workspace_id: string

  start_time: Date
  paused_at?: Date // When paused (null if running)
  accumulated_seconds: number // Time before current pause

  status: 'running' | 'paused' | 'stopped'

  // Pomodoro state
  pomodoro_type: 'work' | 'break' | 'long_break'
  pomodoro_work_count: number // Work sessions completed in current cycle

  created_at: Date
  updated_at: Date
}
```

### Updates to Task Model

Add to Task interface:

```typescript
interface Task {
  // ... existing fields ...
  total_time_tracked: number // Accumulated seconds from all time entries
  pomodoro_settings?: {
    enabled: boolean
    work_duration: number // seconds, default 25*60
    break_duration: number // seconds, default 5*60
    long_break_duration: number // seconds, default 15*60
    sessions_before_long_break: number // default 4
  }
}
```

## API Contracts

### Time Entries

```
POST   /api/time-entries              Create time entry
GET    /api/time-entries              List time entries (with filters)
GET    /api/time-entries/:id          Get single entry
PATCH  /api/time-entries/:id          Update entry
DELETE /api/time-entries/:id          Delete entry
```

#### POST /api/time-entries

Request:

```json
{
  "task_id": "uuid",
  "start_time": "2026-03-30T10:00:00Z",
  "end_time": "2026-03-30T11:30:00Z",
  "duration_seconds": 5400,
  "type": "manual",
  "description": "Initial implementation"
}
```

Response (201):

```json
{
  "id": "uuid",
  "task_id": "uuid",
  "start_time": "2026-03-30T10:00:00Z",
  "end_time": "2026-03-30T11:30:00Z",
  "duration_seconds": 5400,
  "type": "manual",
  "description": "Initial implementation",
  "created_at": "2026-03-30T11:30:00Z"
}
```

#### GET /api/time-entries

Query params: `task_id`, `start_date`, `end_date`, `type`, `limit`, `offset`

Response (200):

```json
{
  "entries": [...],
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

### Active Timer

```
POST   /api/timer/start               Start timer for task
POST   /api/timer/pause               Pause active timer
POST   /api/timer/resume              Resume paused timer
POST   /api/timer/stop                Stop timer, create time entry
GET    /api/timer/status              Get current timer state
```

#### POST /api/timer/start

Request:

```json
{
  "task_id": "uuid",
  "pomodoro_type": "work" // optional, for pomodoro mode
}
```

Response (200):

```json
{
  "session_id": "uuid",
  "task_id": "uuid",
  "status": "running",
  "start_time": "2026-03-30T10:00:00Z",
  "elapsed_seconds": 0
}
```

#### POST /api/timer/stop

Request:

```json
{
  "description": "Completed feature implementation"
}
```

Response (200):

```json
{
  "time_entry_id": "uuid",
  "task_id": "uuid",
  "duration_seconds": 1500,
  "start_time": "2026-03-30T10:00:00Z",
  "end_time": "2026-03-30T10:25:00Z"
}
```

### Analytics

```
GET    /api/time-entries/analytics     Get aggregated time data
GET    /api/time-entries/export        Export time data (CSV/JSON)
```

#### GET /api/time-entries/analytics

Query params: `start_date`, `end_date`, `group_by` (task|day|week|project)

Response (200):

```json
{
  "total_seconds": 36000,
  "total_entries": 24,
  "breakdown": [
    {
      "task_id": "uuid",
      "total_seconds": 7200,
      "entry_count": 3
    }
  ],
  "pomodoro_stats": {
    "work_sessions": 8,
    "break_sessions": 8,
    "total_work_seconds": 12000
  }
}
```

#### GET /api/time-entries/export

Query params: `start_date`, `end_date`, `format` (csv|json)

### Pomodoro

```
POST   /api/pomodoro/next              Trigger next pomodoro phase
GET    /api/pomodoro/settings          Get pomodoro settings
PATCH  /api/pomodoro/settings          Update pomodoro settings
```

## State Management

### Server-Side Timer State (Redis)

Timer session stored in Redis for:

- **Persistence**: Survives browser refresh/close
- **Real-time sync**: Multiple clients can see same timer
- **Crash recovery**: Timer can be resumed after disconnect

Key pattern: `timer:{user_id}:{task_id}`

### Client-Side State

```typescript
interface ClientTimerState {
  session_id: string | null
  task_id: string | null
  status: 'idle' | 'running' | 'paused'
  start_time: number | null // Unix ms
  accumulated_seconds: number
  pomodoro_type: 'work' | 'break' | 'long_break'

  // Sync state
  last_synced_at: number
  server_session_id: string | null
}
```

### Background Handling

1. **Page refresh**: Client fetches `/api/timer/status` on load, restores state
2. **Browser close**: Server continues running; client uses `beforeunload` to send final sync
3. **Tab visibility**: Use `visibilitychange` event to sync on tab focus
4. **Network disconnect**: Queue operations locally, sync on reconnect

### Sync Protocol

```
1. Client sends: POST /api/timer/sync { client_state }
2. Server compares with Redis state
3. Server returns: { action: 'resume' | 'stop' | 'conflict', server_state }
4. Client reconciles and updates UI
```

## Aggregation & Analytics

### Time Aggregation Queries

```sql
-- Total time by task (last 30 days)
SELECT task_id, SUM(duration_seconds) as total_seconds
FROM time_entries
WHERE workspace_id = $1 AND start_time >= NOW() - INTERVAL '30 days'
GROUP BY task_id
ORDER BY total_seconds DESC;

-- Daily breakdown
SELECT DATE(start_time) as date, SUM(duration_seconds) as total_seconds
FROM time_entries
WHERE workspace_id = $1 AND start_time >= $2 AND start_time <= $3
GROUP BY DATE(start_time)
ORDER BY date DESC;

-- Pomodoro statistics
SELECT
  COUNT(*) FILTER (WHERE pomodoro_type = 'work') as work_sessions,
  COUNT(*) FILTER (WHERE pomodoro_type = 'break') as break_sessions,
  SUM(duration_seconds) FILTER (WHERE pomodoro_type = 'work') as total_work_seconds
FROM time_entries
WHERE workspace_id = $1 AND type = 'pomodoro';
```

### Export Format (CSV)

```csv
date,task_id,task_title,start_time,end_time,duration_minutes,type,description
2026-03-30,uuid,"Implement feature",10:00,11:30,90,manual,"Core logic"
2026-03-30,uuid,"Implement feature",14:00,14:25,25,pomodoro,""
```

## File Structure

```
src/
  domains/
    time-tracking/
      routes/
        time-entries.ts      # Time entry CRUD
        timer.ts             # Active timer control
        pomodoro.ts          # Pomodoro operations
        analytics.ts         # Analytics & export
      services/
        TimeEntryService.ts
        TimerService.ts
        PomodoroService.ts
        AnalyticsService.ts
      repositories/
        TimeEntryRepository.ts
      models/
        TimeEntry.ts
        TimerSession.ts
shared/
  types/
    time-tracking.ts         # Shared type definitions
```

## Dependencies

- **Redis**: Timer session state (existing infrastructure)
- **PostgreSQL**: Time entry persistence (existing)
- No new external dependencies required

## Performance Targets

- Timer sync latency: < 100ms
- Analytics query: < 500ms for 30-day range
- Export generation: < 5s for 10,000 entries

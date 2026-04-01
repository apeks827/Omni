# Task Assignment Workflow

## Overview

Automated task assignment ensures agents remain productive by matching available tasks to idle agents based on role, capabilities, and workload.

## Workflow

### Trigger Conditions

Task assignment is triggered when:

1. An agent completes a task (worker runs after task completion)
2. A new task is created without an assignee
3. Periodic scan every 30 minutes (cron job)

### Assignment Algorithm

1. **Idle Detection**: Identify agents with status `running` and no `in_progress` tasks
2. **Workload Check**: Ensure agent has < 3 concurrent tasks (IC agents only)
3. **Task Matching**: Find unassigned tasks matching:
   - Priority: high/critical first
   - Role keyword in title
   - Capabilities keyword match
4. **Assignment**: Assign task and trigger agent heartbeat

### Workload Limits

| Agent Type                  | Max Concurrent Tasks |
| --------------------------- | -------------------- |
| IC (Individual Contributor) | 3                    |
| Manager                     | 5                    |
| Specialist                  | 2                    |

### Role Matching

| Role       | Keywords                                                  |
| ---------- | --------------------------------------------------------- |
| Engineer   | backend, frontend, devops, security, api, code, implement |
| Researcher | research, analysis, user, data, metrics                   |
| Designer   | design, ui, ux, interface                                 |
| Manager    | manage, coordinate, plan, roadmap                         |
| General    | any task if no role match                                 |

## Implementation

**Script**: `scripts/task-auto-assign.sh`

### Cron Configuration

```bash
# Run every 5 minutes
*/5 * * * * cd /path/to/Omni && PAPERCLIP_API_KEY=<key> PAPERCLIP_COMPANY_ID=<id> ./scripts/task-auto-assign.sh >> /var/log/task-assign.log 2>&1
```

### Environment Variables

| Variable             | Required | Description                                   |
| -------------------- | -------- | --------------------------------------------- |
| PAPERCLIP_API_KEY    | Yes      | API authentication key                        |
| PAPERCLIP_COMPANY_ID | Yes      | Company identifier                            |
| PAPERCLIP_API_URL    | No       | API endpoint (default: http://localhost:3000) |

## Monitoring

Track these metrics:

- `tasks.auto_assigned`: Count of auto-assignments
- `agents.idle_time`: Time agents spend idle
- `assignment.latency`: Time from task creation to assignment

## Escalation

If no suitable agent found:

1. Log warning with task details
2. Create follow-up task for manual review
3. Alert Triage Engineer via @mention

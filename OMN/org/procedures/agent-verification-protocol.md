# Agent Verification Protocol

## Purpose

Prevent the recurring pattern of tasks being marked "done" without verifying the underlying agent fix was applied. This protocol applies to all tasks that involve fixing agent errors, updating agent configurations, or changing agent instructions.

## Verification Steps for Agent Fix Tasks

When a task involves fixing an agent's error state, configuration, or instructions:

### Step 1: Verify Agent Status

```bash
curl -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  "$PAPERCLIP_API_URL/api/agents/{agentId}"
```

Check response fields:

- `status`: Must be `running` (not `error`)
- `lastHeartbeatAt`: Must be within 5 minutes of current time
- `pauseReason`: Must be `null`

### Step 2: Confirm Heartbeat Active

If status is `running` but `lastHeartbeatAt` is stale:

1. Wait 2-3 minutes for heartbeat cycle
2. Re-check status
3. If still stale, agent may be running but not heartbeat-ing properly

### Step 3: Test Agent Responsiveness

Create a test task and verify:

- Agent picks up the task within 2 heartbeats
- Agent posts a comment acknowledging the task
- Agent transitions task to `in_progress`

### Decision Matrix

| Agent Status | lastHeartbeatAt | Action                                          |
| ------------ | --------------- | ----------------------------------------------- |
| running      | < 5 min         | Mark task done ✓                                |
| running      | > 5 min         | Wait, re-verify                                 |
| error        | any             | DO NOT mark done. Document blocker and escalate |
| paused       | any             | Investigate pause reason                        |

## Escalation Path

If agent verification fails:

1. **Document the failure** in task comment with:
   - Agent ID and name
   - Current status
   - Last heartbeat timestamp
   - Specific error if available

2. **Escalate based on root cause**:
   - Config issue → Founding Engineer
   - Adapter/runtime issue → CEO (requires human intervention)
   - Instructions issue → Update AGENTS.md and retry

## Common Fix Patterns

### Adapter Config Empty

```json
PATCH /api/agents/{agentId}
{
  "adapterConfig": {
    "cwd": "/home/claw/.paperclip/instances/default/projects/c7ecff56-aed4-4103-bb75-af2b584b06a4/a8c3a85f-2c69-45cb-a8e0-7dbb21faf9b9/Omni",
    "model": "omniroute/balanced-load"
  }
}
```

### Instructions Path Missing

```bash
PATCH /api/agents/{agentId}/instructions-path
{
  "path": "agents/{agent-url-key}/instructions/AGENTS.md"
}
```

### Adapter Restart Required

For adapter-level issues, the agent typically needs a restart. Document this and escalate to human operator.

## Related

- Pattern identified in [OMN-718](/OMN/issues/OMN-718)
- Resolution task: [OMN-747](/OMN/issues/OMN-747)

# Agent Fix Verification Protocol

## Purpose

Prevent recurring pattern of tasks marked "done" without verifying underlying fixes. This protocol establishes mandatory verification steps for all agent error-fix tasks.

## Trigger

This protocol applies when a task's goal is to fix an agent that is in `error` state.

## Verification Checklist

Before marking any agent-fix task as "done", complete ALL steps:

### Step 1: API Verification

Call the Paperclip API to verify agent status:

```bash
GET /api/agents/{agentId}
```

Required checks:

- [ ] `status` field equals `"running"` (not `"error"`)
- [ ] `lastHeartbeatAt` is within the last 5 minutes

### Step 2: Functional Verification

If possible, trigger a test action to confirm the agent is responsive:

- Assign a test task and verify the agent picks it up
- Or verify the agent responds to a mention in comments

### Step 3: Documentation

In the task comment, document:

- The API response showing agent status
- Any discrepancies found
- What verification was performed

## Escalation Path

If agent remains in `error` state after fix attempt:

1. **DO NOT mark task as done**
2. Document the failure in task comment
3. Reassign to your manager with specific findings
4. Tag the Founding Engineer for technical escalation

## Template for Agent Fix Task Completion

```
## Verification Results

- Agent ID: {agentId}
- API Check: GET /api/agents/{agentId}
- Status: {running|error}
- Last Heartbeat: {timestamp}
- Functional Test: {passed|skipped|failed}

### Notes
{any additional context}

### Next Steps
{clear next steps if still blocked}
```

## Anti-Patterns (Do NOT do these)

- Marking done before checking agent status API
- Assuming the fix worked without verification
- Closing task if agent is still in error state
- Forgetting to document verification in comments

## Related Documents

- [OMN-718](/OMN/issues/OMN-718) - Pattern documentation for this issue
- [org/task_quality.md](/OMN/org/task_quality.md) - General task quality standards
- [org/proactive_triggers.md](/OMN/org/proactive_triggers.md) - Proactive monitoring triggers

## Owner

Growth Engineer owns this protocol. Updates require Growth Engineer + Founding Engineer approval.

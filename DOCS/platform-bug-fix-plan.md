# Platform Bug Fix Plan

**Owner:** Platform/CEO  
**Created By:** Backend Engineer  
**Date:** 2026-03-31  
**Status:** Action Required

## Executive Summary

Multiple critical platform bugs are blocking task management operations across the Omni project. These issues prevent task closure, agent assignment, and comment posting. This document provides a detailed fix plan for the Platform/CEO team.

## Critical Issues

### 1. API Bug: PATCH assigneeAgentId Returns 500 (OMN-805)

**Issue:** `PATCH /api/issues/{id}` with `assigneeAgentId` field returns 500 Internal Server Error. Adding `comment` field also causes 500.

**Impact:** Cannot assign tasks via API. Blocks triage operations. Affects multiple agents attempting task assignment.

**Workaround:** Underscore format `assignee_agent_id` accepted but does not actually update the field.

**Root Cause:** Likely a type coercion issue or missing field validation in the Paperclip API handler for agent assignment.

**Fix Required:**

1. Validate that `assigneeAgentId` field is properly handled in the issue PATCH endpoint
2. Add proper UUID validation for agent ID fields
3. Ensure comment field is properly serialized before database insert

---

### 2. Platform Bug: Execution Lock Conflict

**Issue:** Tasks OMN-46, OMN-752, OMN-59, OMN-765, OMN-793, OMN-788, OMN-787 cannot be updated via API. `checkoutRunId: null` but `executionRunId` set from direct PATCH without checkout. All PATCH/comment operations fail with "Issue run ownership conflict".

**Impact:** Tasks cannot be closed, comments cannot be posted, agent handoffs cannot be communicated.

**Affected Tasks:**

- OMN-46 (engineering kickoff) - complete but blocked
- OMN-752 (implementation complete) - cannot be marked done
- OMN-765 (Growth Engineer weekly audit) - complete but cannot be closed
- OMN-793 (User Friction Analysis) - research complete but cannot be closed
- OMN-788, OMN-787 (newly created, orphaned executionRunId)

**Root Cause:** Direct PATCH without proper checkout flow leaves orphaned `executionRunId` without matching `checkoutRunId`.

**Fix Required:**

#### Option A: Clear orphaned executionRunId (Recommended for immediate relief)

```sql
UPDATE issues
SET execution_run_id = NULL
WHERE checkout_run_id IS NULL
  AND execution_run_id IS NOT NULL
  AND id IN ('OMN-46-uuid', 'OMN-752-uuid', 'OMN-59-uuid', 'OMN-765-uuid', 'OMN-793-uuid', ...);
```

#### Option B: Set checkoutRunId to match executionRunId (Preserves run history)

```sql
UPDATE issues
SET checkout_run_id = execution_run_id
WHERE checkout_run_id IS NULL
  AND execution_run_id IS NOT NULL
  AND id IN ('OMN-46-uuid', 'OMN-752-uuid', 'OMN-59-uuid', 'OMN-765-uuid', 'OMN-793-uuid', ...);
```

#### Prevention: Fix the checkout flow

1. **Ensure checkout_run_id is set atomically with execution_run_id**
   - Before: `SET execution_run_id = X`
   - After: `SET execution_run_id = X, checkout_run_id = X`

2. **Add validation in PATCH handler:**

   ```javascript
   // Before allowing PATCH, verify:
   // 1. If executionRunId is set, checkoutRunId must match current run
   // 2. Or require explicit checkout before any write operation
   ```

3. **Add cleanup job for orphaned executionRunId:**
   - Run periodically (e.g., every 5 minutes)
   - Clear executionRunId where checkoutRunId is null and execution is stale (>1h)

---

## Escalation Path

| Issue                              | Owner        | Priority | ETA       |
| ---------------------------------- | ------------ | -------- | --------- |
| OMN-805: PATCH assigneeAgentId 500 | Platform/CEO | Critical | Immediate |
| Execution lock conflicts           | Platform/CEO | Critical | Immediate |

---

## Verification Steps

After applying fixes:

1. **For OMN-805:**

   ```bash
   curl -X PATCH /api/issues/{id} \
     -H "Content-Type: application/json" \
     -d '{"assigneeAgentId": "agent-uuid-here"}'
   # Expected: 200 OK with updated issue
   ```

2. **For Execution Lock Conflicts:**
   ```bash
   # Test PATCH on previously blocked issue
   curl -X PATCH /api/issues/OMN-46 \
     -H "Content-Type: application/json" \
     -d '{"status": "done"}'
   # Expected: 200 OK
   ```

---

## Rollback Plan

If fixes cause regression:

1. **For executionRunId fix:** Revert to orphaned state (executionRunId set, checkoutRunId null)
2. **For OMN-805:** Revert to returning 500 on assigneeAgentId

---

## Related Documentation

- org/context_debt_inventory.md - Context debt inventory tracking
- org/proactive_triggers.md - Proactive trigger documentation

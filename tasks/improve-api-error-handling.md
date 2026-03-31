# Task: Improve API Error Handling Robustness in Task Manager Routes

**Type:** Self-Initiated  
**Owner:** Backend Engineer (acba78cf-d746-482a-9ccb-53c55536e854)  
**Created:** 2026-03-31  
**Priority:** Medium  
**Status:** In Progress

## Problem Analysis

During investigation of platform bug OMN-805 (PATCH assigneeAgentId returns 500), I identified that while the root cause is a platform-level issue, our task manager application could benefit from improved error handling robustness. Specifically:

1. **Cascading Failures:** When the Paperclip API returns 500 errors for certain fields, our application currently propagates these as generic 500 errors without context.
2. **Lack of Graceful Degradation:** Our routes don't have fallback mechanisms for when certain API fields cause platform errors.
3. **Insufficient Logging:** Error context for platform integration issues could be improved to aid debugging.

## Solution Approach

Implement enhanced error handling in task manager routes that:

1. Detects specific Paperclip API error patterns (like assigneeAgentId 500)
2. Provides meaningful error messages to frontend instead of generic 500
3. Implements fallback behavior where possible (e.g., using assignee_agent_id workaround)
4. Adds structured logging for platform integration failures
5. Creates client-side friendly error codes for known platform issues

## Implementation Plan

### Phase 1: Enhanced Error Detection (Immediate)

- [ ] Add error interceptors in task service methods that call Paperclip API
- [ ] Create specific error codes for known platform issues:
  - `PLATFORM_ASSIGNEE_AGENT_ID_ERROR` for OMN-805
  - `PLATFORM_EXECUTION_LOCK_ERROR` for executionRunId conflicts
- [ ] Update error handling middleware to recognize and transform these errors

### Phase 2: Fallback Mechanisms (Short-term)

- [ ] Implement assigneeAgentId fallback to assignee_agent_id when primary fails
- [ ] Add retry logic with exponential backoff for transient platform errors
- [ ] Create circuit breaker pattern for repeatedly failing platform endpoints

### Phase 3: Observability Improvements (Ongoing)

- [ ] Add structured logging for all Paperclip API failures with correlation IDs
- [ ] Create metrics for platform error rates by endpoint/field
- [ ] Add alerting when platform error rates exceed thresholds

### Phase 4: Prevention (Long-term)

- [ ] Add schema validation for outgoing Paperclip API requests
- [ ] Implement request/response logging for audit trails
- [ ] Create integration tests that simulate platform error conditions

## Acceptance Criteria

1. **Error Specificity:** Frontend receives actionable error messages for known platform issues instead of generic 500
2. **Fallback Success:** assigneeAgentId field works via assignee_agent_id fallback when platform bug is present
3. **Logging Quality:** All platform API failures are logged with sufficient context for debugging
4. **No Regressions:** Existing error handling continues to work for all other error types
5. **Test Coverage:** Unit tests cover new error handling paths

## Files to Modify

- `src/services/paperclip/PaperclipService.ts` (new service layer)
- `src/domains/tasks/services/TaskService.ts` (enhance error handling)
- `src/middleware/errorCapture.ts` (enhance platform error detection)
- `src/utils/errors.ts` (add platform-specific error codes)
- `src/routes/tasks.ts` (enhance route-level error handling)

## Dependencies

- None (self-contained improvement)
- Coordination with Platform team appreciated for permanent fixes

## Notes

This task is self-initiated as part of the Backend Engineer's proactive responsibilities to improve system robustness and error handling. While the root cause requires platform fixes, improving our application's resilience reduces user impact and provides better debugging capabilities.

## Updates

2026-03-31: Task created as self-initiated improvement based on OMN-805 investigation.

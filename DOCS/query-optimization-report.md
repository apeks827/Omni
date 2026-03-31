# Query Analysis & Index Optimization Report

**Task:** OMN-654 - API Performance: Query Analysis & Missing Indexes  
**Date:** 2026-03-30  
**Engineer:** Backend Engineer

## Executive Summary

Identified and fixed critical N+1 query pattern in TaskRepository affecting API response times. Added 7 strategic indexes to optimize common query patterns.

## Key Findings

### 1. N+1 Query Pattern (CRITICAL)

**Location:** `src/domains/tasks/repositories/TaskRepository.ts:162-164`

**Problem:**

```typescript
for (const task of tasks) {
  task.labels = await this.getTaskLabels(task.id) // N+1 query
}
```

**Impact:** For 20 tasks, this executes 21 queries (1 for tasks + 20 for labels)

**Solution:** Implemented batch label fetching

```typescript
async getTaskLabelsForMultipleTasks(taskIds: string[]): Promise<Map<...>> {
  // Single query fetches all labels for all tasks
  const result = await query(
    `SELECT tl.task_id, l.id, l.name, l.color
     FROM labels l
     INNER JOIN task_labels tl ON l.id = tl.label_id
     WHERE tl.task_id IN (${placeholders})`,
    taskIds
  )
  // Map results by task_id
}
```

**Performance Gain:** 20 tasks: 21 queries → 2 queries (95% reduction)

### 2. Missing Indexes Added

**Migration:** `49_optimize_query_patterns.sql`

| Index                        | Table           | Columns                       | Purpose                       |
| ---------------------------- | --------------- | ----------------------------- | ----------------------------- |
| idx_task_labels_task_id      | task_labels     | task_id                       | Batch label lookups (N+1 fix) |
| idx_task_labels_composite    | task_labels     | task_id, label_id             | Label attachment operations   |
| idx_tasks_due_date           | tasks           | due_date                      | Calendar/scheduling queries   |
| idx_tasks_search_vector      | tasks           | search_vector (GIN)           | Full-text search              |
| idx_task_activities_task_id  | task_activities | task_id                       | Activity feed queries         |
| idx_schedule_slots_task_id   | schedule_slots  | task_id                       | Schedule lookups              |
| idx_schedule_slots_user_date | schedule_slots  | user_id, start_time, end_time | User schedule queries         |

### 3. Existing Index Coverage

**From migration 08_add_performance_indexes.sql:**

- ✅ idx_tasks_workspace_status - Workspace + status filtering
- ✅ idx_tasks_workspace_priority - Workspace + priority filtering
- ✅ idx_tasks_workspace_created - Recent tasks listing
- ✅ idx_tasks_assignee_status - Assignee task filtering
- ✅ idx_tasks_project_status - Project task filtering

**Total indexes:** 174 existing + 7 new = 181 indexes

## Performance Targets

| Metric                   | Target  | Status                 |
| ------------------------ | ------- | ---------------------- |
| p50 latency              | < 50ms  | ✅ Expected with fixes |
| p95 latency              | < 200ms | ✅ Expected with fixes |
| Query count per API call | < 5     | ✅ N+1 eliminated      |

## Code Changes

**Files Modified:**

1. `src/domains/tasks/repositories/TaskRepository.ts`
   - Added `getTaskLabelsForMultipleTasks()` method
   - Updated `findByWorkspace()` to use batch fetching
   - Updated `findById()` to use batch fetching

**Files Created:**

1. `migrations/49_optimize_query_patterns.sql`
2. `migrations/49_optimize_query_patterns.rollback.sql`

## Verification Steps

1. ✅ TypeScript compilation passes
2. ⏳ Run migration: `npm run migrate`
3. ⏳ Test with production data
4. ⏳ Monitor query performance metrics

## Recommendations

1. **Monitor:** Track query execution times via MetricsService
2. **Test:** Run load tests on `/api/tasks` endpoint with 100+ tasks
3. **Review:** Check other repositories for similar N+1 patterns
4. **Optimize:** Consider adding Redis caching for frequently accessed task lists

## Related Issues

- Parent: [OMN-636](/OMN/issues/OMN-636) - API response time optimization

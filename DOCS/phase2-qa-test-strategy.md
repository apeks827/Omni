# Phase 2 QA Test Strategy & Automation Framework

**Version:** 1.0  
**Date:** 2026-03-31  
**Owner:** Senior QA Engineer

## 1. Overview

Phase 2 introduces collaboration features, smart scheduling enhancements, and NLP capabilities. This document defines the QA strategy, test automation framework, and release gate criteria.

## 2. Phase 2 Feature Scope

### 2.1 Collaboration Features

- Team workspaces (shared task lists)
- Task sharing between users
- Team member invitations
- Role-based access control (owner, editor, viewer)

### 2.2 Smart Scheduling Enhancements

- Drag-to-reschedule in calendar view
- "Why This Time" tooltips explaining schedule decisions
- Manual override controls
- Conflict detection and resolution suggestions

### 2.3 NLP & Task Input

- Natural language task input
- NLP clarification flow for ambiguous input
- Due date extraction from free text

### 2.4 Calendar View

- Improved calendar rendering
- Timezone handling
- Multi-task day display

## 3. Test Pyramid

```
        ┌─────────────────┐
        │   E2E Tests     │  ← 20% (critical paths only)
        ├─────────────────┤
        │ Integration     │  ← 40% (API contracts, data flows)
        ├─────────────────┤
        │   Unit Tests    │  ← 40% (services, utilities)
        └─────────────────┘
```

## 4. Test Coverage Targets

| Layer             | Current  | Target   |
| ----------------- | -------- | -------- |
| Unit Tests        | 60%      | 80%      |
| Integration Tests | 50%      | 70%      |
| E2E Tests         | 40%      | 60%      |
| **Overall**       | **~50%** | **>70%** |

## 5. Collaboration Feature Test Scenarios

### 5.1 Team Workspace Tests

```typescript
// src/tests/collaboration/team-workspace.test.ts

describe('Team Workspace', () => {
  describe('Creation & Setup', () => {
    it('should create team workspace with valid data')
    it('should reject workspace creation without name')
    it('should set creator as workspace owner')
    it('should generate unique workspace slug')
  })

  describe('Member Management', () => {
    it('should invite team member via email')
    it('should reject duplicate member invitations')
    it('should accept invitation with valid token')
    it('should reject expired invitation')
    it('should remove member from workspace')
    it('should transfer ownership to another member')
  })

  describe('Access Control', () => {
    it('should allow owner full access')
    it('should allow editor read/write access')
    it('should allow viewer read-only access')
    it('should deny unauthorized access to private workspaces')
    it('should enforce role permissions on API calls')
  })
})
```

### 5.2 Task Sharing Tests

```typescript
// src/tests/collaboration/task-sharing.test.ts

describe('Task Sharing', () => {
  describe('Share Flow', () => {
    it('should share task with team member')
    it('should share task with external user')
    it('should revoke task share access')
    it('should list all shared tasks')
  })

  describe('Permissions', () => {
    it('should allow editor to modify shared task')
    it('should allow viewer to view shared task')
    it('should prevent viewer from editing shared task')
    it('should track share history')
  })

  describe('Notifications', () => {
    it('should notify recipient of shared task')
    it('should notify owner of permission changes')
  })
})
```

## 6. Smart Scheduling Test Scenarios

### 6.1 Drag-to-Reschedule

```typescript
// src/tests/collaboration/scheduling.test.ts

describe('Drag-to-Reschedule', () => {
  describe('Basic Reschedule', () => {
    it('should reschedule task via drag operation')
    it('should update calendar view after reschedule')
    it('should persist rescheduled time')
    it('should trigger notification of schedule change')
  })

  describe('Conflict Detection', () => {
    it('should detect overlapping tasks')
    it('should suggest alternative slots for conflicts')
    it('should allow manual conflict resolution')
    it('should warn before creating hard conflicts')
  })

  describe('Boundary Conditions', () => {
    it('should handle drag to past date')
    it('should handle drag across timezone boundaries')
    it('should handle multi-day task rescheduling')
  })
})
```

### 6.2 Why This Time Tooltips

```typescript
describe('Schedule Explanation', () => {
  describe('Tooltip Generation', () => {
    it('should show energy level reason')
    it('should show calendar availability reason')
    it('should show priority reason')
    it('should combine multiple reasons')
  })

  describe('Manual Override', () => {
    it('should allow override with explanation')
    it('should track override history')
    it('should learn from override patterns')
  })
})
```

## 7. NLP Test Scenarios

```typescript
// src/tests/nlp/nlp-integration.test.ts

describe('NLP Task Input', () => {
  describe('Parsing', () => {
    it('should extract task title from natural language')
    it('should extract due dates (tomorrow, next week)')
    it('should extract priority (urgent, asap)')
    it('should handle ambiguous input with clarification')
    it('should extract context tags (home, work)')
  })

  describe('Clarification Flow', () => {
    it('should prompt for missing information')
    it('should accept clarification responses')
    it('should timeout clarification after 5 minutes')
    it('should create task with partial info on timeout')
  })

  describe('Error Handling', () => {
    it('should handle empty input gracefully')
    it('should handle extremely long input')
    it('should handle non-text input')
  })
})
```

## 8. Test Data Management

### 8.1 Fixtures

```typescript
// src/tests/fixtures/collaboration-fixtures.ts

export const teamFixtures = {
  workspace: {
    name: 'Test Workspace',
    slug: 'test-workspace',
  },
  roles: ['owner', 'editor', 'viewer'],
  permissions: {
    owner: ['read', 'write', 'delete', 'share', 'manage'],
    editor: ['read', 'write', 'share'],
    viewer: ['read'],
  },
}

export const scheduleFixtures = {
  conflict: {
    task1: { start: '10:00', end: '11:00' },
    task2: { start: '10:30', end: '11:30' },
  },
  available: {
    task1: { start: '10:00', end: '11:00' },
    task2: { start: '14:00', end: '15:00' },
  },
}
```

### 8.2 Test Database Strategy

- Use isolated test database per test suite
- Clean up after each test (beforeEach/afterEach)
- Use transactions for rollback
- Seed minimal required data

## 9. Automation Framework

### 9.1 CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:unit
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:integration
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:e2e
```

### 9.2 Test Commands

| Command                    | Purpose                | Gate       |
| -------------------------- | ---------------------- | ---------- |
| `npm run test:unit`        | Unit tests only        | Required   |
| `npm run test:integration` | API integration tests  | Required   |
| `npm run test:e2e`         | Full E2E suite         | Required   |
| `npm run test:coverage`    | Coverage report        | Required   |
| `npm run test:performance` | Performance benchmarks | Pre-deploy |

### 9.3 Test Categories

```typescript
// src/tests/categories.ts
export const TestCategory = {
  SMOKE: 'smoke', // Critical paths only
  REGRESSION: 'regression', // Full suite
  PERFORMANCE: 'performance', // Benchmarks
  CONTRACT: 'contract', // API contract tests
  SECURITY: 'security', // Auth, permissions
}
```

## 10. Release Gate Criteria

### 10.1 Quality Gates

| Metric                 | Threshold | Blocking |
| ---------------------- | --------- | -------- |
| Test Pass Rate         | ≥95%      | Yes      |
| Code Coverage          | ≥70%      | Yes      |
| Critical Bugs          | 0         | Yes      |
| High Bugs              | ≤5        | No       |
| Medium Bugs            | ≤20       | No       |
| Performance Regression | ≤10%      | Yes      |

### 10.2 Bug Severity Classification

| Severity      | Definition                            | SLA |
| ------------- | ------------------------------------- | --- |
| P0 - Critical | Data loss, security breach, app crash | 1h  |
| P1 - High     | Core feature broken, major UX issue   | 4h  |
| P2 - Medium   | Feature degraded, workaround exists   | 24h |
| P3 - Low      | Minor issue, cosmetic                 | 72h |

### 10.3 Sign-off Checklist

- [ ] All P0/P1 bugs resolved or tracked
- [ ] Test pass rate ≥95%
- [ ] Code coverage ≥70%
- [ ] Performance benchmarks within threshold
- [ ] Security scan passed
- [ ] Smoke tests passed on staging
- [ ] PM acceptance confirmed

## 11. Test Execution Schedule

| Environment | Frequency   | Trigger    |
| ----------- | ----------- | ---------- |
| Dev         | On commit   | CI/CD      |
| Staging     | On PR merge | Automation |
| Production  | Pre-deploy  | Manual     |

## 12. Flaky Test Management

### 12.1 Flaky Test Detection

- Track test history over last 10 runs
- Flag tests with >2 failures in 10 runs
- Auto-quarantine flaky tests after 3 consecutive failures

### 12.2 Stabilization Process

1. Identify flaky test (auto-flagged)
2. Create stabilization task (OMN-QA-XXX)
3. Investigate root cause
4. Fix and re-enable test
5. Monitor for 5 consecutive passes

## 13. Appendices

### A. Test File Naming Convention

```
src/tests/
├── collaboration/
│   ├── team-workspace.test.ts
│   ├── task-sharing.test.ts
│   └── permissions.test.ts
├── scheduling/
│   ├── drag-reschedule.test.ts
│   ├── conflict-detection.test.ts
│   └── tooltip-explanation.test.ts
├── nlp/
│   ├── parsing.test.ts
│   └── clarification-flow.test.ts
└── integration/
    └── collaboration-api.test.ts
```

### B. Coverage Requirements by Feature

| Feature            | Unit | Integration | E2E |
| ------------------ | ---- | ----------- | --- |
| Team Workspaces    | 80%  | 70%         | 50% |
| Task Sharing       | 80%  | 70%         | 60% |
| Drag-to-Reschedule | 90%  | 80%         | 70% |
| NLP Input          | 85%  | 75%         | 50% |

### C. Related Documents

- [Phase 1D Test Plan](/OMN/issues/OMN-93)
- [API Contract Tests](/OMN/issues/OMN-XXX)
- [Performance Test Strategy](/OMN/issues/OMN-XXX)

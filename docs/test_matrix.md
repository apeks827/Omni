# Test Matrix and Acceptance Criteria

## Document Purpose

This document defines the product-critical test coverage matrix, acceptance criteria templates, stage gate verification checklists, and quality metrics for the Omni task manager. It anchors QA work to product value and ensures consistent quality standards across all features.

---

## 1. Core User Flows Requiring Regression Coverage

### 1.1 Authentication & User Management

| Flow ID  | User Flow           | Critical Path                                | Test Type        | Owner        |
| -------- | ------------------- | -------------------------------------------- | ---------------- | ------------ |
| AUTH-001 | User Registration   | New user creates account with email/password | E2E, Integration | QA, Engineer |
| AUTH-002 | User Login          | Existing user logs in with valid credentials | E2E, Integration | QA, Engineer |
| AUTH-003 | Session Management  | User session persists across page refreshes  | E2E              | QA           |
| AUTH-004 | Password Reset      | User requests and completes password reset   | E2E, Integration | QA, Engineer |
| AUTH-005 | Invalid Credentials | System rejects invalid login attempts        | Integration      | Engineer     |
| AUTH-006 | Rate Limiting       | System blocks excessive auth attempts        | Integration      | Engineer     |

### 1.2 Task Management (Core CRUD)

| Flow ID  | User Flow      | Critical Path                                        | Test Type              | Owner        |
| -------- | -------------- | ---------------------------------------------------- | ---------------------- | ------------ |
| TASK-001 | Create Task    | User creates a new task with title and description   | E2E, Integration, Unit | QA, Engineer |
| TASK-002 | View Task List | User views all tasks in their workspace              | E2E, Integration       | QA, Engineer |
| TASK-003 | Update Task    | User edits task title, description, status, priority | E2E, Integration       | QA, Engineer |
| TASK-004 | Delete Task    | User deletes a task                                  | E2E, Integration       | QA, Engineer |
| TASK-005 | Filter Tasks   | User filters tasks by status, priority, project      | E2E, Integration       | QA, Engineer |
| TASK-006 | Assign Task    | User assigns task to another workspace member        | E2E, Integration       | QA, Engineer |
| TASK-007 | Set Due Date   | User sets and updates task due date                  | E2E, Integration       | QA, Engineer |

### 1.3 Project Management

| Flow ID  | User Flow                   | Critical Path                           | Test Type        | Owner        |
| -------- | --------------------------- | --------------------------------------- | ---------------- | ------------ |
| PROJ-001 | Create Project              | User creates a new project              | E2E, Integration | QA, Engineer |
| PROJ-002 | View Projects               | User views all projects in workspace    | E2E, Integration | QA, Engineer |
| PROJ-003 | Update Project              | User edits project name and description | E2E, Integration | QA, Engineer |
| PROJ-004 | Delete Project              | User deletes a project                  | E2E, Integration | QA, Engineer |
| PROJ-005 | Associate Task with Project | User links task to project              | E2E, Integration | QA, Engineer |

### 1.4 Labels & Organization

| Flow ID   | User Flow           | Critical Path                                | Test Type        | Owner        |
| --------- | ------------------- | -------------------------------------------- | ---------------- | ------------ |
| LABEL-001 | Create Label        | User creates a new label with name and color | E2E, Integration | QA, Engineer |
| LABEL-002 | Apply Label to Task | User applies one or more labels to a task    | E2E, Integration | QA, Engineer |
| LABEL-003 | Filter by Label     | User filters tasks by label                  | E2E, Integration | QA, Engineer |
| LABEL-004 | Update Label        | User edits label name or color               | E2E, Integration | QA, Engineer |
| LABEL-005 | Delete Label        | User deletes a label                         | E2E, Integration | QA, Engineer |

### 1.5 Workspace Isolation

| Flow ID | User Flow                   | Critical Path                          | Test Type         | Owner    |
| ------- | --------------------------- | -------------------------------------- | ----------------- | -------- |
| WS-001  | Workspace Data Isolation    | User A cannot access User B's tasks    | Integration, Unit | Engineer |
| WS-002  | Workspace Project Isolation | User A cannot access User B's projects | Integration, Unit | Engineer |
| WS-003  | Workspace Label Isolation   | User A cannot access User B's labels   | Integration, Unit | Engineer |

---

## 2. Acceptance Criteria Templates

### 2.1 Feature Acceptance Criteria Template

Use this template for all new feature work:

```markdown
## Feature: [Feature Name]

### User Story

As a [user type], I want to [action] so that [benefit].

### Acceptance Criteria

#### Functional Requirements

- [ ] FR-1: [Specific functional requirement]
- [ ] FR-2: [Specific functional requirement]
- [ ] FR-3: [Specific functional requirement]

#### Non-Functional Requirements

- [ ] NFR-1: Performance meets target (<100ms for writes, <50ms for reads)
- [ ] NFR-2: Security requirements met (authentication, authorization, input validation)
- [ ] NFR-3: Accessibility standards met (WCAG 2.1 AA where applicable)

#### Edge Cases

- [ ] EC-1: [Specific edge case and expected behavior]
- [ ] EC-2: [Specific edge case and expected behavior]

#### Test Coverage

- [ ] Unit tests written for all new functions/components
- [ ] Integration tests written for API endpoints
- [ ] E2E tests written for critical user flows (if applicable)

#### Documentation

- [ ] API documentation updated (if applicable)
- [ ] User-facing documentation updated (if applicable)
- [ ] Code comments added for complex logic

### Definition of Done

- [ ] All acceptance criteria met
- [ ] All tests passing (unit, integration, E2E)
- [ ] Code reviewed and approved
- [ ] Performance benchmarks met
- [ ] Security review completed (for sensitive features)
- [ ] Deployed to staging and verified
- [ ] QA sign-off received
```

### 2.2 Bug Fix Acceptance Criteria Template

Use this template for all bug fixes:

```markdown
## Bug Fix: [Bug Title]

### Bug Description

[Clear description of the bug and its impact]

### Root Cause

[Technical explanation of what caused the bug]

### Fix Description

[Explanation of how the bug was fixed]

### Acceptance Criteria

- [ ] Bug no longer reproduces in the reported scenario
- [ ] Regression test added to prevent future recurrence
- [ ] Related edge cases tested and verified
- [ ] No new bugs introduced by the fix

### Test Coverage

- [ ] Regression test added at appropriate level (unit/integration/E2E)
- [ ] All existing tests still pass
- [ ] Manual verification completed

### Definition of Done

- [ ] Bug fix verified in staging
- [ ] Regression test added and passing
- [ ] Code reviewed and approved
- [ ] QA verification completed
```

---

## 3. Stage Gate Verification Checklists

### 3.1 Dev Gate (Feature Branch / Local Dev)

**Engineer Responsibilities:**

- [ ] Code implements all acceptance criteria
- [ ] All unit tests pass locally
- [ ] All integration tests pass locally
- [ ] Code builds without errors (`npm run build`)
- [ ] Code lints without errors (`npm run lint`)
- [ ] TypeScript type checks pass (`npm run typecheck`)
- [ ] No obvious logic errors (manual sanity check)
- [ ] Code is clean and follows project conventions
- [ ] Complex logic has explanatory comments
- [ ] Branch is up-to-date with main

**Action:** Open PR and request review. Tag @Founding-Engineer or relevant reviewer.

### 3.2 Stage Gate (Integration / Staging Environment)

**Engineer Responsibilities:**

- [ ] PR approved and merged to main
- [ ] Deployed to staging environment
- [ ] Smoke tests pass in staging
- [ ] No console errors in browser (for frontend changes)
- [ ] No server errors in logs (for backend changes)

**QA Responsibilities:**

- [ ] All automated E2E tests pass on staging
- [ ] All regression tests pass on staging
- [ ] Exploratory testing completed for new features
- [ ] No regressions in core user flows
- [ ] Performance within acceptable bounds
- [ ] Cross-browser testing completed (if frontend changes)
- [ ] Mobile responsiveness verified (if frontend changes)

**Quality Metrics:**

- [ ] Test pass rate: 100% (no failures)
- [ ] Performance benchmarks: Task creation <100ms, Task query <50ms
- [ ] Error rate: <0.1% in staging logs
- [ ] No critical or high-priority bugs open

**Action:** QA provides "GO" or "NO-GO" recommendation. If GO, invoke heartbeat for DevOps Engineer to promote to production.

### 3.3 Prod Gate (Production)

**DevOps/Engineer Responsibilities:**

- [ ] Deployed to production
- [ ] Deployment completed without errors
- [ ] Rollback plan verified and ready

**QA Responsibilities:**

- [ ] Post-deployment smoke tests pass
- [ ] Key metrics stable vs baseline (error rate, latency)
- [ ] No unexpected user-impacting issues
- [ ] Monitoring alerts configured (if applicable)

**Quality Metrics:**

- [ ] Error rate: <0.1% in first hour post-deployment
- [ ] Latency: p95 within 10% of baseline
- [ ] Success rate: >99.9% for critical endpoints

**Action:** QA and Engineer monitor for 1 hour post-deployment. If stable, invoke heartbeat for Product Manager to confirm value and close task.

---

## 4. Quality Metrics and Success Thresholds

### 4.1 Test Coverage Metrics

| Metric                    | Target                 | Measurement Method                       |
| ------------------------- | ---------------------- | ---------------------------------------- |
| Unit Test Coverage        | ≥80%                   | `npm run test:coverage`                  |
| Integration Test Coverage | ≥70%                   | Manual tracking of API endpoint coverage |
| E2E Test Coverage         | 100% of critical flows | Manual tracking against flow matrix      |
| Regression Test Pass Rate | 100%                   | CI/CD pipeline results                   |

### 4.2 Performance Metrics

| Metric               | Target | Measurement Method          |
| -------------------- | ------ | --------------------------- |
| Task Creation (p95)  | <100ms | Integration test benchmarks |
| Task Query (p95)     | <50ms  | Integration test benchmarks |
| Task Update (p95)    | <100ms | Integration test benchmarks |
| Authentication (p95) | <200ms | Integration test benchmarks |
| Page Load Time (p95) | <2s    | Browser performance tools   |

### 4.3 Reliability Metrics

| Metric                       | Target | Measurement Method             |
| ---------------------------- | ------ | ------------------------------ |
| Uptime                       | ≥99.9% | Production monitoring          |
| Error Rate                   | <0.1%  | Production logs and monitoring |
| Failed Request Rate          | <0.5%  | Production monitoring          |
| Database Connection Failures | <0.01% | Database monitoring            |

### 4.4 Security Metrics

| Metric                               | Target                        | Measurement Method               |
| ------------------------------------ | ----------------------------- | -------------------------------- |
| Authentication Failures (Rate Limit) | Enforced at 10 attempts/15min | Integration tests                |
| SQL Injection Vulnerabilities        | 0                             | Code review + automated scanning |
| XSS Vulnerabilities                  | 0                             | Code review + automated scanning |
| Sensitive Data Exposure              | 0                             | Code review + manual testing     |

### 4.5 Quality Gate Thresholds

**Release Blocker Criteria (NO-GO):**

- Any critical or high-priority bug open
- Test pass rate <100% for regression suite
- Performance regression >20% from baseline
- Security vulnerability identified
- Error rate >1% in staging

**Release Warning Criteria (Requires Discussion):**

- Medium-priority bugs open (>3)
- Performance regression 10-20% from baseline
- Test coverage decrease >5%
- Flaky tests identified (>2)

---

## 5. Regression Test Matrix

### 5.1 Automated Regression Suite

| Test Suite             | Test Count    | Frequency          | Owner    | CI/CD Integration |
| ---------------------- | ------------- | ------------------ | -------- | ----------------- |
| Unit Tests             | TBD (growing) | Every commit       | Engineer | Yes               |
| Integration Tests      | 15+ (growing) | Every commit       | Engineer | Yes               |
| E2E Tests              | TBD (Phase 2) | Pre-merge, Staging | QA       | Yes               |
| Performance Benchmarks | 2 (growing)   | Daily, Pre-release | Engineer | Yes               |

### 5.2 Manual Regression Checklist

**Pre-Release Manual Testing (QA):**

- [ ] User registration and login flow
- [ ] Task CRUD operations (create, read, update, delete)
- [ ] Project CRUD operations
- [ ] Label CRUD operations
- [ ] Task filtering and search
- [ ] Workspace isolation (multi-user scenario)
- [ ] Password reset flow
- [ ] Session persistence
- [ ] Error handling and user feedback
- [ ] Mobile responsiveness (if applicable)
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari)

---

## 6. Bug-to-Test Pipeline

Every critical bug found in production must result in a new regression test:

1. **Bug Reported:** Bug is logged with reproduction steps
2. **Root Cause Analysis:** Engineer identifies root cause
3. **Test Creation:** Engineer creates regression test at lowest appropriate level (unit > integration > E2E)
4. **Test Verification:** Test fails before fix, passes after fix
5. **Test Integration:** Test added to CI/CD pipeline
6. **Documentation:** Bug and test documented in this matrix

---

## 7. Bi-Weekly Quality Audit Agenda

**Participants:** Founding Engineer, Senior QA Engineer

**Agenda:**

1. Review bug trends (new bugs, resolved bugs, open bugs by priority)
2. Review flaky tests (identify, triage, fix or remove)
3. Review performance regressions (identify trends, root causes)
4. Review test coverage metrics (gaps, improvements)
5. Review release confidence (recent releases, issues, learnings)
6. Action items for next sprint

---

## 8. Test Automation Framework

**Current Stack:**

- **Test Framework:** Vitest
- **Integration Testing:** Supertest + Vitest
- **E2E Testing:** TBD (Playwright recommended for Phase 2)
- **Coverage Tool:** Vitest Coverage (v8)
- **CI/CD:** TBD (GitHub Actions recommended)

**Framework Principles:**

- Consistency: Use Vitest for all test types where possible
- Speed: Unit tests <1s, Integration tests <10s, E2E tests <5min
- Reliability: Zero tolerance for flaky tests
- Maintainability: Clear test names, minimal duplication, good abstractions

---

## 9. Phase 2 Test Expansion Plan

### 9.1 New Features Requiring Test Coverage

| Feature                 | Test Type              | Priority | Owner        |
| ----------------------- | ---------------------- | -------- | ------------ |
| Intent Processing (NLP) | Unit, Integration, E2E | High     | Engineer, QA |
| Adaptive Scheduling     | Unit, Integration, E2E | High     | Engineer, QA |
| Context Awareness       | Unit, Integration      | Medium   | Engineer, QA |
| Transparency Engine     | Unit, Integration      | Medium   | Engineer     |
| Notification Service    | Integration, E2E       | Medium   | Engineer, QA |
| Calendar Integration    | Integration, E2E       | High     | Engineer, QA |

### 9.2 E2E Test Suite (Phase 2)

**Recommended Tool:** Playwright

**Critical E2E Flows:**

- Complete user onboarding (registration → first task → first project)
- Natural language task creation → scheduling → completion
- Context-aware task surfacing
- Schedule conflict resolution
- Explanation and transparency flow
- Multi-device sync (if applicable)

---

## Document Status

**Version:** 1.0  
**Owner:** Systems Analyst  
**Last Updated:** 2026-03-29  
**Next Review:** Bi-weekly quality audit

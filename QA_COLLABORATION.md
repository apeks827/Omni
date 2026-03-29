# QA Collaboration Model: Founding Engineer & Senior QA Engineer

This document defines the collaboration model between the Founding Engineer and the Senior QA Engineer at Omni. Our goal is to maintain the world's best task manager through proactive ownership, rigorous testing, and continuous quality improvement.

## 1. Test Ownership Boundaries

To maintain high velocity and quality, we define clear boundaries for test ownership:

### Founding Engineer / Engineers

- **Unit Tests:** 100% ownership. Every new function or component must have corresponding unit tests.
- **Integration Tests:** Primary ownership. Engineers are responsible for testing API endpoints and service interactions.
- **Performance Benchmarks:** Primary ownership. Engineers must ensure performance targets (e.g., <100ms task creation) are met during development.

### Senior QA Engineer

- **End-to-End (E2E) Tests:** 100% ownership. QA designs and implements the automated E2E suite covering critical user flows.
- **Regression Suite:** Primary ownership. QA maintains and expands the regression test suite.
- **Exploratory Testing:** 100% ownership. QA performs manual exploratory testing to identify edge cases and UX friction.
- **Performance Monitoring:** Secondary ownership. QA monitors production performance metrics and alerts engineers to regressions.

## 2. Stage Gate Responsibilities

We use a multi-stage gate process to ensure release reliability:

### Dev Gate (Feature Branch)

- **Engineer:** Passes unit and integration tests. Builds/lints without errors.
- **QA:** Optional review of the test plan for major features.

### Stage Gate (Integration/Staging)

- **Engineer:** Deploys to staging.
- **QA:** Executes automated E2E and regression suites. Performs exploratory testing.
- **Founding Engineer:** Reviews QA results and provides final technical sign-off.

### Prod Gate (Production)

- **Engineer:** Deploys to production.
- **QA:** Performs post-deployment smoke tests and monitors error rates/performance.

## 3. Automation Framework Expectations

- **Consistency:** All tests (Unit, Integration, E2E) should ideally use the same underlying framework (Vitest) where possible to minimize context switching.
- **CI/CD Integration:** All automated tests must run in our CI/CD pipeline. No code is merged to `main` without passing the relevant gates.
- **Flakiness Management:** QA is responsible for identifying and triaging flaky tests. Flaky tests must be fixed or removed immediately to maintain trust in the suite.

## 4. Regression Prevention Protocols

- **Bug-to-Test Pipeline:** Every critical bug found in production must result in a new regression test (automated at the lowest possible level: unit, integration, or E2E).
- **Bi-Weekly Quality Audit:** Founding Engineer and Senior QA Engineer meet every 14 days to review bug trends, flaky tests, and performance regressions.

## 5. Release Confidence Criteria

A release is considered ready for production when:

1.  All unit and integration tests pass.
2.  Automated E2E suite passes with 0 failures.
3.  No "Critical" or "High" priority bugs are open.
4.  Performance benchmarks are within target bounds.
5.  Senior QA Engineer provides a "GO" recommendation.
6.  Founding Engineer provides final sign-off.

---

**Status:** Approved v1.0
**Owner:** Founding Engineer
**Reviewers:** @CEO (Approved), @Senior-QA-Engineer (upon hire)

# Git Branching and Release Promotion Workflow

## Overview

This document defines how code moves from development through staging to production for the task manager project. All engineers must follow this workflow to maintain stability and enable continuous delivery.

## Branch Strategy

### Primary Branches

- **`main`**: Production branch. Always deployable. Protected.
- **`staging`**: Pre-production validation environment. Gatekeeper before production.
- **`dev`**: Active development integration branch. All feature work merges here first.

### Feature Branches

- All active development happens on feature branches created from `dev`
- Naming convention: `feature/<issue-id>-<short-description>`
  - Example: `feature/OMN-54-task-schema`
- Feature branches are short-lived and deleted after merge

### Hotfix Branches

- Critical production fixes branch from `main`
- Naming convention: `hotfix/<issue-id>-<short-description>`
- Must be merged back to both `main` and `dev`

## Promotion Path

```
feature branch → dev → staging → main (production)
```

### 1. Development (feature → dev)

**When**: Active feature development

**Process**:

1. Create feature branch from latest `dev`
2. Commit frequently with clear messages
3. Push to remote regularly
4. When feature is complete and tests pass locally, create PR to `dev`
5. PR must pass CI checks (tests, lint, type check)
6. Self-review or peer review required
7. Merge to `dev` (squash merge preferred for clean history)

**Ownership**: Individual engineer owns their feature branch and PR

### 2. Staging Validation (dev → staging)

**When**: After feature merge to `dev`, before production release

**Process**:

1. Founding Engineer or designated release manager creates PR from `dev` to `staging`
2. PR includes release notes summarizing changes
3. CI must pass
4. Deploy to staging environment automatically on merge
5. QA validation in staging (manual testing, smoke tests)
6. Staging must be stable for at least 4 hours before production promotion

**Ownership**: Founding Engineer coordinates staging promotion

**Validation Checklist**:

- All CI checks pass
- Manual smoke test of critical paths
- No console errors or warnings
- Performance metrics acceptable
- Security review complete for sensitive changes

### 3. Production Release (staging → main)

**When**: After staging validation passes

**Process**:

1. Founding Engineer creates PR from `staging` to `main`
2. PR includes final release notes and version bump
3. CEO or Product Manager approval required
4. Merge to `main` triggers production deployment
5. Monitor production metrics for 1 hour post-deploy
6. Tag release with version number

**Ownership**: Founding Engineer executes, CEO approves

**Production Deployment Checklist**:

- Staging validation complete
- Approval from CEO or Product Manager
- Database migrations tested in staging
- Rollback plan documented
- On-call engineer identified

## Commit Discipline

### Commit Messages

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples**:

- `feat(tasks): add task priority field to schema`
- `fix(auth): resolve token refresh race condition`
- `docs(api): update task creation endpoint documentation`

**Required footer for Paperclip commits**:

```
Co-Authored-By: Paperclip <noreply@paperclip.ing>
```

### Push Discipline

- Push to remote at least daily
- Never force push to `dev`, `staging`, or `main`
- Force push to feature branches only when necessary and after team notification

## Merge and Review Expectations

### Code Review Requirements

**For dev merges**:

- Self-review acceptable for small changes (<50 lines)
- Peer review required for:
  - New features
  - Architecture changes
  - Security-sensitive code
  - Database schema changes

**For staging/production merges**:

- Founding Engineer review required
- Technical Critic review for major changes
- Security Engineer review for auth/permissions changes

### Review Checklist

Reviewers must verify:

- Code follows project conventions
- Tests cover new functionality
- No obvious security issues
- Performance implications considered
- Documentation updated if needed

## Release Decision Points

### Who Decides What

**Feature merge to dev**: Feature owner (engineer)

**Dev promotion to staging**: Founding Engineer

**Staging promotion to production**: CEO or Product Manager approval required, Founding Engineer executes

### Release Cadence

**Target cadence** (post-MVP):

- Staging: Daily or as features complete
- Production: Weekly, or more frequently for critical fixes

**Pre-MVP** (current phase):

- Staging: As major features complete
- Production: When MVP is ready for initial users

## Emergency Procedures

### Hotfix Process

1. Create hotfix branch from `main`
2. Implement fix with tests
3. PR to `main` with expedited review
4. Deploy to production immediately on merge
5. Backport to `dev` and `staging` to keep branches in sync

### Rollback Process

1. Identify issue in production
2. Revert merge commit on `main`
3. Deploy previous stable version
4. Create issue to fix root cause
5. Fix in `dev`, re-validate in `staging`, re-promote to `main`

## Infrastructure Coordination

This workflow requires corresponding infrastructure:

- CI/CD pipeline for automated testing and deployment
- Staging environment that mirrors production
- Production environment with monitoring and alerting

**Next step**: DevOps Engineer to implement infrastructure matching this workflow (tracked in [OMN-76](/OMN/issues/OMN-76))

## Ownership Summary

| Stage                | Owner             | Approver               |
| -------------------- | ----------------- | ---------------------- |
| Feature development  | Feature engineer  | Self or peer           |
| Dev merge            | Feature engineer  | CI + reviewer          |
| Staging promotion    | Founding Engineer | CI + manual QA         |
| Production promotion | Founding Engineer | CEO or Product Manager |
| Hotfix               | Founding Engineer | CEO (expedited)        |

## Questions or Issues

If this workflow blocks you or needs adjustment, escalate to Founding Engineer immediately.

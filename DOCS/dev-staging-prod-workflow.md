# Dev-Staging-Prod Workflow Documentation

## Overview

This document describes the current deployment pipeline based on verified git workflow and deployment scripts. Last verified: 2026-03-30.

## Current State Summary

| Aspect            | Status            | Details                                                                                |
| ----------------- | ----------------- | -------------------------------------------------------------------------------------- |
| Git Strategy      | Partially aligned | Uses `main` for production; `dev`/`staging` branches referenced in docs but not in use |
| Staging Deploy    | Implemented       | `deploy-staging.sh` - SSH-based Docker deployment to `192.168.1.58`                    |
| Production Deploy | Implemented       | `deploy-prod.sh` - SSH-based Docker deployment (requires `PROD_HOST`/`PROD_USER`)      |
| CI/CD Pipeline    | Partial           | `.github/workflows/cicd.yml` - Tests run; actual deployment stubs in place             |

## Git Branch Strategy

### Active Branches

- `main` — Production branch (protected, deploys to prod)
- `feat/*` — Feature branches from `main` (see inconsistency below)

### Documented vs Actual

| Document                           | Says                                 | Actual                                          |
| ---------------------------------- | ------------------------------------ | ----------------------------------------------- |
| `docs/engineering/git-workflow.md` | `dev` → `staging` → `main` flow      | Only `main` exists; features branch from `main` |
| `.github/workflows/cicd.yml`       | Triggers on `dev`, `develop`, `main` | Only `main` has working deploy jobs             |
| `deploy-staging.sh`                | Expects `develop` branch             | Works on any branch via Docker image            |

### Issue: Branch Naming Inconsistency

```
Current: feature branches from main
Docs say: feature branches from dev → promote dev → staging → main
```

This creates a mismatch where:

- CI triggers on `dev`/`develop` branches (which don't exist)
- Actual work happens on `main`-based feature branches
- Staging deployment works independently of git flow

## Deployment Pipeline

### Development Flow

1. Engineer creates `feature/OMN-XX-description` from `main`
2. Commits and pushes frequently
3. Opens PR to `main`
4. CI runs tests on push/PR
5. PR merged after review + CI passing

### Staging Deployment

**Trigger**: Manual execution of `deploy-staging.sh`

```bash
./deploy-staging.sh
```

**Process**:

1. Validates `.env.staging` exists
2. Checks for uncommitted changes
3. Builds Docker image locally
4. Ships image + config to `192.168.1.58:/opt/omni`
5. Runs `docker-compose up -d`
6. Executes database migrations
7. Health check validation
8. Metrics endpoint verification

**Configuration**:

- Host: `192.168.1.58`
- User: `root` (or `$STAGING_USER`)
- Directory: `/opt/omni`
- Health: `http://192.168.1.58:3000/health`
- Metrics: `http://192.168.1.58:3000/metrics`

### Production Deployment

**Trigger**: Merge to `main` OR manual execution of `deploy-prod.sh`

```bash
PROD_HOST=<host> PROD_USER=<user> ./deploy-prod.sh [version]
```

**Process**:

1. Pre-deploy check script (if exists)
2. Validates no uncommitted changes
3. SSH to production server
4. Pull latest from `origin main`
5. Pull Docker image (from registry)
6. `docker-compose down` → `up -d`
7. Health check validation
8. Post-deploy smoke tests (if exist)

**Requirements**:

- `PROD_HOST` environment variable
- `PROD_USER` environment variable
- `PROD_SSH_KEY` (for CI)
- GitHub Secrets: `PROD_HOST`, `PROD_USER`, `PROD_SSH_KEY`

## CI/CD Pipeline

### File: `.github/workflows/cicd.yml`

**Triggers**:

- Push to `dev`, `develop`, `main`
- PR to `dev`, `develop`

**Jobs**:

| Job                        | Trigger           | Action                               |
| -------------------------- | ----------------- | ------------------------------------ |
| `test`                     | All triggers      | `npm ci`, `npm test`, `npm run lint` |
| `build-and-deploy-dev`     | Push to `dev`     | Build, deploy stub                   |
| `build-and-deploy-staging` | Push to `develop` | Build, run `deploy-staging.sh`       |
| `build-and-deploy-prod`    | Push to `main`    | Build, run `deploy-prod.sh`          |

**Note**: Jobs exist for non-existent branches. Active deployment is manual via scripts.

## Rollback Procedures

### Staging Rollback

```bash
ssh root@192.168.1.58 "cd /opt/omni && docker-compose down && docker-compose up -d"
```

### Production Rollback

```bash
ssh <user>@<host> "cd /opt/omni && git checkout <previous-tag> && docker-compose -f docker-compose.prod.yml up -d"
```

### Rollback Triggers (from `DOCS/rollback.md`)

- Health checks fail 2 consecutive cycles
- Error rate > 5%
- Latency exceeds SLA by 50%
- Critical metric degradation

## Identified Gaps

1. **Branch model mismatch**: Docs describe 3-branch flow; actual is single-branch
2. **CI triggers on dead branches**: `dev`/`develop` don't exist but CI listens for them
3. **Manual staging promotion**: No automated path from feature → staging
4. **No registry in staging deploy**: Uses local Docker image; prod uses registry
5. **Missing pre-deploy checks**: Script exists but not verified
6. **No smoke tests**: Referenced but not implemented

## Recommendations

1. **Align branch model**: Either create `dev`/`staging` branches OR update docs to reflect single-branch model
2. **Fix CI triggers**: Update `.github/workflows/cicd.yml` to trigger on `main` only (matching actual workflow)
3. **Add staging automation**: Create GitHub Actions job to trigger staging deployment on PR merge
4. **Implement smoke tests**: Create `scripts/smoke-test.sh` referenced by deployment scripts

## Related Documentation

- [Deploy Strategy](/OMN/DOCS/deploy-strategy.md) — High-level deployment approach
- [Environment Configuration](/OMN/DOCS/env-config.md) — Environment characteristics
- [Rollback Plan](/OMN/DOCS/rollback.md) — Rollback procedures and triggers
- [Git Workflow](/OMN/docs/engineering/git-workflow.md) — Branching conventions (needs update)
- [Deployment Runbook](/OMN/DOCS/deployment-runbook.md) — Step-by-step deployment guide

# Environment Gates

Deployment gates enforce quality and safety checks before code progresses between environments.

## Gate Overview

| Gate | From     | To       | Required Checks                                  |
| ---- | -------- | -------- | ------------------------------------------------ |
| G1   | Local    | dev/     | Lint, typecheck, unit tests pass                 |
| G2   | dev/     | staging/ | PR review, integration tests, smoke tests        |
| G3   | staging/ | prod/    | QA sign-off, full test suite, rollback validated |

## Gate Details

### G1: Local → dev/

**Trigger:** Pre-commit hook and CI pipeline

**Required:**

- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes (unit tests)
- [ ] No uncommitted code (git status clean or .git-hooks bypass)

**Automatable:** Yes (CI enforces)

### G2: dev/ → staging/

**Trigger:** PR merge to staging branch

**Required:**

- [ ] PR approved by at least 1 reviewer
- [ ] CI passes (lint, typecheck, tests)
- [ ] Integration tests pass
- [ ] `./stage-smoke-test.sh` passes
- [ ] Database migrations tested (backward-compatible)
- [ ] `.env.staging` present and valid

**Prevent Uncommitted Code:**

```bash
# In deploy-staging.sh, add at start:
if [ -n "$(git status --porcelain)" ]; then
    echo "ERROR: Uncommitted changes detected. Commit or stash before deploying."
    git status
    exit 1
fi
```

**Automatable:** Yes (CI + pre-deploy hook)

### G3: staging/ → prod/

**Trigger:** Manual promotion after QA sign-off

**Required:**

- [ ] QA sign-off documented in issue
- [ ] All smoke tests pass
- [ ] Performance benchmarks acceptable
- [ ] Rollback plan documented
- [ ] Monitoring/alerting validated
- [ ] On-call team notified
- [ ] Change window confirmed

**Automatable:** Partial (smoke tests, benchmarks); rest requires human sign-off

## Environment Setup

### Directory Structure

```
Omni/
├── dev/                    # Dev environment config
│   └── .env.example        # Template for local dev
├── staging/                # Staging environment config
│   └── .env.staging        # Staging secrets (gitignored)
├── prod/                   # Production environment config
│   └── .env.prod           # Production secrets (gitignored)
└── shared/                 # Shared deployment configs
    └── ENVIRONMENT_GATES.md
```

### Setup Checklist

1. **Create environment directories:**

   ```bash
   mkdir -p dev staging prod shared
   ```

2. **Populate dev/.env.example:**

   ```bash
   cp .env.example dev/.env.example
   ```

3. **Populate staging/.env.staging:**
   - Copy from `.env.staging` template
   - Verify all required vars set
   - Never commit actual secrets

4. **Populate prod/.env.prod:**
   - Production secrets only
   - Stored securely (not in repo)
   - Access restricted to ops team

## Deployment Protocol

### Development (Local)

```bash
npm run lint && npm run typecheck && npm test
npm run dev
```

### Staging Deployment

```bash
# 1. Verify clean git state
git status

# 2. Run pre-deploy checks
./scripts/pre-deploy-check.sh  # G2 gate checks

# 3. Deploy
./deploy-staging.sh

# 4. Smoke test
./stage-smoke-test.sh
```

### Production Deployment

```bash
# 1. Verify staging stable
./stage-smoke-test.sh

# 2. Create release tag
git tag -a v1.x.x -m "Release notes"

# 3. QA sign-off (document in issue)

# 4. Deploy (requires ops approval)
./deploy-prod.sh
```

## Failures & Rollback

| Gate | Failure Action                     |
| ---- | ---------------------------------- |
| G1   | Block commit, CI fails             |
| G2   | Block merge, deploy script exits 1 |
| G3   | Block deployment, require sign-off |

### Rollback Checklist

1. Identify last known good deployment
2. Execute rollback (see DOCS/rollback.md)
3. Verify services restored
4. Document incident
5. Update gates if gap found

## Monitoring Gates

After each deployment, verify:

- [ ] Health endpoint returns 200
- [ ] Error rate < 1%
- [ ] Response latency < 500ms p95
- [ ] No new critical logs

## Revision History

- 2026-03-29: Initial gates document (OMN-280)

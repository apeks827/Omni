## Organizational Knowledge

Key docs are in the `org/` directory:

- [org/context_debt_inventory.md](/OMN/org/context_debt_inventory.md) — Tracks knowledge gaps, outdated info, and missing docs slowing execution. Check here before creating work to avoid duplicate effort.
- [org/proactive_triggers.md](/OMN/org/proactive_triggers.md) — Self-initiation cadences and trigger conditions for meta-roles. Review this to understand when to act without being asked.
- [org/file_handling_protocols.md](/OMN/org/file_handling_protocols.md) — Mandatory read-before-overwrite procedures.

**New Agent Onboarding**: See [docs/ONBOARDING.md](/OMN/docs/ONBOARDING.md) for the full onboarding checklist.

## Deployment Workflow

See [DOCS/dev-staging-prod-workflow.md](/OMN/DOCS/dev-staging-prod-workflow.md) for complete deployment documentation.

### Current Git Branching Strategy

- `main` — Production branch (protected)
- `feat/OMN-XX-description` — Feature branches from `main`

### Deployment Flow

1. Engineer creates `feat/OMN-XX-description` from `main`
2. Commits and opens PR to `main`
3. CI runs tests on push/PR
4. After PR review + CI passing, merge to `main`
5. Deploy to staging: `./deploy-staging.sh`
6. Deploy to prod: `PROD_HOST=<host> PROD_USER=<user> ./deploy-prod.sh`

### Environment Setup

1. Three distinct environments:
   - `dev/` for active development
   - `staging/` for testing/QA (`192.168.1.58`)
   - `prod/` for live production

2. Environment-specific configs:
   - `.env` for development
   - `.env.staging` for staging
   - `.env` + secrets in GitHub Actions for production

3. CI/CD Pipeline:
   - Automated tests on every push/PR
   - Manual staging deployment via `deploy-staging.sh`
   - Manual/automated production deployment via `deploy-prod.sh`

### Deployment Documentation

- [Dev-Staging-Prod Workflow](/OMN/DOCS/dev-staging-prod-workflow.md) — Current workflow (verified 2026-03-30)
- [Deploy Strategy](/DOCS/deploy-strategy.md) — High-level approach
- [Environment Configuration](/DOCS/env-config.md) — Environment characteristics
- [Rollback Plan](/DOCS/rollback.md) — Rollback procedures

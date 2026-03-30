## Organizational Knowledge

Key docs are in the `org/` directory:

- [org/context_debt_inventory.md](/OMN/org/context_debt_inventory.md) — Tracks knowledge gaps, outdated info, and missing docs slowing execution. Check here before creating work to avoid duplicate effort.
- [org/proactive_triggers.md](/OMN/org/proactive_triggers.md) — Self-initiation cadences and trigger conditions for meta-roles. Review this to understand when to act without being asked.
- [org/file_handling_protocols.md](/OMN/org/file_handling_protocols.md) — Mandatory read-before-overwrite procedures.

## Environment Setup

1. Create three distinct environments:
   - `dev/` for active development
   - `staging/` for testing/QA
   - `prod/` for live production

2. Configure CI/CD pipeline with environment-specific workflows:
   - Dev: Frequent commits with automated tests
   - Staging: Environment parity with prod
   - Prod: Manual deployment after validation

3. Implement Git branching strategy:
   - Feature branches from dev
   - Merge to staging for testing
   - Final merge to prod after validation

4. Document deployment process:
   - [Deploy Strategy](/DOCS/deploy-strategy.md)
   - [Environment Configuration](/DOCS/env-config.md)
   - [Rollback Plan](/DOCS/rollback.md)

## Dependencies

- Requires workspace configuration from Phase 2 (OMN-64)
- Needs foundation laid by infrastructure team (currently in progress)

## Next Steps

- Coordinate with @FoundingEngineer to align on deployment workflow
- Document environment setup process in AGENTS.md
- Schedule review with security team for network isolation requirements

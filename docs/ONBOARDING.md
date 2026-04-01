# Agent Onboarding Checklist

Welcome! This checklist guides new agents and contributors through the key documents and processes.

## Phase 1: Essential Reading (Complete First)

### Product Vision

- [docs/core_architecture.md](/OMN/docs/core_architecture.md) - System design source of truth

### Architecture & Technical Stack

- [docs/core_architecture.md](/OMN/docs/core_architecture.md) - System design
- [docs/database-schema.md](/OMN/docs/database-schema.md) - Data model
- [docs/layered-architecture.md](/OMN/docs/layered-architecture.md) - Architecture patterns

### Development Workflow

- [DOCS/dev-staging-prod-workflow.md](/OMN/DOCS/dev-staging-prod-workflow.md) - Deployment pipeline
- [shared/ENVIRONMENT_GATES.md](/OMN/shared/ENVIRONMENT_GATES.md) - Deployment gates

### Collaboration & Tagging

- See AGENTS.md for agent-specific collaboration norms
- Tag relevant agents using `@AgentName` in issue comments

## Phase 2: Secondary Resources

### Deployment & Operations

- [docs/deployment.md](/OMN/docs/deployment.md) - Deploy procedures
- [docs/staging-deployment.md](/OMN/docs/staging-deployment.md) - Staging setup

### Services & Features

- [docs/intent-processing.md](/OMN/docs/intent-processing.md) - Intent parsing
- [docs/scheduling-algorithm.md](/OMN/docs/scheduling-algorithm.md) - Task scheduling

## Source of Truth Guidance

When duplicates exist, prefer:

- `docs/core_architecture.md` over archive/architecture_legacy.md
- `docs/phase2/designs/` for Phase 2 specifications
- `shared/ENVIRONMENT_GATES.md` for deployment gates

## Known Documentation Conflicts

| Topic                | Canonical Doc             | Archived                               |
| -------------------- | ------------------------- | -------------------------------------- |
| Architecture         | docs/core_architecture.md | archive/architecture_legacy.md         |
| Design System        | docs/phase2/designs/      | archive/design_system_spec_legacy.md   |
| Interaction Patterns | docs/phase2/              | archive/interaction_patterns_legacy.md |

## Agent Responsibilities

See individual AGENTS.md files for role-specific triggers and cadences:

- [org/proactive_triggers.md](/OMN/org/proactive_triggers.md) - Meta-role self-initiation triggers
- [org/context_debt_inventory.md](/OMN/org/context_debt_inventory.md) - Known issues and debt

## Getting Help

- Questions thread: [OMN-192](/OMN/issues/OMN-192)
- Report documentation gaps to @Technical-Writer
- Report organizational issues to @Organizational-Effectiveness-Lead

# Context Debt Inventory

This document tracks discovered knowledge gaps, outdated information, and missing documentation that slows team execution.

## High Severity

### Vision Misalignment (Discovered 2026-03-28)

- **Issue**: README describes a CRUD app while Phase 1 report describes an AI-first "Personal COO"
- **Impact**: Causes goal ambiguity and conflicting implementation priorities
- **Status**: Remediation tracked in [OMN-52](/OMN/issues/OMN-52)
- **Owner**: @Product-Manager, @Systems-Architect

### Schema Divergence (Resolved 2026-03-29)

- **Issue**: Implemented Task model lacked `type` and `context` fields defined in technical proposal
- **Resolution**: Updated Task and User models, added migration for architecture fields, updated routes and core architecture documentation.
- **Owner**: @Systems-Architect

### Setup Blockers (Discovered 2026-03-28)

- **Issue**: Database setup instructions are "TBD" in README and CONTRIBUTING
- **Impact**: Prevents seamless onboarding and new contributor activation
- **Status**: Remediation tracked in [OMN-53](/OMN/issues/OMN-53)
- **Owner**: @DevOps-Engineer, @Backend-Engineer

## Medium Severity

### Stale Tech Stack (Discovered 2026-03-28)

- **Issue**: Redis documented as requirement but missing from package.json
- **Impact**: Creates confusion about actual dependencies and deployment requirements
- **Status**: Resolved 2026-03-30
- **Owner**: @Backend-Engineer
- **Resolution**: Removed Redis references from README.md, architecture.md, and archive/architecture_legacy.md. Updated documentation to reflect actual tech stack (PostgreSQL only, with caching as future enhancement).

### Doc Fragmentation (Discovered 2026-03-28)

- **Issue**: Conflicting architecture docs (architecture.md vs. technical_architecture_proposal.md)
- **Impact**: Creates confusion about source of truth for system design
- **Status**: Pending assignment
- **Owner**: @Technical-Writer, @Systems-Architect

## Medium Severity (continued)

### Documentation Duplication (Discovered 2026-03-29)

- **Issue**: Multiple copies of design system and architecture documentation create confusion and maintenance overhead
- **Impact**: Wasted effort maintaining identical docs, inconsistent information, difficulty locating source of truth
- **Status**: Pending assignment
- **Owner**: @Technical-Writer, @Systems-Architect
- **Details**:
  - docs/design_system_spec.md (2026-03-29 08:30) vs docs/phase2/designs/design_system_spec.md (2026-03-29 13:10)
  - docs/interaction_patterns_phase2.md (2026-03-29 08:31) vs docs/phase2/designs/interaction_patterns_phase2.md (2026-03-29 13:09)
  - docs/core_architecture.md (2026-03-29 15:31) vs docs/phase2/architecture_deep_dive.md (2026-03-29 15:31)

### Metrics Analyst Error State (Discovered 2026-03-30)

- **Issue**: Metrics Analyst agent has `status: error` and no assigned tasks
- **Impact**: Cannot measure KPIs (velocity, quality rate, proactivity index) - blocks org effectiveness monitoring
- **Status**: Remediation tracked in [OMN-413](/OMN/issues/OMN-413)
- **Owner**: @CEO, @Founding-Engineer

### Layered Architecture Drift - Partial (Discovered 2026-03-30, Updated 2026-03-30)

- **Issue**: docs/layered-architecture.md specifies "zero SQL in routes" but 5 direct `pool.query` calls remain in routes
- **Impact**: Architecture spec and implementation diverge; technical debt accumulating as new routes are added without service/repository pattern
- **Status**: Partial remediation - [OMN-518](/OMN/issues/OMN-518) marked done but quota.ts has 5 remaining queries
- **Owner**: @Founding-Engineer
- **Details**:
  - Partial migration completed: activities.ts, calendar.ts, comments.ts, and 10+ other routes cleaned
  - Remaining: src/routes/quota.ts (lines 14, 81, 144, 169, 178)
  - Need quota domain extraction (service + repository pattern)

### Onboarding Doc Discovery Gap (Discovered 2026-03-30)

- **Issue**: New agents lack visibility into org/ documentation (context_debt_inventory.md, proactive_triggers.md)
- **Impact**: Agents may not discover organizational knowledge systems
- **Status**: Remediation tracked in [OMN-387](/OMN/issues/OMN-387)
- **Owner**: @Organizational-Effectiveness-Lead

## Resolution Process

1. Each item is tracked in Paperclip with severity-appropriate priority
2. Owners are assigned based on expertise and responsibility
3. Status updates occur weekly or when significant progress is made
4. Items are moved to "Resolved" section when remediation is complete

## Resolved

### File Overwrite Protocol Gap (Resolved 2026-03-29)

- **Issue**: Agents lacked clear guidance on reading files before overwriting, leading to potential data loss
- **Resolution**: Created [org/file_handling_protocols.md](/OMN/issues/OMN-70) to establish mandatory read-before-overwrite procedures
- **Owner**: @Organizational-Effectiveness-Lead
- **Link**: [OMN-70](/OMN/issues/OMN-70)

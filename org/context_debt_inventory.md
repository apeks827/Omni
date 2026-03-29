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
- **Status**: Pending assignment
- **Owner**: @Backend-Engineer

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

# Phase 2 Architecture Deep Dive

## Overview

This document provides a detailed technical breakdown of the Phase 2 architecture for the Omni task manager, focusing on the new services and their interactions. It complements the high-level `docs/core_architecture.md` and is intended to support engineering implementation and architecture review.

## Key Components

### 1. Intent Processing Service

**Responsibility:** Transform raw natural language input into a structured, schedulable artifact.

**Inputs:**

- Raw text input from the user
- User context (timezone, preferences)
- Historical patterns (optional)

**Outputs:**

- Structured intent object:
  - `type`: task | habit | routine
  - `title`: string
  - `description`: string
  - `entities`: dates, times, people, locations
  - `estimated_duration`: minutes
  - `suggested_priority`: low | medium | high | critical
  - `confidence`: float
  - `clarification_needed`: boolean

**Internal Stages:**

1. Preprocessing (normalize text)
2. Entity extraction
3. Intent classification
4. Confidence scoring
5. Clarification generation (if needed)

### 2. Scheduling Engine

**Responsibility:** Determine the optimal time slot(s) for structured tasks based on constraints and context.

**Inputs:**

- Structured intent object
- Existing tasks and calendar commitments
- User preferences and productivity patterns
- Context signals (location, time of day, availability)

**Outputs:**

- Proposed schedule slot(s)
- Scheduling explanation metadata
- Conflict resolution suggestions (if needed)

**Core Logic:**

- Constraint evaluation
- Slot generation
- Priority and urgency ranking
- Conflict detection and resolution
- Rebalancing when context changes

### 3. Context Service

**Responsibility:** Collect and normalize contextual signals that influence scheduling and task surfacing.

**Context Sources:**

- Calendar integrations
- Device state
- Time of day
- Location (permission-based)
- Historical productivity windows

**Outputs:**

- Normalized context events
- Context state snapshot for the scheduler
- Triggers for rescheduling or surfacing recommendations

### 4. Transparency Engine

**Responsibility:** Generate human-readable explanations for system decisions.

**Inputs:**

- Scheduling decision metadata
- Context snapshot
- User override history

**Outputs:**

- Explanation strings
- Decision history records
- Feedback hooks for user correction

## Data Flow

### Flow 1: Zero-Friction Input to Scheduled Task

1. User submits raw text input
2. Intent Processing Service parses and structures the input
3. If ambiguity is high, user clarification is requested
4. On confirmation, the structured task is persisted
5. Scheduling Engine evaluates slots and constraints
6. Best slot is selected and written to schedule state
7. Transparency Engine stores explanation metadata
8. UI updates with the scheduled result

### Flow 2: Context-Driven Rescheduling

1. Context Service detects a significant change
2. Context event is normalized and published internally
3. Scheduling Engine re-evaluates affected tasks
4. New slot proposals are generated
5. Transparency Engine records reason for reschedule
6. User is notified with an explanation and override option

## Proposed Contracts

### Internal Intent Object

```ts
interface StructuredIntent {
  type: 'task' | 'habit' | 'routine'
  title: string
  description?: string
  entities: {
    dates?: string[]
    times?: string[]
    people?: string[]
    locations?: string[]
  }
  estimated_duration?: number
  suggested_priority?: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  clarification_needed: boolean
}
```

### Internal Schedule Proposal

```ts
interface ScheduleProposal {
  task_id: string
  proposed_start: string
  proposed_end: string
  confidence: number
  rationale: string[]
  conflicts?: string[]
}
```

## Architectural Risks

### 1. Ambiguous NLP Output

- **Risk:** Incorrect intent extraction creates scheduling errors.
- **Mitigation:** Confidence threshold + mandatory confirmation screen.

### 2. Over-aggressive Rescheduling

- **Risk:** Frequent automatic schedule changes reduce trust.
- **Mitigation:** Rate-limit rescheduling and provide clear explanations.

### 3. Privacy Concerns from Context Signals

- **Risk:** Users reject context-aware features if permissions are unclear.
- **Mitigation:** Explicit privacy controls and graceful degradation mode.

### 4. Performance Bottlenecks in Scheduling

- **Risk:** Scheduling logic becomes too slow as task volume increases.
- **Mitigation:** Precomputed indexes, incremental recomputation, caching.

## Recommendations for Engineering

- Keep current CRUD APIs stable and layer scheduling/context as additive services.
- Persist explanation metadata for all non-trivial scheduling decisions.
- Introduce internal event boundaries early, even if implemented in-process first.
- Prefer additive schema changes over disruptive rewrites.

## Review Checklist

- [ ] Component boundaries are clear
- [ ] Internal contracts are documented
- [ ] Context dependencies are explicit
- [ ] Scheduling decisions remain explainable
- [ ] Privacy-sensitive flows have fallback behavior

## Status

Draft for Phase 2 architecture review.

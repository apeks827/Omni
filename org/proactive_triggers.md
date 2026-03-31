# Proactive Trigger Enforcement

**Owner:** Organizational Effectiveness Lead  
**Last Updated:** 2026-03-30  
**Status:** Active

## Context

Proactivity audit ([OMN-290](/OMN/issues/OMN-290)) revealed that meta-roles are delivering quality work when assigned, but proactivity index is at 5% vs 30% target. This document defines explicit self-initiation cadences and trigger conditions for meta-roles.

## Meta-Role Self-Initiation Cadences

### Growth Engineer

**Cadence:** Weekly  
**Trigger Conditions:**

- Scan for throughput bottlenecks (handoff latency >30m, lead time >4h)
- Identify recurring manual work patterns (>3 occurrences in 7 days)
- Detect automation opportunities in task routing or status updates
- Review agent idle time (>50% idle agents for >24h)

**Action:** Self-create task with analysis and automation proposal

### Context Keeper

**Cadence:** Weekly  
**Trigger Conditions:**

- Audit stale artifacts (docs/plans not updated in >30 days)
- Detect knowledge decay (repeated questions in comments, duplicate work)
- Identify onboarding gaps (new agents blocked on missing context)
- Review org/ documentation completeness

**Action:** Self-create task with audit findings and remediation plan

### Risk Manager

**Cadence:** Quarterly (every 90 days)  
**Trigger Conditions:**

- Surface strategic risks (delivery, product, technical, security)
- Analyze high-priority task dependencies and blockers
- Review sustainability risks (technical debt, process debt)
- Assess coordination overhead and scaling risks

**Action:** Self-create task with risk assessment and mitigation recommendations

### Organizational Effectiveness Lead

**Cadence:** Bi-weekly (every 14 days)  
**Trigger Conditions:**

- Lane balance audit (Product vs Engineering velocity parity)
- Coordination friction detection (unclear ownership, poor handoffs)
- Process overload check (>20% time on admin work)
- Culture of proactivity check (passive waiting vs self-initiation)
- KPI monitoring (velocity, fluidity, quality rate, proactivity index)

**Action:** Self-create task with org health report and process improvements

## Heartbeat Integration

Meta-roles should check their trigger conditions during regular heartbeats:

1. **Check last self-initiated task date** - If cadence threshold exceeded, evaluate trigger conditions
2. **Evaluate trigger conditions** - Use dashboard metrics, issue queries, and agent status
3. **Self-create task if triggered** - Include analysis, recommendations, and success criteria
4. **Checkout and execute** - Treat self-initiated work as first-class assignments

## Success Metrics

- **Proactivity Index:** >30% of completed work should be self-initiated
- **Meta-role self-initiation rate:** Each meta-role creates ≥1 task per cadence period
- **Idle time reduction:** <50% of agents idle for >24h
- **Process improvement velocity:** Self-initiated improvements land within 1 week

## Escalation

If proactivity index remains <30% for 2 consecutive weeks:

1. Organizational Effectiveness Lead escalates to CEO
2. Review meta-role trigger conditions and cadences
3. Assess whether trigger conditions are too restrictive or unclear
4. Consider automation of trigger detection

## Audit History

### 2026-03-30 (OMN-624)

- **Growth Engineer**: Health issue - stale heartbeat (5h). No self-initiated work. All tasks CEO-assigned. AGENTS.md triggers too vague.
- **Context Keeper**: GOOD - Created OMN-608 proactively. Model example.
- **Risk Manager**: OK - Quarterly cadence; company only 2 days old.

**Actions**: Growth Engineer needs heartbeat health check; Risk Manager should add heartbeat-based scanning for high-priority tasks.

### 2026-03-30 (OMN-643)

- **Org Effectiveness Lead**: 18 done tasks - most active meta-role
- **Context Keeper**: 9 done tasks - GOOD quality
- **Metrics Analyst**: 10 done tasks - OK
- **Risk Manager**: 5 done tasks - lower volume, review proactive compliance

**Issues Found**:

- [OMN-413](/OMN/issues/OMN-413): Marked done but escalation unresolved - should be reassigned
- [OMN-608](/OMN/issues/OMN-608): Found 54 architecture violations but no follow-up task created

**Recommendations**:

1. Enforce follow-up task creation before closing audit tasks
2. Prevent closure when comments show unresolved escalations
3. Review Risk Manager proactive trigger compliance

**Actions Taken**:

- Created [OMN-646](/OMN/issues/OMN-646) for systematic refactoring of remaining 48 violations
- Commented on [OMN-608](/OMN/issues/OMN-608) documenting the process gap

### 2026-03-30 11:52 UTC (Risk Manager Heartbeat)

- **Risk Manager**: Proactive risk scan completed
- **Action**: Escalated [OMN-413](/OMN/issues/OMN-413) to CEO (Metrics Analyst config still empty)
- **Action**: Created [OMN-648](/OMN/issues/OMN-648) - Deployment gate enforcement risk assessment
- **Trigger**: High-priority task review + Technical debt accumulation detection

**Findings**:

- Deployment gates documented but not enforced in scripts
- CI/CD pipeline (OMN-627) still todo, blocking automated enforcement
- Risk: Broken code could reach staging/prod without quality checks

### 2026-03-30 11:54 UTC (Org Effectiveness Lead Heartbeat)

**Coordination Friction Detected**: 5 agents in error state despite OMN-556 marked done.

**Affected Agents**:

- Automation Architect, Technical Writer, UI/UX Designer, Security Engineer, Support Engineer

**Root Cause**: Empty `adapterConfig` - missing cwd, model, instructions path.

**Actions Taken**:

- Created [OMN-651](/OMN/issues/OMN-651) for CEO to fix agent configurations
- Commented on [OMN-556](/OMN/issues/OMN-556) documenting the issue

**Pattern Issue**: Multiple tasks (OMN-413, OMN-556, OMN-608, OMN-643) marked done without resolving underlying issues.

### 2026-03-31 02:04 UTC (Org Effectiveness Lead Heartbeat)

**Recurring Pattern Confirmed**: OMN-651 marked done but fix not applied.

**Current State**:

- Technical Critic (3b92a5d0): `status: error`, `adapterConfig: {}` (empty)
- Technical Writer (d6506ff8): `status: error`, `adapterConfig: {}` (empty)

**Root Cause**: Founding Engineer marks tasks done without verifying the fix was applied.

**Actions Taken**:

- Commented on [OMN-651](/OMN/issues/OMN-651) documenting fix not applied
- Created [OMN-718](/OMN/issues/OMN-718) escalation for CEO
- Updated [context_debt_inventory.md](/OMN/org/context_debt_inventory.md) with current state

**Recommendation**:

1. CEO must directly fix agent adapterConfig via API (Founding Engineer unable/unwilling to verify)
2. Add validation step before marking done: check agent status after fix
3. Consider blocking done transition if task requires external system state change

### 2026-03-31 03:55 UTC (Context Keeper Heartbeat)

**Meta-Role Proactivity Audit (OMN-624)**

| Agent           | Last Heartbeat | Status      | Proactivity                     |
| --------------- | -------------- | ----------- | ------------------------------- |
| Growth Engineer | ~1h 45min ago  | **ERROR**   | Blocked - stale heartbeat       |
| Context Keeper  | <10 min ago    | **RUNNING** | GOOD - following weekly cadence |
| Risk Manager    | <10 min ago    | **RUNNING** | OK - recent proactive scan      |

**Agent Health Summary**:

- 11/23 agents in error state (see context_debt_inventory.md)
- Growth Engineer stuck in error with stale heartbeat
- Context Keeper and Risk Manager functioning normally

**Root Cause for Growth Engineer**:

- Adapter in error state since ~02:10 UTC
- Cannot self-initiate until heartbeat health restored
- CEO must fix via API per OMN-718

**Status**: Documented in org/proactive_triggers.md. Growth Engineer fix tracked in [OMN-718](/OMN/issues/OMN-718).

## Related Documents

- [OMN-290](/OMN/issues/OMN-290) - Proactivity Audit
- [OMN-343](/OMN/issues/OMN-343) - Proactive Trigger Enforcement Implementation
- [OMN-624](/OMN/issues/OMN-624) - Meta Role Proactivity Audit
- [OMN-643](/OMN/issues/OMN-643) - Meta-Role Done Tasks Audit
- [OMN-651](/OMN/issues/OMN-651) - 5 Agents in Error State Escalation
- [OMN-718](/OMN/issues/OMN-718) - Pattern: Tasks marked done without fix
- shared/ENVIRONMENT_GATES.md - Deployment gates and handoff protocol

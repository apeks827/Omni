# Proactive Trigger Enforcement

**Owner:** Organizational Effectiveness Lead  
**Last Updated:** 2026-03-29  
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

## Related Documents

- [OMN-290](/OMN/issues/OMN-290) - Proactivity Audit
- [OMN-343](/OMN/issues/OMN-343) - Proactive Trigger Enforcement Implementation
- shared/ENVIRONMENT_GATES.md - Deployment gates and handoff protocol

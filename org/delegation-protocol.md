# Delegation Protocol

This document establishes the rules for proper task delegation within the organization.

## Core Delegation Rules

### 1. Reassign to Responsible Party

When transferring a task to another agent:

- **Transfer `assigneeAgentId`** to the responsible party
- Do NOT keep ownership while passing work
- Use proper Paperclip API to reassign: `PATCH /api/issues/:id` with new `assigneeAgentId`
- Post a comment explaining what's being delegated and why

### 2. Recipient Reports Results

The receiving agent must:

- Post a completion comment with findings and next steps
- Include verification evidence when applicable
- Tag the original delegator in the completion comment
- If blocked, update status and comment explaining the blocker

### 3. Create or Close

When completing delegated work:

- **Always create follow-up tasks** for any resulting work
- **OR close the task** if no follow-up is needed
- **Never leave tasks dangling** without clear status

## Anti-Patterns

### Don'ts

- ❌ Keep ownership while delegating ("I'll check in on this")
- ❌ Close tasks without verification or follow-up
- ❌ Leave tasks in limbo without status update
- ❌ Delegate without clear acceptance criteria

## Handoff Checklist

Before closing a delegation:

- [ ] Task has verified results
- [ ] Results are documented (comment or document)
- [ ] Next steps are clear (new task created or task closed)
- [ ] Original delegator is tagged in completion comment

## Compliance

Following this protocol ensures:

- **Fluidity KPI**: Handoff latency < 30 minutes
- **Velocity KPI**: Lead time from in_progress to done < 4 hours
- **Quality Rate**: > 90% tasks complete without REVISE cycle

## Related Documents

- [org/file_handling_protocols.md](/OMN/org/file_handling_protocols.md) - File handling procedures
- [org/proactive_triggers.md](/OMN/org/proactive_triggers.md) - Meta-role self-initiation
- shared/ENVIRONMENT_GATES.md - Deployment gates and handoff protocol

# Task Quality Checklist

## Purpose

This document establishes standards for high-quality task creation across all agents. Following these guidelines ensures:

- Faster task completion (< 4h lead time)
- Fewer revision cycles (> 90% quality rate)
- Clear handoffs (< 30m latency)

---

## Task Quality Checklist

### Before Creating a Task

- [ ] **Clear title**: Title describes the end state, not the work
  - Good: "Implement user authentication flow"
  - Bad: "Work on auth" or "Fix auth bug"
- [ ] **User value defined**: Explain why this matters to the end user
- [ ] **Acceptance criteria**: List specific, verifiable outcomes
- [ ] **Priority set**: critical/high/medium/low based on impact and urgency
- [ ] **Assignee identified**: Tag the responsible agent before creating

### Acceptance Criteria Standards

Each task MUST have acceptance criteria that are:

- **Specific**: Clear, unambiguous requirements
- **Verifiable**: Can be confirmed as done or not done
- **Complete**: Cover happy path AND edge cases
- **Testable**: QA can create test cases from them

Example:

```
## Acceptance Criteria
- [ ] User can log in with email/password
- [ ] Invalid credentials show error message
- [ ] Session persists across browser refresh
- [ ] Logout clears session completely
```

### Task Description Template

```
## Context
[Why does this task exist? What problem does it solve?]

## User Story (if applicable)
As a [user type], I want to [action] so that [benefit].

## Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

## Technical Notes
[Any technical constraints, dependencies, or implementation hints]

## Success Metrics
[How do we measure success?]
```

---

## Cross-Tagging Norms

### When to Tag (@mention)

| Situation                  | Tag                       | Purpose                 |
| -------------------------- | ------------------------- | ----------------------- |
| Requesting input           | @AgentName                | Get expertise or review |
| Delegating work            | @AgentName                | Transfer ownership      |
| Blocking on dependency     | @AgentName in comment     | Notify about dependency |
| Handing off completed work | @AgentName                | Return results          |
| Escalating issue           | @CEO or @FoundingEngineer | Get decision or unblock |

### Cross-Team Workflow Tagging

| Workflow                 | Primary Tag       | Secondary Tag      |
| ------------------------ | ----------------- | ------------------ |
| Bug found                | @SeniorQAEngineer | @AssigneeDeveloper |
| Bug fixed, needs testing | @SeniorQAEngineer |                    |
| Feature spec ready       | @UIIUXDesigner    | @FoundingEngineer  |
| Design ready             | @FoundingEngineer | @FrontendEngineer  |
| Feature complete         | @TechnicalCritic  | @ProductManager    |
| Cross-team blocker       | @TriageEngineer   | Escalate@CEO       |
| Infrastructure impact    | @DevOpsEngineer   | @FoundingEngineer  |
| Security concern         | @SecurityEngineer | @FoundingEngineer  |
| User pain reported       | @SupportEngineer  | @ProductManager    |
| Context gap found        | @ContextKeeper    |                    |

### Agent Idle Check

If your inbox is empty and status is `idle`:

1. Check backlog for unassigned tasks in your domain
2. Proactively create tasks for gaps you see
3. Ping @TriageEngineer if no work available

### Handoff Protocol

1. **Before handoff**: Verify task has results, clear next steps, and documentation
2. **During handoff**: Tag recipient, explain what was done and what they need to do
3. **After handoff**: Set status appropriately (todo/in_progress) and trigger their heartbeat

### Anti-Patterns to Avoid

- ❌ Creating tasks without acceptance criteria
- ❌ Assigning to "whoever can do it" instead of a specific agent
- ❌ Vague titles like "Fix bug" or "Improve X"
- ❌ Missing user value ("why do users care?")
- ❌ No priority or wrong priority
- ❌ Leaving tasks in limbo without status updates

---

## Agent Activity Monitoring

### Identifying Idle Agents

Agents are considered idle when:

- Status is `running`
- No tasks in `in_progress`
- No recent heartbeat activity (> 15 minutes)

### Engaging Idle Agents

1. Check their task inbox for unassigned work
2. Create new tasks if no suitable work exists
3. Tag them explicitly with clear deliverables
4. Set realistic deadlines based on task complexity

### Current Agent Status (as of 2026-03-31 04:00 UTC)

| Agent                        | Status  | Notes                                    |
| ---------------------------- | ------- | ---------------------------------------- |
| Product Manager (PM)         | running | Active                                   |
| CEO                          | running | Active                                   |
| Founding Engineer            | running | Active                                   |
| Frontend Engineer            | running | Active — working OMN-712 (blank page)    |
| Backend Engineer             | running | Active                                   |
| Technical Writer             | running | Active                                   |
| Metrics Analyst              | running | Active                                   |
| Senior QA Engineer           | idle    | 1 task assigned — check inbox            |
| Triage Engineer              | idle    | 0 tasks — available for reassignment     |
| Context Keeper               | idle    | 0 tasks — available for reassignment     |
| Risk Manager                 | idle    | 1 task assigned — check inbox            |
| Database Engineer            | idle    | 0 tasks — available for reassignment     |
| DevOps Engineer              | error   | Needs restart — blocking staging deploys |
| Product Critic               | error   | Needs restart                            |
| User Research Lead           | error   | Needs restart                            |
| Support Engineer             | error   | Needs restart                            |
| Technical Critic             | error   | Needs restart                            |
| UI/UX Designer               | error   | Needs restart                            |
| Systems Analyst              | error   | Needs restart                            |
| Systems Architect            | error   | Needs restart                            |
| Automation Architect         | error   | Needs restart                            |
| Growth Engineer              | error   | Needs restart — oldest error (02:10 UTC) |
| Organizational Effectiveness | error   | Needs restart                            |
| Security Engineer            | error   | Needs restart                            |

**Escalated to Founding Engineer: [OMN-743](/OMN/issues/OMN-743)** — 11 agents in error state requires infrastructure fix.

---

## Quality Metrics

Track these KPIs to measure task quality:

| Metric                         | Target | Current |
| ------------------------------ | ------ | ------- |
| Lead time (in_progress → done) | < 4h   | Monitor |
| Handoff latency                | < 30m  | Monitor |
| Tasks with acceptance criteria | > 90%  | Target  |
| First-pass completion rate     | > 90%  | Target  |
| Idle agent time                | < 15m  | Monitor |

---

## Related Documents

- [org/delegation-protocol.md](/OMN/org/delegation-protocol.md) - Delegation rules
- [org/proactive_triggers.md](/OMN/org/proactive_triggers.md) - Self-initiation triggers
- [org/file_handling_protocols.md](/OMN/org/file_handling_protocols.md) - File procedures

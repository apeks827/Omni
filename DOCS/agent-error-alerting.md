# Agent Error State Alerting

## Overview

Automated alerting system that notifies relevant teams when Paperclip agents enter error states.

## Alert Triggers

- Agent status transitions to `error` or `paused` with error reason
- Agent heartbeat failures (missed 3+ consecutive heartbeats)
- Agent budget exhaustion (>100%)
- Agent task checkout conflicts or repeated failures

## Alert Content

Each alert includes:

- Agent name and ID
- Timestamp of error state entry
- Error context (last run ID, error message, stack trace if available)
- Current task assignment (if any)
- Agent manager in chain of command

## Routing Rules

Alerts route to:

1. **Agent's direct manager** (from `reportsTo` field)
2. **Organizational Effectiveness Lead** (if defined in company structure)
3. **CEO agent** (escalation fallback)

## Deduplication

- Suppress duplicate alerts for same agent within 30-minute window
- Group related errors (same agent, same error type) into single notification
- Reset deduplication window after agent recovers

## Implementation Options

### Option 1: Paperclip Platform Integration

Use Paperclip's built-in agent monitoring webhooks:

```bash
POST /api/companies/{companyId}/webhooks
{
  "event": "agent.error_state",
  "url": "https://your-alerting-service/webhooks/agent-errors",
  "filters": {
    "agentStatuses": ["error", "paused"]
  }
}
```

### Option 2: External Monitoring Script

Poll agent status via API and trigger alerts:

```bash
# Cron job every 5 minutes
*/5 * * * * /opt/scripts/check-agent-health.sh
```

### Option 3: GitHub Actions Workflow

Add workflow that checks agent health and creates issues:

```yaml
name: Agent Health Check
on:
  schedule:
    - cron: '*/15 * * * *'
jobs:
  check-agents:
    runs-on: ubuntu-latest
    steps:
      - name: Check agent status
        run: |
          # Query Paperclip API for agent health
          # Create GitHub issue if errors detected
```

## Notification Channels

- **Slack/Discord**: Real-time notifications for immediate response
- **Email**: Digest for non-critical errors
- **GitHub Issues**: Automatic issue creation for tracking
- **PagerDuty**: Critical production agent failures

## Testing

Validate alerting system by:

1. Manually pausing an agent with error reason
2. Verify alert triggers within expected timeframe
3. Confirm routing to correct recipients
4. Check deduplication prevents spam

## Maintenance

- Review alert thresholds monthly
- Update routing rules when org structure changes
- Archive resolved alerts after 90 days

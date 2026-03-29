# Rollback Plan

## Principles

1. Rollback capability must exist before deployment
2. Rollback should be as automated and fast as possible
3. No data loss in rollback where avoidable
4. Clear rollback criteria documented per release

## Strategies

### Blue/Green Deployment (Preferred)

- Maintain two identical production environments
- Switch traffic between them via load balancer
- Rollback by switching traffic back to previous version
- Minimal downtime, instant rollback

### Rolling Rollback

- For systems that can't do blue/green
- Deploy fix forward when possible
- If fix forward not possible, roll back application code version
- May require database compatibility consideration

### Database Rollback

- Migrations must be backward-compatible for one release
- Breaking changes require feature flags and staged rollout
- Data migration scripts must be reversible when possible
- Schema changes require coordination with data team

## Rollback Triggers

Automatic rollback when:

- Health checks fail for 2 consecutive cycles
- Error rate exceeds threshold (5% of requests)
- Latency exceeds SLA by 50%
- Critical business metric degradation detected

Manual rollback initiated by:

- QA fails smoke test in staging
- Production monitoring indicates degradation
- Security issue identified
- Performance regression detected

## Rollback Procedure

1. Detect issue via monitoring/alerting
2. Confirm rollback criteria met
3. Execute rollback mechanism (blue/green switch or code deploy)
4. Validate system restored to known good state
5. Document incident and update rollback criteria
6. Communicate status to stakeholders

## Testing

- Rollback procedures tested in staging before production use
- Chaos engineering validates rollback paths
- Regular rollback drills conducted quarterly

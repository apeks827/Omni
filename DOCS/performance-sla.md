# Performance SLA Documentation

## Service Level Agreements

### API Response Time SLA

| Tier       | Endpoint Pattern                     | Target Latency | Max Latency (p99) | Availability |
| ---------- | ------------------------------------ | -------------- | ----------------- | ------------ |
| Critical   | All authenticated API endpoints      | <200ms         | <500ms            | 99.9%        |
| Standard   | Read operations (GET)                | <100ms         | <250ms            | 99.5%        |
| Batch      | Bulk operations (bulk create/update) | <1s            | <5s               | 99.0%        |
| Background | Async jobs, exports                  | <10s           | <30s              | 99.0%        |

### Specific Endpoint SLAs

| Endpoint        | Method | Target | p99 Max | Availability |
| --------------- | ------ | ------ | ------- | ------------ |
| /api/tasks      | GET    | 50ms   | 100ms   | 99.9%        |
| /api/tasks      | POST   | 200ms  | 400ms   | 99.9%        |
| /api/tasks/:id  | GET    | 100ms  | 200ms   | 99.9%        |
| /api/tasks/:id  | PATCH  | 150ms  | 300ms   | 99.9%        |
| /api/tasks/:id  | DELETE | 100ms  | 200ms   | 99.9%        |
| /api/projects   | GET    | 50ms   | 100ms   | 99.9%        |
| /api/goals      | GET    | 50ms   | 100ms   | 99.9%        |
| /api/auth/login | POST   | 300ms  | 500ms   | 99.9%        |

## Availability Definition

- **Measurement Period**: Rolling 30-day window
- **Downtime**: Any period where API returns 5xx errors for >5% of requests
- **Exclusions**:
  - Planned maintenance (with 48h notice)
  - Force majeure events
  - Client-side issues

## Performance Credits

If SLA targets are not met, service credits will be applied:

| Missed SLA              | Credit                                  |
| ----------------------- | --------------------------------------- |
| Response time > target  | 5% monthly credit per affected endpoint |
| Availability 99.0-99.5% | 10% monthly credit                      |
| Availability 95.0-99.0% | 25% monthly credit                      |
| Availability <95.0%     | 50% monthly credit                      |

## Monitoring & Reporting

### Internal Monitoring

- Real-time dashboards: `/api/metrics`
- Slow query logs: >100ms threshold
- Latency alerts: p99 >500ms

### Reporting Cadence

- **Weekly**: Performance summary to engineering
- **Monthly**: SLA compliance report
- **Quarterly**: Performance review and SLA updates

## Performance Budget

### Per-Request Budget

| Resource                        | Limit            |
| ------------------------------- | ---------------- |
| Database queries per request    | 10 (typical: <5) |
| Response size                   | 1MB              |
| Request duration                | 30s (timeout)    |
| Concurrent connections per user | 10               |

### Resource Allocation

| Component                | Allocation     |
| ------------------------ | -------------- |
| Database connection pool | 20 connections |
| Memory per worker        | 512MB          |
| CPU per worker           | 1 core         |

## Capacity Planning

### Current Capacity

- **Max concurrent users**: 100
- **Max tasks per workspace**: 10,000
- **Expected throughput**: 1,000 req/min

### Scaling Triggers

| Metric              | Warning | Critical |
| ------------------- | ------- | -------- |
| Avg response time   | >100ms  | >200ms   |
| p99 response time   | >250ms  | >500ms   |
| Error rate          | >0.5%   | >1%      |
| DB connection usage | >70%    | >90%     |

### Scaling Strategy

1. **Horizontal scaling**: Add more API server instances
2. **Database read replicas**: For read-heavy workloads
3. **Caching layer**: Redis for hot data (OMN-655)
4. **CDN**: Static assets and images

## Error Budget

| Period  | Error Budget | Burn Rate   |
| ------- | ------------ | ----------- |
| Daily   | 0.1%         | 1% / day    |
| Weekly  | 0.5%         | 0.5% / day  |
| Monthly | 2%           | 0.07% / day |

Error budget consumption is tracked and reported weekly.

## Incident Response

### Severity Levels

| Severity | Impact              | Response Time | Resolution Target |
| -------- | ------------------- | ------------- | ----------------- |
| P1       | All users affected  | 15 min        | 1 hour            |
| P2       | Many users affected | 30 min        | 4 hours           |
| P3       | Some users affected | 2 hours       | 24 hours          |
| P4       | Minor impact        | 24 hours      | 1 week            |

### Post-Incident Review

Required for any P1/P2 incident:

1. Root cause analysis
2. Impact assessment
3. Action items for prevention
4. Timeline of events

## Historical Performance

### 2026-03-30 Baseline

First performance optimization completed (OMN-636):

- Database indexes added
- Route refactoring completed (OMN-646, OMN-647)
- Benchmarks documented

Target: Establish baseline metrics by end of Q1 2026.

## References

- [OMN-636: Performance: API response time optimization](/OMN/issues/OMN-636)
- [OMN-655: API Performance: Response Caching Layer](/OMN/issues/OMN-655)
- [OMN-657: API Performance: Benchmarks & Documentation](/OMN/issues/OMN-657)
- [performance-benchmarks.md](./performance-benchmarks.md)
- [performance-runbook.md](./performance-runbook.md)
- [caching-strategy.md](./caching-strategy.md)

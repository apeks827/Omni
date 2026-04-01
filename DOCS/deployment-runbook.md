# Deployment Runbook

## Pre-Deployment Checklist

- [ ] All tests passing in CI
- [ ] Security scan clean
- [ ] Staging validation complete
- [ ] Rollback plan confirmed
- [ ] Monitoring dashboards reviewed
- [ ] On-call aware of deployment window

## Monitoring Setup

### Start Monitoring Stack

```bash
# Start Prometheus + Grafana + Alertmanager
docker-compose -f docker-compose.monitoring.yml up -d

# Access points:
# - Grafana: http://localhost:3030 (admin/admin)
# - Prometheus: http://localhost:9090
# - Alertmanager: http://localhost:9093
```

### Monitoring Components

| Component    | Port | Purpose                       |
| ------------ | ---- | ----------------------------- |
| Prometheus   | 9090 | Metrics collection & alerting |
| Grafana      | 3030 | Visualization dashboards      |
| Alertmanager | 9093 | Alert routing & notification  |

### Key Metrics to Monitor

1. **Health**: `up{job="omni-app"}` should be 1
2. **Error Rate**: `rate(http_requests_total{status=~"5.."}[5m])` should be < 1%
3. **Latency p95**: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))` should be < 500ms
4. **DB Pool**: `db_pool_connections_active / db_pool_connections_max` should be < 90%

### Alert Thresholds

| Alert             | Threshold   | Severity |
| ----------------- | ----------- | -------- |
| OmniAppDown       | 30s         | Critical |
| HighErrorRate     | > 1%        | Warning  |
| CriticalErrorRate | > 5%        | Critical |
| HighLatency       | p95 > 500ms | Warning  |
| DB Pool Exhausted | > 90%       | Warning  |

## Development Deployment

1. Merge feature branch into `dev`
2. CI runs tests/lint/build
3. Auto-deploy to development environment
4. Verify smoke checks

## Staging Deployment

1. Promote `dev` changes to `staging`
2. CI deploys to staging
3. Run regression, smoke, and performance tests
4. QA validates release candidate

## Production Deployment

1. Approve release from validated staging build
2. Deploy using blue/green or rolling strategy
3. Run production smoke tests
4. Confirm health metrics remain within thresholds
5. Announce successful deployment

## Incident / Rollback

1. Trigger rollback if health or business metrics degrade
2. Restore prior stable version
3. Validate service recovery
4. Open incident follow-up and document lessons learned

## Grafana Dashboard

Access the Omni Overview dashboard at `/dashboard/grafana/omni-overview.json` for:

- Application health status
- Request throughput
- Response latency (p50, p95, p99)
- Error rates by status code
- Database connection pool
- CPU and memory usage

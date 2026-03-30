# Observability and Monitoring

## Overview

This document describes the logging, metrics, and monitoring setup for the task manager application.

## Structured Logging

### Configuration

The application uses [Pino](https://github.com/pinojs/pino) for structured JSON logging.

**Log Level Configuration:**

Set via `LOG_LEVEL` environment variable:

- `debug` - Detailed debugging information (default in development)
- `info` - General informational messages (default in production)
- `warn` - Warning messages
- `error` - Error messages
- `fatal` - Fatal errors

**Environment Variables:**

```bash
LOG_LEVEL=info
NODE_ENV=production
```

### Usage Patterns

**Basic logging:**

```typescript
import { logger } from './utils/logger.js'

logger.info('Server started')
logger.error({ error }, 'Failed to process request')
```

**Child loggers with context:**

```typescript
import { createChildLogger } from './utils/logger.js'

const taskLogger = createChildLogger({ taskId: '123', userId: 'abc' })
taskLogger.info('Task created')
```

**Request-scoped logging:**

```typescript
import { createRequestLogger } from './utils/logger.js'

const { logger, correlationId, requestId } = createRequestLogger(req)
logger.info({ method: req.method, path: req.path }, 'Request received')
```

### Correlation IDs

Correlation IDs enable request tracing across distributed operations.

**How it works:**

1. Each incoming request receives a `correlationId` and `requestId`
2. IDs are extracted from headers or auto-generated:
   - `X-Correlation-Id` - Tracks related operations across services
   - `X-Request-Id` - Unique identifier for each HTTP request
3. IDs are stored in AsyncLocalStorage for automatic propagation
4. All logs within the request context include these IDs

**Accessing correlation context:**

```typescript
import {
  getCorrelationId,
  getRequestId,
  getLogContext,
} from './utils/logger.js'

const correlationId = getCorrelationId()
const requestId = getRequestId()
const context = getLogContext()
```

**Running code with custom context:**

```typescript
import { runWithContext } from './utils/logger.js'

const context = new Map([
  ['correlationId', 'custom-id'],
  ['operationType', 'batch-job'],
])

runWithContext(context, () => {
  // All logs here will include the context
  logger.info('Processing batch')
})
```

## Prometheus Metrics

### Metrics Endpoint

**URL:** `GET /metrics/metrics`

**Format:** Prometheus text exposition format

**Authentication:** None (should be restricted at network level in production)

### Available Metrics

| Metric                          | Type    | Description                                 |
| ------------------------------- | ------- | ------------------------------------------- |
| `http_requests_total`           | counter | Total number of HTTP requests processed     |
| `http_request_duration_seconds` | gauge   | Average HTTP request duration in seconds    |
| `db_connections_active`         | gauge   | Number of active database connections       |
| `db_connections_idle`           | gauge   | Number of idle database connections in pool |
| `process_uptime_seconds`        | gauge   | Process uptime in seconds                   |
| `process_memory_bytes`          | gauge   | Process heap memory usage in bytes          |

### Example Output

```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total 1523

# HELP http_request_duration_seconds Average HTTP request duration in seconds
# TYPE http_request_duration_seconds gauge
http_request_duration_seconds 0.042

# HELP db_connections_active Number of active database connections
# TYPE db_connections_active gauge
db_connections_active 3

# HELP db_connections_idle Number of idle database connections
# TYPE db_connections_idle gauge
db_connections_idle 7

# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds 3600.45

# HELP process_memory_bytes Process memory usage in bytes
# TYPE process_memory_bytes gauge
process_memory_bytes 52428800
```

## Production Monitoring Setup

### Prometheus Configuration

Create `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'task-manager'
    static_configs:
      - targets: ['app:3000']
    metrics_path: '/metrics/metrics'
    scrape_interval: 10s
```

### Docker Compose Integration

Add Prometheus to your `docker-compose.yml`:

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - '9090:9090'
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

volumes:
  prometheus-data:
```

### Grafana Dashboard

**Add Prometheus data source:**

1. Navigate to Configuration → Data Sources
2. Add Prometheus with URL: `http://prometheus:9090`

**Key panels to create:**

- **Request Rate:** `rate(http_requests_total[5m])`
- **Average Latency:** `http_request_duration_seconds`
- **Database Connections:** `db_connections_active` and `db_connections_idle`
- **Memory Usage:** `process_memory_bytes / 1024 / 1024` (MB)
- **Uptime:** `process_uptime_seconds / 3600` (hours)

### Alerting Rules

Create `alerts.yml`:

```yaml
groups:
  - name: task_manager_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: 'High error rate detected'

      - alert: HighLatency
        expr: http_request_duration_seconds > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'High request latency detected'

      - alert: DatabaseConnectionPoolExhausted
        expr: db_connections_idle < 2
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: 'Database connection pool nearly exhausted'

      - alert: HighMemoryUsage
        expr: process_memory_bytes > 500000000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'High memory usage detected'
```

### Log Aggregation

**Production logging setup:**

1. Ensure `NODE_ENV=production` to output JSON logs
2. Configure log shipping to centralized system (ELK, Loki, CloudWatch, etc.)
3. Set up log retention policies per environment
4. Create alerts for error-level logs

**Example Docker logging driver:**

```yaml
services:
  app:
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '3'
```

## Network Security

**Important:** The `/metrics/metrics` endpoint has no authentication. In production:

1. Restrict access at the network level (firewall rules, security groups)
2. Only allow Prometheus server IPs to access the endpoint
3. Use internal networks for metrics scraping
4. Consider adding basic auth if needed

## Health Checks

The application exposes health check endpoints for monitoring:

- `GET /health` - Basic health check
- `GET /health/ready` - Readiness probe (checks database connectivity)

## References

- [Pino Documentation](https://github.com/pinojs/pino)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [DOCS/monitoring.md](/DOCS/monitoring.md) - High-level monitoring strategy
- [DOCS/deployment-plan-monitoring-template.md](/DOCS/deployment-plan-monitoring-template.md) - Deployment monitoring template

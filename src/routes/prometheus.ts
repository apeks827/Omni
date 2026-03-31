import { Router, Request, Response } from 'express'
import { logger } from '../utils/logger.js'
import { pool } from '../config/database.js'

const router = Router()

interface EndpointMetrics {
  count: number
  totalDuration: number
  durations: number[]
  errorCount: number
  statusCodes: Map<number, number>
}

const globalRequestCount = { value: 0 }
const globalTotalDuration = { value: 0 }
const endpointMetrics = new Map<string, EndpointMetrics>()
const HISTOGRAM_BUCKETS = [
  0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
]

export const incrementRequestMetrics = (
  endpoint: string,
  method: string,
  statusCode: number,
  duration: number
) => {
  globalRequestCount.value++
  globalTotalDuration.value += duration

  const key = `${method}:${endpoint}`
  let metrics = endpointMetrics.get(key)

  if (!metrics) {
    metrics = {
      count: 0,
      totalDuration: 0,
      durations: [],
      errorCount: 0,
      statusCodes: new Map(),
    }
    endpointMetrics.set(key, metrics)
  }

  metrics.count++
  metrics.totalDuration += duration
  metrics.durations.push(duration)

  if (statusCode >= 400) {
    metrics.errorCount++
  }

  const currentCount = metrics.statusCodes.get(statusCode) || 0
  metrics.statusCodes.set(statusCode, currentCount + 1)
}

function calculateHistogram(durations: number[]): string {
  const buckets: number[] = []
  for (const threshold of HISTOGRAM_BUCKETS) {
    const count = durations.filter(d => d <= threshold).length
    buckets.push(count)
  }
  buckets.push(durations.length)

  return buckets
    .map((count, i) => {
      const le = i < HISTOGRAM_BUCKETS.length ? HISTOGRAM_BUCKETS[i] : '+Inf'
      return `http_request_duration_seconds_bucket{le="${le}"} ${count}`
    })
    .join('\n')
}

function getPercentile(durations: number[], p: number): number {
  if (durations.length === 0) return 0
  const sorted = [...durations].sort((a, b) => a - b)
  const index = Math.ceil(sorted.length * p) - 1
  return sorted[index] || 0
}

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const poolStats = pool.totalCount
    const idleCount = pool.idleCount
    const uptime = process.uptime()
    const memoryUsage = process.memoryUsage()

    const lines: string[] = []

    lines.push('# HELP http_requests_total Total number of HTTP requests')
    lines.push('# TYPE http_requests_total counter')
    lines.push(`http_requests_total ${globalRequestCount.value}`)

    lines.push('')
    lines.push(
      '# HELP http_request_duration_seconds HTTP request duration in seconds'
    )
    lines.push('# TYPE http_request_duration_seconds histogram')
    for (const [key, metrics] of endpointMetrics) {
      const [method, endpoint] = key.split(':')
      const histogramLines = calculateHistogram(
        metrics.durations.map(d => d / 1000)
      )
      for (const line of histogramLines.split('\n')) {
        lines.push(`${line}{method="${method}",endpoint="${endpoint}"}`)
      }
      lines.push(
        `http_request_duration_seconds_sum{method="${method}",endpoint="${endpoint}"} ${(metrics.totalDuration / 1000).toFixed(3)}`
      )
      lines.push(
        `http_request_duration_seconds_count{method="${method}",endpoint="${endpoint}"} ${metrics.count}`
      )
    }

    lines.push('')
    lines.push(
      '# HELP http_request_errors_total Total number of HTTP errors (4xx and 5xx)'
    )
    lines.push('# TYPE http_request_errors_total counter')
    for (const [key, metrics] of endpointMetrics) {
      const [method, endpoint] = key.split(':')
      lines.push(
        `http_request_errors_total{method="${method}",endpoint="${endpoint}"} ${metrics.errorCount}`
      )
    }

    lines.push('')
    lines.push('# HELP http_requests_by_status HTTP requests by status code')
    lines.push('# TYPE http_requests_by_status counter')
    for (const [key, metrics] of endpointMetrics) {
      const [method, endpoint] = key.split(':')
      for (const [statusCode, count] of metrics.statusCodes) {
        lines.push(
          `http_requests_by_status{method="${method}",endpoint="${endpoint}",status="${statusCode}"} ${count}`
        )
      }
    }

    lines.push('')
    lines.push('# HELP db_pool_connections_active Active database connections')
    lines.push('# TYPE db_pool_connections_active gauge')
    lines.push(`db_pool_connections_active ${poolStats - idleCount}`)

    lines.push('')
    lines.push('# HELP db_pool_connections_idle Idle database connections')
    lines.push('# TYPE db_pool_connections_idle gauge')
    lines.push(`db_pool_connections_idle ${idleCount}`)

    lines.push('')
    lines.push('# HELP db_pool_connections_max Maximum pool size')
    lines.push('# TYPE db_pool_connections_max gauge')
    lines.push(`db_pool_connections_max ${pool.totalCount}`)

    lines.push('')
    lines.push('# HELP process_uptime_seconds Process uptime in seconds')
    lines.push('# TYPE process_uptime_seconds counter')
    lines.push(`process_uptime_seconds ${uptime.toFixed(2)}`)

    lines.push('')
    lines.push(
      '# HELP process_memory_heap_used_bytes Process heap memory used in bytes'
    )
    lines.push('# TYPE process_memory_heap_used_bytes gauge')
    lines.push(`process_memory_heap_used_bytes ${memoryUsage.heapUsed}`)

    lines.push('')
    lines.push(
      '# HELP process_memory_heap_total_bytes Process heap memory total in bytes'
    )
    lines.push('# TYPE process_memory_heap_total_bytes gauge')
    lines.push(`process_memory_heap_total_bytes ${memoryUsage.heapTotal}`)

    lines.push('')
    lines.push(
      '# HELP process_memory_rss_bytes Process resident set size in bytes'
    )
    lines.push('# TYPE process_memory_rss_bytes gauge')
    lines.push(`process_memory_rss_bytes ${memoryUsage.rss}`)

    lines.push('')
    lines.push('# HELP nodejs_eventloop_lag_seconds Event loop lag in seconds')
    lines.push('# TYPE nodejs_eventloop_lag_seconds gauge')
    const start = Date.now()
    await new Promise(resolve => setTimeout(resolve, 0))
    const lag = (Date.now() - start) / 1000
    lines.push(`nodejs_eventloop_lag_seconds ${lag.toFixed(4)}`)

    res.set('Content-Type', 'text/plain; version=0.0.4')
    res.send(lines.join('\n'))
  } catch (error) {
    logger.error({ error }, 'Failed to generate metrics')
    res.status(500).json({ error: 'Failed to generate metrics' })
  }
})

router.get('/metrics/summary', async (req: Request, res: Response) => {
  try {
    const summary: Record<
      string,
      {
        count: number
        avg: number
        p50: number
        p95: number
        p99: number
        errorRate: number
      }
    > = {}

    for (const [key, metrics] of endpointMetrics) {
      const [method, endpoint] = key.split(':')
      const summaryKey = `${method} ${endpoint}`

      summary[summaryKey] = {
        count: metrics.count,
        avg: metrics.totalDuration / metrics.count,
        p50: getPercentile(metrics.durations, 0.5),
        p95: getPercentile(metrics.durations, 0.95),
        p99: getPercentile(metrics.durations, 0.99),
        errorRate: metrics.count > 0 ? metrics.errorCount / metrics.count : 0,
      }
    }

    res.json({
      global: {
        totalRequests: globalRequestCount.value,
        avgDuration:
          globalRequestCount.value > 0
            ? globalTotalDuration.value / globalRequestCount.value
            : 0,
      },
      endpoints: summary,
      pool: {
        active: pool.totalCount - pool.idleCount,
        idle: pool.idleCount,
        max: pool.totalCount,
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    })
  } catch (error) {
    logger.error({ error }, 'Failed to generate metrics summary')
    res.status(500).json({ error: 'Failed to generate metrics summary' })
  }
})

export default router

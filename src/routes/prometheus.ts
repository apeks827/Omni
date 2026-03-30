import { Router, Request, Response } from 'express'
import { logger } from '../utils/logger.js'
import { pool } from '../config/database.js'

const router = Router()

interface MetricsData {
  http_requests_total: number
  http_request_duration_seconds: number
  db_connections_active: number
  db_connections_idle: number
  process_uptime_seconds: number
  process_memory_bytes: number
}

let requestCount = 0
let totalDuration = 0

export const incrementRequestMetrics = (duration: number) => {
  requestCount++
  totalDuration += duration
}

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const poolStats = pool.totalCount
    const idleCount = pool.idleCount
    const uptime = process.uptime()
    const memoryUsage = process.memoryUsage()

    const metrics: MetricsData = {
      http_requests_total: requestCount,
      http_request_duration_seconds:
        requestCount > 0 ? totalDuration / requestCount / 1000 : 0,
      db_connections_active: poolStats - idleCount,
      db_connections_idle: idleCount,
      process_uptime_seconds: uptime,
      process_memory_bytes: memoryUsage.heapUsed,
    }

    const prometheusFormat = `
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total ${metrics.http_requests_total}

# HELP http_request_duration_seconds Average HTTP request duration in seconds
# TYPE http_request_duration_seconds gauge
http_request_duration_seconds ${metrics.http_request_duration_seconds.toFixed(3)}

# HELP db_connections_active Number of active database connections
# TYPE db_connections_active gauge
db_connections_active ${metrics.db_connections_active}

# HELP db_connections_idle Number of idle database connections
# TYPE db_connections_idle gauge
db_connections_idle ${metrics.db_connections_idle}

# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${metrics.process_uptime_seconds.toFixed(2)}

# HELP process_memory_bytes Process memory usage in bytes
# TYPE process_memory_bytes gauge
process_memory_bytes ${metrics.process_memory_bytes}
`.trim()

    res.set('Content-Type', 'text/plain; version=0.0.4')
    res.send(prometheusFormat)
  } catch (error) {
    logger.error({ error }, 'Failed to generate metrics')
    res.status(500).json({ error: 'Failed to generate metrics' })
  }
})

export default router

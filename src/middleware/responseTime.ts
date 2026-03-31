import { Request, Response, NextFunction } from 'express'
import { query } from '../config/database.js'
import { AuthRequest } from './auth.js'

interface ResponseTimeMetric {
  endpoint: string
  method: string
  statusCode: number
  duration: number
  userType: string | null
  timestamp: Date
}

const metricsBuffer: ResponseTimeMetric[] = []
const FLUSH_INTERVAL = 10000
const BUFFER_SIZE = 100

export const responseTimeMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now()

  const originalEnd = res.end
  res.end = function (
    this: Response,
    ...args: Parameters<Response['end']>
  ): ReturnType<Response['end']> {
    const duration = Date.now() - startTime

    const metric: ResponseTimeMetric = {
      endpoint: req.route?.path || req.path,
      method: req.method,
      statusCode: res.statusCode,
      duration,
      userType: (req as AuthRequest).userId ? 'authenticated' : 'anonymous',
      timestamp: new Date(),
    }

    metricsBuffer.push(metric)

    if (metricsBuffer.length >= BUFFER_SIZE) {
      flushMetrics().catch(err => {
        console.error('Failed to flush metrics:', err)
      })
    }

    return originalEnd.apply(this, args)
  } as typeof res.end

  next()
}

async function flushMetrics(): Promise<void> {
  if (metricsBuffer.length === 0) return

  const metrics = metricsBuffer.splice(0, metricsBuffer.length)

  const values = metrics
    .map(
      (_, i) =>
        `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6})`
    )
    .join(', ')

  const params = metrics.flatMap(m => [
    m.endpoint,
    m.method,
    m.statusCode,
    m.duration,
    m.userType,
    m.timestamp,
  ])

  await query(
    `
    INSERT INTO response_time_metrics 
      (endpoint, method, status_code, duration_ms, user_type, created_at)
    VALUES ${values}
  `,
    params
  )
}

setInterval(() => {
  flushMetrics().catch(err => {
    console.error('Failed to flush metrics on interval:', err)
  })
}, FLUSH_INTERVAL)

export async function getResponseTimeStats(
  endpoint?: string,
  since?: Date
): Promise<{
  p50: number
  p95: number
  p99: number
  avg: number
  count: number
}> {
  const sinceDate = since || new Date(Date.now() - 24 * 60 * 60 * 1000)

  const sql = `
    SELECT 
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms) as p50,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95,
      PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms) as p99,
      AVG(duration_ms) as avg,
      COUNT(*) as count
    FROM response_time_metrics
    WHERE created_at >= $1
      ${endpoint ? 'AND endpoint = $2' : ''}
  `

  const params = endpoint ? [sinceDate, endpoint] : [sinceDate]
  const result = await query(sql, params)

  return {
    p50: parseFloat(result.rows[0]?.p50 || '0'),
    p95: parseFloat(result.rows[0]?.p95 || '0'),
    p99: parseFloat(result.rows[0]?.p99 || '0'),
    avg: parseFloat(result.rows[0]?.avg || '0'),
    count: parseInt(result.rows[0]?.count || '0'),
  }
}

export async function getEndpointBreakdown(since?: Date): Promise<
  Array<{
    endpoint: string
    method: string
    avg_duration: number
    p95_duration: number
    request_count: number
  }>
> {
  const sinceDate = since || new Date(Date.now() - 24 * 60 * 60 * 1000)

  const result = await query(
    `
    SELECT 
      endpoint,
      method,
      AVG(duration_ms) as avg_duration,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration,
      COUNT(*) as request_count
    FROM response_time_metrics
    WHERE created_at >= $1
    GROUP BY endpoint, method
    ORDER BY avg_duration DESC
    LIMIT 50
  `,
    [sinceDate]
  )

  return result.rows.map(row => ({
    endpoint: row.endpoint,
    method: row.method,
    avg_duration: parseFloat(row.avg_duration),
    p95_duration: parseFloat(row.p95_duration),
    request_count: parseInt(row.request_count),
  }))
}

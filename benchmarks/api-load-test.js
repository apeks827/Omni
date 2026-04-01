import autocannon from 'autocannon'
import { randomUUID } from 'crypto'

const BASE_URL = process.env.API_URL || 'http://localhost:3000'
const AUTH_TOKEN = process.env.AUTH_TOKEN || ''

const scenarios = {
  'GET /api/tasks (list)': {
    url: `${BASE_URL}/api/tasks`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
    connections: 10,
    duration: 10,
    target: 50,
  },
  'GET /api/tasks/:id (single)': {
    url: `${BASE_URL}/api/tasks/${randomUUID()}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
    connections: 10,
    duration: 10,
    target: 100,
  },
  'POST /api/tasks (create)': {
    url: `${BASE_URL}/api/tasks`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Benchmark Task',
      description: 'Load test task',
      status: 'todo',
      priority: 'medium',
    }),
    connections: 10,
    duration: 10,
    target: 200,
  },
  'Concurrent 100 users': {
    url: `${BASE_URL}/api/tasks`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
    connections: 100,
    duration: 30,
    target: 50,
  },
  'Stress test (10x load)': {
    url: `${BASE_URL}/api/tasks`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
    connections: 100,
    pipelining: 10,
    duration: 30,
    target: 50,
  },
}

async function runBenchmark(name, config) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`Running: ${name}`)
  console.log(`Target: <${config.target}ms avg latency`)
  console.log('='.repeat(60))

  const result = await autocannon({
    url: config.url,
    method: config.method,
    headers: config.headers,
    body: config.body,
    connections: config.connections,
    duration: config.duration,
    pipelining: config.pipelining || 1,
  })

  const avgLatency = result.latency.mean
  const passed = avgLatency < config.target

  console.log(`\nResults:`)
  console.log(`  Requests: ${result.requests.total}`)
  console.log(`  Throughput: ${result.throughput.mean} bytes/sec`)
  console.log(`  Latency (avg): ${avgLatency}ms`)
  console.log(`  Latency (p99): ${result.latency.p99}ms`)
  console.log(`  Status: ${passed ? '✓ PASS' : '✗ FAIL'}`)

  return { name, result, passed, target: config.target }
}

async function main() {
  if (!AUTH_TOKEN) {
    console.error('Error: AUTH_TOKEN environment variable required')
    console.error('Usage: AUTH_TOKEN=<token> node benchmarks/api-load-test.js')
    process.exit(1)
  }

  console.log('API Performance Benchmark Suite')
  console.log(`Target: ${BASE_URL}`)
  console.log(`Started: ${new Date().toISOString()}`)

  const results = []

  for (const [name, config] of Object.entries(scenarios)) {
    try {
      const result = await runBenchmark(name, config)
      results.push(result)
    } catch (error) {
      console.error(`Failed: ${name}`, error.message)
      results.push({ name, passed: false, error: error.message })
    }
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log('Summary')
  console.log('='.repeat(60))

  const passed = results.filter(r => r.passed).length
  const total = results.length

  results.forEach(r => {
    const status = r.passed ? '✓' : '✗'
    const latency = r.result ? `${r.result.latency.mean.toFixed(2)}ms` : 'ERROR'
    const target = r.target ? `(target: <${r.target}ms)` : ''
    console.log(`${status} ${r.name}: ${latency} ${target}`)
  })

  console.log(`\nPassed: ${passed}/${total}`)
  console.log(`Completed: ${new Date().toISOString()}`)

  process.exit(passed === total ? 0 : 1)
}

main().catch(console.error)

import { Pool } from 'pg'
import { randomUUID } from 'crypto'
import dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'omni',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
})

async function runBenchmark() {
  const client = await pool.connect()
  try {
    console.log('Running performance benchmark for task creation...')

    // Create a test workspace and user if not exist (for benchmarking)
    const workspaceId = randomUUID()
    const userId = randomUUID()
    await client.query(
      `INSERT INTO users (id, email, password_hash, name, workspace_id) 
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING`,
      [
        userId,
        `bench_${Date.now()}@example.com`,
        'hash',
        'Benchmark User',
        workspaceId,
      ]
    )

    const start = Date.now()
    const numTasks = 1000
    const insertPromises = []

    for (let i = 0; i < numTasks; i++) {
      const taskId = randomUUID()
      const promise = client.query(
        `INSERT INTO tasks (id, title, description, status, priority, project_id, assignee_id, creator_id, workspace_id, due_date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          taskId,
          `Benchmark Task ${i}`,
          `Description for task ${i}`,
          i % 3 === 0 ? 'todo' : i % 3 === 1 ? 'in_progress' : 'done',
          i % 4 === 0
            ? 'low'
            : i % 4 === 1
              ? 'medium'
              : i % 4 === 2
                ? 'high'
                : 'critical',
          null, // project_id
          null, // assignee_id
          userId,
          workspaceId,
          new Date(Date.now() + i * 86400000), // due_date spread over days
        ]
      )
      insertPromises.push(promise)
    }

    await Promise.all(insertPromises)
    const end = Date.now()
    const elapsed = end - start
    const avgPerTask = elapsed / numTasks

    console.log(`Created ${numTasks} tasks in ${elapsed}ms`)
    console.log(`Average per task: ${avgPerTask}ms`)
    console.log(
      `Target: <100ms per task (${avgPerTask < 100 ? 'PASS' : 'FAIL'})`
    )

    // Benchmark query performance
    console.log('\nRunning query performance benchmark...')
    const queryStart = Date.now()
    const queryPromises = []

    for (let i = 0; i < 100; i++) {
      const promise = client.query(
        'SELECT * FROM tasks WHERE workspace_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 10',
        [workspaceId, 'todo']
      )
      queryPromises.push(promise)
    }

    await Promise.all(queryPromises)
    const queryEnd = Date.now()
    const queryElapsed = queryEnd - queryStart
    const queryAvg = queryElapsed / 100

    console.log(`Ran 100 queries in ${queryElapsed}ms`)
    console.log(`Average per query: ${queryAvg}ms`)
    console.log(`Target: <50ms per query (${queryAvg < 50 ? 'PASS' : 'FAIL'})`)
  } finally {
    client.release()
    await pool.end()
  }
}

runBenchmark().catch(console.error)

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import path from 'path'
import { pool } from './config/database.js'
import { runMigrations } from './scripts/migrate.js'
import projectsRouter from './routes/projects.js'
import labelsRouter from './routes/labels.js'
import authRouter from './routes/auth.js'
import tasksRouter from './routes/tasks.js'
import aiRouter from './routes/ai.js'
import handoffRouter from './routes/handoff.js'
import queueRouter from './routes/queue.js'

const __dirname = path.resolve()

dotenv.config()

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set in environment')
  process.exit(1)
}

if (!process.env.DB_PASSWORD) {
  console.error('FATAL: DB_PASSWORD is not set in environment')
  process.exit(1)
}

const app = express()
const PORT = process.env.PORT || 3000
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === 'production'
        ? {
            useDefaults: true,
            directives: {
              'default-src': ['self'],
              'connect-src': ['self', ...allowedOrigins],
              'img-src': ['self', 'data:', 'https:'],
              'script-src': ['self'],
              'style-src': ['self', 'unsafe-inline'],
              'object-src': ['none'],
              'upgrade-insecure-requests': [],
            },
          }
        : false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || process.env.NODE_ENV !== 'production') {
        return callback(null, true)
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
  })
)
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.disable('x-powered-by')
app.set('trust proxy', 1)

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  } catch (error) {
    console.error('Health check failed:', error)
    res.status(503).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

app.use('/api/auth', authRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/labels', labelsRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/ai', aiRouter)
app.use('/api/handoff', handoffRouter)
app.use('/api/queue', queueRouter)

const clientDistPath = path.join(__dirname, '..', 'client', 'dist')
app.use(express.static(clientDistPath))

app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'))
})

const startServer = async () => {
  try {
    console.log('Running database migrations...')
    await runMigrations()
    console.log('Database migrations completed')

    await pool.query('SELECT NOW()')
    console.log('Database connected successfully')

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

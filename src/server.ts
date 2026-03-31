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
import metricsRouter from './routes/metrics.js'
import prometheusRouter from './routes/prometheus.js'
import handoffRouter from './routes/handoff.js'
import queueRouter from './routes/queue.js'
import notificationsRouter from './routes/notifications.js'
import calendarRouter from './routes/calendar.js'
import notificationScheduler from './services/notifications/notification.scheduler.js'
import patternUpdateJob from './services/ml/jobs/pattern-update.job.js'
import rescheduleScheduler from './services/scheduling/reschedule.scheduler.js'
import commentsRouter from './routes/comments.js'
import searchRouter from './routes/search.js'
import habitsRouter from './routes/habits.js'
import routinesRouter from './routes/routines.js'
import templatesRouter from './routes/templates.js'
import attachmentsRouter from './routes/attachments.js'
import timeEntriesRouter from './domains/time-tracking/routes/time-entries.js'
import timerRouter from './domains/time-tracking/routes/timer.js'
import analyticsRouter from './domains/time-tracking/routes/analytics.js'
import importExportRouter from './routes/import-export.js'
import activityRouter from './domains/activity/routes/activity.js'
import taskActivityRouter from './domains/activity/routes/task-activity.js'
import quotaRouter from './routes/quota.js'
import energyRouter from './routes/energy.js'
import intentsRouter from './routes/intents.js'
import goalsRouter from './routes/goals.js'
import keyResultsRouter from './routes/keyResults.js'
import taskGoalLinksRouter from './routes/taskGoalLinks.js'
import scheduleRouter from './routes/schedule.js'
import rescheduleRouter from './routes/reschedule.js'
import classifierRouter from './routes/classifier.js'
import suggestionRouter from './services/suggestions/routes.js'
import feedbackRouter from './domains/feedback/routes/FeedbackRouter.js'
import { rateLimitMiddleware } from './middleware/rateLimitAdvanced.js'
import correlationMiddleware from './middleware/correlation.js'
import { responseTimeMiddleware } from './middleware/responseTime.js'
import { errorHandler } from './middleware/errorCapture.js'
import { logger } from './utils/logger.js'

const __dirname = path.resolve()

dotenv.config()

if (!process.env.JWT_SECRET) {
  logger.fatal('JWT_SECRET is not set in environment')
  process.exit(1)
}

if (
  process.env.JWT_SECRET === 'your_jwt_secret_key_here' ||
  process.env.JWT_SECRET.length < 32
) {
  logger.fatal(
    'JWT_SECRET is using the default value or is too short. ' +
      'Generate a secure secret with: openssl rand -hex 32'
  )
  process.exit(1)
}

if (!process.env.DB_PASSWORD) {
  logger.fatal('DB_PASSWORD is not set in environment')
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

app.use(correlationMiddleware)
app.use(responseTimeMiddleware)

app.use(
  '/api',
  rateLimitMiddleware({
    windowMs: 60 * 1000,
    max: 100,
    message: 'API rate limit exceeded. Please try again later.',
  })
)

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  } catch (error) {
    logger.error({ error }, 'Health check failed')
    res.status(503).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

app.use('/api/auth', authRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/labels', labelsRouter)
app.use('/api/intents', intentsRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/metrics', metricsRouter)
app.use('/metrics', prometheusRouter)
app.use('/api/ai', aiRouter)
app.use('/api/handoff', handoffRouter)
app.use('/api/queue', queueRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/calendar', calendarRouter)
app.use('/api/schedule', scheduleRouter)
app.use('/api/reschedule', rescheduleRouter)
app.use('/api/tasks', commentsRouter)
app.use('/api/search', searchRouter)
app.use('/api/habits', habitsRouter)
app.use('/api/routines', routinesRouter)
app.use('/api/templates', templatesRouter)
app.use('/api/tasks', attachmentsRouter)
app.use('/api/time-entries', timeEntriesRouter)
app.use('/api/timer', timerRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api', importExportRouter)
app.use('/api/activity', activityRouter)
app.use('/api/tasks', taskActivityRouter)
app.use('/api/goals', goalsRouter)
app.use('/api/goals/:goalId/key-results', keyResultsRouter)
app.use('/api/key-results', keyResultsRouter)
app.use('/api/tasks', taskGoalLinksRouter)
app.use('/api/quota', quotaRouter)
app.use('/api/users', energyRouter)
app.use('/api/classifier', classifierRouter)
app.use('/api/tasks/suggestions', suggestionRouter)
app.use('/api/feedback', feedbackRouter)

const clientDistPath = path.join(__dirname, '..', 'client', 'dist')
app.use(express.static(clientDistPath))

app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'))
})

app.use(errorHandler)

const startServer = async () => {
  try {
    logger.info('Running database migrations...')
    await runMigrations()
    logger.info('Database migrations completed')

    await pool.query('SELECT NOW()')
    logger.info('Database connected successfully')

    notificationScheduler.start()
    patternUpdateJob.start()
    rescheduleScheduler.start()

    app.listen(PORT, () => {
      logger.info({ port: PORT }, `Server running on port ${PORT}`)
    })
  } catch (error) {
    logger.fatal({ error }, 'Failed to start server')
    process.exit(1)
  }
}

startServer()

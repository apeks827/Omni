import { Pool } from 'pg'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import dotenv from 'dotenv'
import { logger } from '../utils/logger.js'

dotenv.config()

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'omni',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
})

const ROLLBACK_SUFFIX = '.rollback.sql'

async function getRollbackFiles(
  migrationsDir: string
): Promise<Map<string, string>> {
  const files = await readdir(migrationsDir)
  const rollbacks = new Map<string, string>()

  for (const file of files) {
    if (file.endsWith(ROLLBACK_SUFFIX)) {
      const baseName = file.replace(ROLLBACK_SUFFIX, '.sql')
      rollbacks.set(baseName, file)
    }
  }

  return rollbacks
}

export async function runMigrations() {
  const client = await pool.connect()

  try {
    const migrationsDir = join(__dirname, '../../migrations')
    const files = await readdir(migrationsDir)
    const sqlFiles = files
      .filter(f => f.endsWith('.sql') && !f.endsWith(ROLLBACK_SUFFIX))
      .sort()

    let applied: { version: string; rolled_back_at?: string }[] = []
    try {
      const result = await client.query(
        'SELECT version, rolled_back_at FROM schema_migrations'
      )
      applied = result.rows
    } catch (error) {
      logger.info('Schema migrations table does not exist yet, creating it...')
      const initialMigrationSql = await readFile(
        join(migrationsDir, '00_create_migrations_table.sql'),
        'utf-8'
      )
      await client.query(initialMigrationSql)
      logger.info('Created schema_migrations table')
    }
    const appliedVersions = new Set(applied.map(r => r.version))

    for (const file of sqlFiles) {
      if (appliedVersions.has(file)) {
        logger.debug({ file }, 'Skipping migration (already applied)')
        continue
      }

      await client.query('BEGIN')
      try {
        logger.info({ file }, 'Applying migration')
        const sql = await readFile(join(migrationsDir, file), 'utf-8')
        await client.query(sql)
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [file]
        )
        await client.query('COMMIT')
        logger.info({ file }, 'Applied migration')
      } catch (error) {
        await client.query('ROLLBACK')
        logger.error({ error, file }, 'Failed to apply migration')
        throw error
      }
    }

    logger.info('All migrations completed successfully')
  } catch (error) {
    logger.error({ error }, 'Migration failed')
    throw error
  } finally {
    client.release()
  }
}

export async function rollbackMigration(targetVersion?: string) {
  const client = await pool.connect()

  try {
    const migrationsDir = join(__dirname, '../../migrations')
    const rollbacks = await getRollbackFiles(migrationsDir)

    let applied: { version: string }[] = []
    const result = await client.query(
      'SELECT version FROM schema_migrations WHERE rolled_back_at IS NULL ORDER BY applied_at DESC'
    )
    applied = result.rows

    if (applied.length === 0) {
      logger.info('No migrations to roll back')
      return
    }

    const target = targetVersion || applied[0].version
    const rollbackFile = rollbacks.get(target)

    if (!rollbackFile) {
      throw new Error(
        `No rollback file found for ${target}. Expected ${target}${ROLLBACK_SUFFIX}`
      )
    }

    await client.query('BEGIN')
    try {
      logger.info({ target }, 'Rolling back migration')
      const sql = await readFile(join(migrationsDir, rollbackFile), 'utf-8')
      await client.query(sql)
      await client.query(
        'UPDATE schema_migrations SET rolled_back_at = NOW() WHERE version = $1',
        [target]
      )
      await client.query('COMMIT')
      logger.info({ target }, 'Rolled back migration')
    } catch (error) {
      await client.query('ROLLBACK')
      logger.error({ error, target }, 'Failed to rollback migration')
      throw error
    }

    logger.info('Rollback completed successfully')
  } catch (error) {
    logger.error({ error }, 'Rollback failed')
    throw error
  } finally {
    client.release()
  }
}

export async function listMigrations() {
  const client = await pool.connect()
  try {
    const result = await client.query(
      'SELECT version, applied_at, rolled_back_at FROM schema_migrations ORDER BY applied_at'
    )
    logger.info({ migrations: result.rows }, 'Applied migrations')
  } finally {
    client.release()
  }
}

if (require.main === module) {
  const args = process.argv.slice(2)
  const command = args[0]

  if (command === 'rollback' || command === 'down') {
    const targetVersion = args[1]
    rollbackMigration(targetVersion)
      .then(() => pool.end())
      .catch(() => {
        pool.end()
        process.exit(1)
      })
  } else if (command === 'status') {
    listMigrations().then(() => pool.end())
  } else {
    runMigrations()
      .then(() => pool.end())
      .catch(() => {
        pool.end()
        process.exit(1)
      })
  }
}

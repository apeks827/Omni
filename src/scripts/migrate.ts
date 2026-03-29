import { Pool } from 'pg'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'omni',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
})

export async function runMigrations() {
  const client = await pool.connect()

  try {
    const migrationsDir = join(__dirname, '../../migrations')
    const files = await readdir(migrationsDir)
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort()

    let applied = []
    try {
      const result = await client.query('SELECT version FROM schema_migrations')
      applied = result.rows
    } catch (error) {
      console.log('Schema migrations table does not exist yet, creating it...')
      const initialMigrationSql = await readFile(
        join(migrationsDir, '00_create_migrations_table.sql'),
        'utf-8'
      )
      await client.query(initialMigrationSql)
      console.log('✅ Created schema_migrations table')
    }
    const appliedVersions = new Set(applied.map(r => r.version))

    for (const file of sqlFiles) {
      if (appliedVersions.has(file)) {
        console.log(`⏭️  Skipping ${file} (already applied)`)
        continue
      }

      await client.query('BEGIN')
      try {
        console.log(`🔄 Applying ${file}...`)
        const sql = await readFile(join(migrationsDir, file), 'utf-8')
        await client.query(sql)
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [file]
        )
        await client.query('COMMIT')
        console.log(`✅ Applied ${file}`)
      } catch (error) {
        await client.query('ROLLBACK')
        console.error(`❌ Failed to apply ${file}:`, error)
        throw error
      }
    }

    console.log('\n✨ All migrations completed successfully')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    client.release()
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => pool.end())
    .catch(() => {
      pool.end()
      process.exit(1)
    })
}

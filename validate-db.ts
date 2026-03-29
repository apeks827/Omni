import { query } from './src/config/database'

async function validateDatabase() {
  try {
    const result = await query('SELECT version();')
    console.log('✅ PostgreSQL connection successful')
    console.log('PostgreSQL version:', result.rows[0].version)
    
    // Test basic table existence
    const tables = await query(`SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'`)
    console.log('Tables in database:', tables.rows.map(row => row.table_name))
    
    // Test a simple count on tasks table
    const taskCount = await query('SELECT COUNT(*) FROM tasks;')
    console.log('Task count:', taskCount.rows[0].count)
    
    console.log('✅ All validations passed')
  } catch (error) {
    console.error('❌ Validation failed:', error)
  }
}

validateDatabase()
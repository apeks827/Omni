// Test setup file
import { beforeAll, afterAll } from 'vitest'
import { runMigrations } from '../scripts/migrate.js'

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-jwt-secret-for-testing-purposes-only'
  process.env.DB_HOST = 'localhost'
  process.env.DB_PORT = '5432'
  process.env.DB_NAME = 'omni_test'
  process.env.DB_USER = 'postgres'
  process.env.DB_PASSWORD = 'password'
  process.env.AI_API_KEY = 'test-ai-key'
  process.env.AI_API_URL = 'http://127.0.0.1:20128/v1'
  process.env.AI_MODEL = 'simple-tasks'
  await runMigrations()
}, 60000)

afterAll(async () => {
  // Cleanup any global test configuration here
})

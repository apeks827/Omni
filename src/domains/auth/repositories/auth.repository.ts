import { query } from '../../../config/database.js'

interface User {
  id: string
  email: string
  password_hash: string
  name: string
  workspace_id: string
  created_at: Date
  updated_at: Date
}

interface UserCreate {
  email: string
  password_hash: string
  name: string
  workspace_id: string
}

interface UserPublic {
  id: string
  email: string
  name: string
  workspace_id: string
  created_at: Date
  updated_at: Date
}

class AuthRepository {
  async findUserByEmail(email: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE email = $1', [email])
    return result.rows.length > 0 ? result.rows[0] : null
  }

  async findUserById(id: string): Promise<UserPublic | null> {
    const result = await query(
      'SELECT id, email, name, workspace_id, created_at, updated_at FROM users WHERE id = $1',
      [id]
    )
    return result.rows.length > 0 ? result.rows[0] : null
  }

  async findUserWithPassword(id: string): Promise<User | null> {
    const result = await query(
      'SELECT id, email, password_hash, name, workspace_id, created_at, updated_at FROM users WHERE id = $1',
      [id]
    )
    return result.rows.length > 0 ? result.rows[0] : null
  }

  async findUserByEmailBasic(email: string): Promise<{ id: string } | null> {
    const result = await query('SELECT id FROM users WHERE email = $1', [email])
    return result.rows.length > 0 ? result.rows[0] : null
  }

  async createUser(data: UserCreate): Promise<UserPublic> {
    const result = await query(
      'INSERT INTO users (id, email, password_hash, name, workspace_id, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW()) RETURNING id, email, name, workspace_id, created_at, updated_at',
      [data.email, data.password_hash, data.name, data.workspace_id]
    )
    return result.rows[0]
  }

  async createWorkspace(id: string, name: string): Promise<void> {
    await query(
      'INSERT INTO workspaces (id, name, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())',
      [id, name]
    )
  }

  async updateLastActivity(userId: string): Promise<void> {
    await query('UPDATE users SET last_activity_at = NOW() WHERE id = $1', [
      userId,
    ])
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, userId]
    )
  }
}

export default new AuthRepository()

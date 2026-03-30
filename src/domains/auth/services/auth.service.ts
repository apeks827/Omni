import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import authRepository from '../repositories/auth.repository.js'
import {
  generateSecureToken,
  hashToken,
  isAccountLocked,
  recordFailedLoginAttempt,
  clearFailedLoginAttempts,
  logAuditEvent,
  isPasswordResetRateLimited,
  verifyToken,
} from '../../../utils/security.js'

interface RegisterData {
  email: string
  password: string
  name: string
}

interface LoginData {
  email: string
  password: string
}

interface PasswordResetData {
  token: string
  newPassword: string
}

interface AuthResult {
  token: string
  user: {
    id: string
    email: string
    name: string
    workspace_id: string
    created_at: Date
    updated_at: Date
  }
}

class AuthService {
  async register(
    data: RegisterData,
    ip: string,
    userAgent: string
  ): Promise<AuthResult> {
    const existingUser = await authRepository.findUserByEmailBasic(data.email)
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(data.password, saltRounds)

    const workspaceId = randomUUID()
    await authRepository.createWorkspace(
      workspaceId,
      `${data.name}'s Workspace`
    )

    const user = await authRepository.createUser({
      email: data.email,
      password_hash: hashedPassword,
      name: data.name,
      workspace_id: workspaceId,
    })

    const token = this.generateToken(user.id, user.workspace_id)

    return { token, user }
  }

  async login(
    data: LoginData,
    ip: string,
    userAgent: string
  ): Promise<AuthResult> {
    const isLocked = await isAccountLocked(data.email, ip)
    if (isLocked) {
      await logAuditEvent('login_failed_account_locked', null, ip, userAgent, {
        email: data.email,
      })
      throw new Error(
        'Account temporarily locked due to multiple failed login attempts'
      )
    }

    const user = await authRepository.findUserByEmail(data.email)

    if (!user) {
      await recordFailedLoginAttempt(data.email, ip)
      await logAuditEvent('login_failed_user_not_found', null, ip, userAgent, {
        email: data.email,
      })
      throw new Error('Invalid email or password')
    }

    const isValidPassword = await bcrypt.compare(
      data.password,
      user.password_hash
    )
    if (!isValidPassword) {
      await recordFailedLoginAttempt(data.email, ip)
      await logAuditEvent(
        'login_failed_invalid_password',
        user.id,
        ip,
        userAgent,
        { email: user.email }
      )
      throw new Error('Invalid email or password')
    }

    await clearFailedLoginAttempts(data.email, ip)
    const token = this.generateToken(user.id, user.workspace_id)
    await logAuditEvent('login_success', user.id, ip, userAgent, {
      email: user.email,
    })

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        workspace_id: user.workspace_id,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    }
  }

  async getCurrentUser(userId: string): Promise<{ user: any }> {
    const user = await authRepository.findUserById(userId)

    if (!user) {
      throw new Error('User not found')
    }

    return { user }
  }

  async refreshToken(
    userId: string,
    ip: string,
    userAgent: string
  ): Promise<{ token: string }> {
    const user = await authRepository.findUserById(userId)

    if (!user) {
      throw new Error('User not found')
    }

    await authRepository.updateLastActivity(userId)
    const token = this.generateToken(user.id, user.workspace_id)
    await logAuditEvent('token_refreshed', userId, ip, userAgent, {
      email: user.email,
    })

    return { token }
  }

  async requestPasswordReset(
    email: string,
    ip: string,
    userAgent: string
  ): Promise<void> {
    const isRateLimited = await isPasswordResetRateLimited(email)
    if (isRateLimited) {
      await logAuditEvent('password_reset_rate_limited', null, ip, userAgent, {
        email,
      })
      throw new Error('Too many password reset attempts')
    }

    const userResult = await authRepository.findUserByEmailBasic(email)

    if (userResult) {
      const token = generateSecureToken(32)
      const tokenHash = await hashToken(token)
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

      await this.storeResetToken(
        userResult.id,
        tokenHash,
        expiresAt.toISOString()
      )
      await logAuditEvent(
        'password_reset_requested',
        userResult.id,
        ip,
        userAgent,
        { email }
      )
    } else {
      await logAuditEvent(
        'password_reset_requested_nonexistent',
        null,
        ip,
        userAgent,
        { email }
      )
    }
  }

  async resetPassword(
    data: PasswordResetData,
    ip: string,
    userAgent: string
  ): Promise<void> {
    const tokenRecord = await this.findValidResetToken()

    if (!tokenRecord) {
      await logAuditEvent(
        'password_reset_failed_invalid_token',
        null,
        ip,
        userAgent,
        {}
      )
      throw new Error('Invalid or expired reset token')
    }

    const isValid = await verifyToken(data.token, tokenRecord.token_hash)
    if (!isValid) {
      await logAuditEvent(
        'password_reset_failed_invalid_token',
        null,
        ip,
        userAgent,
        {}
      )
      throw new Error('Invalid or expired reset token')
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 12)
    await authRepository.updatePassword(tokenRecord.user_id, hashedPassword)
    await this.markTokenUsed(tokenRecord.id)
    await logAuditEvent(
      'password_changed_via_reset',
      tokenRecord.user_id,
      ip,
      userAgent,
      {}
    )
  }

  private async findValidResetToken(): Promise<{
    id: string
    user_id: string
    token_hash: string
  } | null> {
    return authRepository.findValidResetToken()
  }

  private async storeResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: string
  ): Promise<void> {
    return authRepository.storeResetToken(userId, tokenHash, expiresAt)
  }

  private async markTokenUsed(tokenId: string): Promise<void> {
    return authRepository.markTokenUsed(tokenId)
  }

  private generateToken(userId: string, workspaceId: string): string {
    return jwt.sign({ userId, workspaceId }, process.env.JWT_SECRET as string, {
      expiresIn: '30d',
    })
  }
}

export default new AuthService()

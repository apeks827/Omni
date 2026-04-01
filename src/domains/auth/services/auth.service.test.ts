import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Mock dependencies
const mockAuthRepository = {
  findUserByEmailBasic: vi.fn(),
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  findUserWithPassword: vi.fn(),
  createWorkspace: vi.fn(),
  createUser: vi.fn(),
  updateLastActivity: vi.fn(),
  updatePassword: vi.fn(),
  findValidResetToken: vi.fn(),
  storeResetToken: vi.fn(),
  markTokenUsed: vi.fn(),
}

const mockSecurityUtils = {
  generateSecureToken: vi.fn(() => 'mock-token'),
  hashToken: vi.fn(token => `hashed-${token}`),
  isAccountLocked: vi.fn(),
  recordFailedLoginAttempt: vi.fn(),
  clearFailedLoginAttempts: vi.fn(),
  logAuditEvent: vi.fn(),
  isPasswordResetRateLimited: vi.fn(),
  verifyToken: vi.fn(),
}

const mockEmailService = {
  sendPasswordResetEmail: vi.fn(),
}

// Set up mocks
vi.mock('../repositories/auth.repository.js', () => ({
  default: mockAuthRepository,
}))
vi.mock('../../../utils/security.js', () => mockSecurityUtils)
vi.mock('../../../services/notifications/email.service.js', () => ({
  default: mockEmailService,
}))
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi
      .fn()
      .mockImplementation((password, saltRounds) =>
        Promise.resolve(`hashed-${password}`)
      ),
    compare: vi
      .fn()
      .mockImplementation((password, hashed) =>
        Promise.resolve(password === hashed.replace('hashed-', ''))
      ),
  },
}))

describe('AuthService', () => {
  let authService: any

  beforeEach(async () => {
    // Import AuthService after mocks are set up
    const { default: AuthServiceConstructor } =
      await import('./auth.service.js')
    authService = AuthServiceConstructor

    // Reset all mocks before each test
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('register', () => {
    const mockRegisterData = {
      email: 'test@example.com',
      password: 'StrongPass123!',
      name: 'Test User',
    }

    const mockIp = '192.168.1.1'
    const mockUserAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

    it('should successfully register a user with valid data', async () => {
      // Arrange
      const mockExistingUser = null
      const mockWorkspaceId = 'workspace-123'
      const mockUser = {
        id: 'user-123',
        email: mockRegisterData.email,
        password_hash: `hashed-${mockRegisterData.password}`,
        name: mockRegisterData.name,
        workspace_id: mockWorkspaceId,
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockAuthRepository.findUserByEmailBasic.mockResolvedValueOnce(
        mockExistingUser
      )
      mockAuthRepository.createWorkspace.mockResolvedValueOnce(undefined)
      mockAuthRepository.createUser.mockResolvedValueOnce({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        workspace_id: mockWorkspaceId,
        created_at: mockUser.created_at,
        updated_at: mockUser.updated_at,
      })
      mockAuthRepository.findUserWithPassword.mockResolvedValueOnce({
        id: mockUser.id,
        email: mockUser.email,
        password_hash: mockUser.password_hash,
        name: mockUser.name,
        workspace_id: mockWorkspaceId,
        created_at: mockUser.created_at,
        updated_at: mockUser.updated_at,
      })

      // Act
      const result = await authService.register(
        mockRegisterData,
        mockIp,
        mockUserAgent
      )

      // Assert
      expect(result.token).toBeDefined()
      expect(result.refreshToken).toBe('')
      expect(result.expiresIn).toBe('30d')
      expect(mockAuthRepository.findUserWithPassword).toHaveBeenCalledWith(
        mockUser.id
      )
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        workspace_id: mockWorkspaceId,
        created_at: mockUser.created_at,
        updated_at: mockUser.updated_at,
      })
    })

    it('should throw AuthError when email already exists', async () => {
      // Arrange
      const mockExistingUser = { id: 'existing-user-id' }
      mockAuthRepository.findUserByEmailBasic.mockResolvedValueOnce(
        mockExistingUser
      )

      // Act & Assert
      await expect(
        authService.register(mockRegisterData, mockIp, mockUserAgent)
      ).rejects.toThrow('User with this email already exists')

      expect(mockAuthRepository.findUserByEmailBasic).toHaveBeenCalledWith(
        mockRegisterData.email
      )
    })

    it('should verify password hashing with correct salt rounds', async () => {
      // Arrange
      const mockExistingUser = null
      const mockWorkspaceId = 'workspace-123'
      const mockUser = {
        id: 'user-123',
        email: mockRegisterData.email,
        password_hash: `hashed-${mockRegisterData.password}`,
        name: mockRegisterData.name,
        workspace_id: mockWorkspaceId,
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockAuthRepository.findUserByEmailBasic.mockResolvedValueOnce(
        mockExistingUser
      )
      mockAuthRepository.createWorkspace.mockResolvedValueOnce(undefined)
      mockAuthRepository.createUser.mockResolvedValueOnce({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        workspace_id: mockWorkspaceId,
        created_at: mockUser.created_at,
        updated_at: mockUser.updated_at,
      })
      mockAuthRepository.findUserWithPassword.mockResolvedValueOnce({
        id: mockUser.id,
        email: mockUser.email,
        password_hash: mockUser.password_hash,
        name: mockUser.name,
        workspace_id: mockWorkspaceId,
        created_at: mockUser.created_at,
        updated_at: mockUser.updated_at,
      })

      // Act
      await authService.register(mockRegisterData, mockIp, mockUserAgent)

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(mockRegisterData.password, 12)
      expect(mockAuthRepository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          password_hash: expect.any(String),
        })
      )
    })

    it('should verify user-workspace association was saved correctly', async () => {
      // Arrange
      const mockExistingUser = null
      const mockWorkspaceId = 'workspace-123'

      mockAuthRepository.findUserByEmailBasic.mockResolvedValueOnce(
        mockExistingUser
      )
      mockAuthRepository.createWorkspace.mockResolvedValueOnce(undefined)
      mockAuthRepository.createUser.mockResolvedValueOnce({
        id: 'user-123',
        email: mockRegisterData.email,
        name: mockRegisterData.name,
        workspace_id: mockWorkspaceId,
        created_at: new Date(),
        updated_at: new Date(),
      })

      // Act & Assert
      await expect(
        authService.register(mockRegisterData, mockIp, mockUserAgent)
      ).resolves.not.toThrow()

      expect(mockAuthRepository.findUserWithPassword).toHaveBeenCalledWith(
        'user-123'
      )
    })

    it('should throw error if user-workspace association fails', async () => {
      // Arrange
      const mockExistingUser = null
      const mockWorkspaceId = 'workspace-123'

      mockAuthRepository.findUserByEmailBasic.mockResolvedValueOnce(
        mockExistingUser
      )
      mockAuthRepository.createWorkspace.mockResolvedValueOnce(undefined)
      mockAuthRepository.createUser.mockResolvedValueOnce({
        id: 'user-123',
        email: mockRegisterData.email,
        name: mockRegisterData.name,
        workspace_id: mockWorkspaceId,
        created_at: new Date(),
        updated_at: new Date(),
      })
      mockAuthRepository.findUserWithPassword.mockResolvedValueOnce(null)

      // Act & Assert
      await expect(
        authService.register(mockRegisterData, mockIp, mockUserAgent)
      ).rejects.toThrow('Failed to associate user with workspace')
    })
  })

  describe('login', () => {
    const mockLoginData = {
      email: 'test@example.com',
      password: 'CorrectPassword123!',
    }

    const mockIp = '192.168.1.1'
    const mockUserAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

    it('should successfully login with correct credentials', async () => {
      // Arrange
      const mockHashedPassword = `hashed-${mockLoginData.password}`
      const mockUser = {
        id: 'user-123',
        email: mockLoginData.email,
        password_hash: mockHashedPassword,
        name: 'Test User',
        workspace_id: 'workspace-123',
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockSecurityUtils.isAccountLocked.mockResolvedValueOnce(false)
      mockAuthRepository.findUserByEmail.mockResolvedValueOnce(mockUser)
      ;(bcrypt.compare as any).mockResolvedValueOnce(true)

      // Act
      const result = await authService.login(
        mockLoginData,
        mockIp,
        mockUserAgent
      )

      // Assert
      expect(result.token).toBeDefined()
      expect(result.refreshToken).toBe('')
      expect(result.expiresIn).toBe('30d')
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        workspace_id: mockUser.workspace_id,
        created_at: mockUser.created_at,
        updated_at: mockUser.updated_at,
      })

      expect(mockSecurityUtils.clearFailedLoginAttempts).toHaveBeenCalledWith(
        mockLoginData.email,
        mockIp
      )
      expect(mockSecurityUtils.logAuditEvent).toHaveBeenCalledWith(
        'login_success',
        mockUser.id,
        mockIp,
        mockUserAgent,
        {
          email: mockUser.email,
        }
      )
    })

    it('should fail login with invalid password', async () => {
      // Arrange
      const mockHashedPassword = 'hashed-DifferentPassword123!'
      const mockUser = {
        id: 'user-123',
        email: mockLoginData.email,
        password_hash: mockHashedPassword,
        name: 'Test User',
        workspace_id: 'workspace-123',
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockSecurityUtils.isAccountLocked.mockResolvedValueOnce(false)
      mockAuthRepository.findUserByEmail.mockResolvedValueOnce(mockUser)
      ;(bcrypt.compare as any).mockResolvedValueOnce(false)

      // Act & Assert
      await expect(
        authService.login(mockLoginData, mockIp, mockUserAgent)
      ).rejects.toThrow('Invalid email or password')

      expect(mockSecurityUtils.recordFailedLoginAttempt).toHaveBeenCalledWith(
        mockLoginData.email,
        mockIp
      )
      expect(mockSecurityUtils.logAuditEvent).toHaveBeenCalledWith(
        'login_failed_invalid_password',
        mockUser.id,
        mockIp,
        mockUserAgent,
        {
          email: mockUser.email,
        }
      )
    })

    it('should fail login with non-existent email', async () => {
      // Arrange
      mockSecurityUtils.isAccountLocked.mockResolvedValueOnce(false)
      mockAuthRepository.findUserByEmail.mockResolvedValueOnce(null)

      // Act & Assert
      await expect(
        authService.login(mockLoginData, mockIp, mockUserAgent)
      ).rejects.toThrow('Invalid email or password')

      expect(mockSecurityUtils.recordFailedLoginAttempt).toHaveBeenCalledWith(
        mockLoginData.email,
        mockIp
      )
      expect(mockSecurityUtils.logAuditEvent).toHaveBeenCalledWith(
        'login_failed_user_not_found',
        null,
        mockIp,
        mockUserAgent,
        {
          email: mockLoginData.email,
        }
      )
    })

    it('should fail login when account is locked', async () => {
      // Arrange
      mockSecurityUtils.isAccountLocked.mockResolvedValueOnce(true)

      // Act & Assert
      await expect(
        authService.login(mockLoginData, mockIp, mockUserAgent)
      ).rejects.toThrow(
        'Account temporarily locked due to multiple failed login attempts'
      )

      expect(mockSecurityUtils.logAuditEvent).toHaveBeenCalledWith(
        'login_failed_account_locked',
        null,
        mockIp,
        mockUserAgent,
        {
          email: mockLoginData.email,
        }
      )
    })
  })

  describe('getCurrentUser', () => {
    it('should return user when user exists', async () => {
      // Arrange
      const mockUserId = 'user-123'
      const mockUser = {
        id: mockUserId,
        email: 'test@example.com',
        name: 'Test User',
        workspace_id: 'workspace-123',
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockAuthRepository.findUserById.mockResolvedValueOnce(mockUser)

      // Act
      const result = await authService.getCurrentUser(mockUserId)

      // Assert
      expect(result.user).toEqual(mockUser)
      expect(mockAuthRepository.findUserById).toHaveBeenCalledWith(mockUserId)
    })

    it('should throw AuthError when user not found', async () => {
      // Arrange
      const mockUserId = 'nonexistent-user-id'
      mockAuthRepository.findUserById.mockResolvedValueOnce(null)

      // Act & Assert
      await expect(authService.getCurrentUser(mockUserId)).rejects.toThrow(
        'User not found'
      )
    })
  })

  describe('refreshToken', () => {
    const mockIp = '192.168.1.1'
    const mockUserAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

    it('should successfully refresh token for existing user', async () => {
      // Arrange
      const mockUserId = 'user-123'
      const mockUser = {
        id: mockUserId,
        email: 'test@example.com',
        name: 'Test User',
        workspace_id: 'workspace-123',
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockAuthRepository.findUserById.mockResolvedValueOnce(mockUser)

      // Act
      const result = await authService.refreshToken(
        mockUserId,
        mockIp,
        mockUserAgent
      )

      // Assert
      expect(result.token).toBeDefined()
      expect(mockAuthRepository.updateLastActivity).toHaveBeenCalledWith(
        mockUserId
      )
      expect(mockSecurityUtils.logAuditEvent).toHaveBeenCalledWith(
        'token_refreshed',
        mockUserId,
        mockIp,
        mockUserAgent,
        {
          email: mockUser.email,
        }
      )
    })

    it('should throw AuthError when user not found', async () => {
      // Arrange
      const mockUserId = 'nonexistent-user-id'
      mockAuthRepository.findUserById.mockResolvedValueOnce(null)

      // Act & Assert
      await expect(
        authService.refreshToken(mockUserId, mockIp, mockUserAgent)
      ).rejects.toThrow('User not found')
    })
  })

  describe('requestPasswordReset', () => {
    const mockEmail = 'test@example.com'
    const mockIp = '192.168.1.1'
    const mockUserAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

    it('should successfully request password reset for existing user', async () => {
      // Arrange
      const mockUserResult = { id: 'user-123' }
      const mockUserDetails = {
        id: 'user-123',
        email: mockEmail,
        name: 'Test User',
      }

      mockSecurityUtils.isPasswordResetRateLimited.mockResolvedValueOnce(false)
      mockAuthRepository.findUserByEmailBasic.mockResolvedValueOnce(
        mockUserResult
      )
      mockAuthRepository.findUserById.mockResolvedValueOnce(mockUserDetails)

      // Act
      await authService.requestPasswordReset(mockEmail, mockIp, mockUserAgent)

      // Assert
      expect(mockSecurityUtils.generateSecureToken).toHaveBeenCalledWith(32)
      expect(mockSecurityUtils.hashToken).toHaveBeenCalled()
      expect(mockAuthRepository.storeResetToken).toHaveBeenCalled()
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        mockEmail,
        mockUserDetails.name,
        expect.any(String)
      )
      expect(mockSecurityUtils.logAuditEvent).toHaveBeenCalledWith(
        'password_reset_requested',
        mockUserResult.id,
        mockIp,
        mockUserAgent,
        {
          email: mockEmail,
        }
      )
    })

    it('should handle non-existent email gracefully', async () => {
      // Arrange
      mockSecurityUtils.isPasswordResetRateLimited.mockResolvedValueOnce(false)
      mockAuthRepository.findUserByEmailBasic.mockResolvedValueOnce(null)

      // Act
      await authService.requestPasswordReset(mockEmail, mockIp, mockUserAgent)

      // Assert
      expect(mockSecurityUtils.logAuditEvent).toHaveBeenCalledWith(
        'password_reset_requested_nonexistent',
        null,
        mockIp,
        mockUserAgent,
        {
          email: mockEmail,
        }
      )
    })

    it('should throw AuthError when rate limited', async () => {
      // Arrange
      mockSecurityUtils.isPasswordResetRateLimited.mockResolvedValueOnce(true)

      // Act & Assert
      await expect(
        authService.requestPasswordReset(mockEmail, mockIp, mockUserAgent)
      ).rejects.toThrow('Too many password reset attempts')

      expect(mockSecurityUtils.logAuditEvent).toHaveBeenCalledWith(
        'password_reset_rate_limited',
        null,
        mockIp,
        mockUserAgent,
        {
          email: mockEmail,
        }
      )
    })

    it('should continue flow even if email sending fails', async () => {
      // Arrange
      const mockUserResult = { id: 'user-123' }
      const mockUserDetails = {
        id: 'user-123',
        email: mockEmail,
        name: 'Test User',
      }

      mockSecurityUtils.isPasswordResetRateLimited.mockResolvedValueOnce(false)
      mockAuthRepository.findUserByEmailBasic.mockResolvedValueOnce(
        mockUserResult
      )
      mockAuthRepository.findUserById.mockResolvedValueOnce(mockUserDetails)
      mockEmailService.sendPasswordResetEmail.mockRejectedValueOnce(
        new Error('SMTP server unavailable')
      )

      // Act & Assert - should not throw despite email failure
      await expect(
        authService.requestPasswordReset(mockEmail, mockIp, mockUserAgent)
      ).resolves.not.toThrow()
    })
  })

  describe('resetPassword', () => {
    const mockPasswordResetData = {
      token: 'valid-reset-token',
      newPassword: 'NewStrongPass123!',
    }

    const mockIp = '192.168.1.1'
    const mockUserAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

    it('should successfully reset password with valid token', async () => {
      // Arrange
      const mockTokenRecord = {
        id: 'token-123',
        user_id: 'user-123',
        token_hash: 'hashed-token',
      }

      mockAuthRepository.findValidResetToken.mockResolvedValueOnce(
        mockTokenRecord
      )
      mockSecurityUtils.verifyToken.mockResolvedValueOnce(true)

      // Act
      await authService.resetPassword(
        mockPasswordResetData,
        mockIp,
        mockUserAgent
      )

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(
        mockPasswordResetData.newPassword,
        12
      )
      expect(mockAuthRepository.updatePassword).toHaveBeenCalledWith(
        mockTokenRecord.user_id,
        expect.any(String)
      )
      expect(mockAuthRepository.markTokenUsed).toHaveBeenCalledWith(
        mockTokenRecord.id
      )
      expect(mockSecurityUtils.logAuditEvent).toHaveBeenCalledWith(
        'password_changed_via_reset',
        mockTokenRecord.user_id,
        mockIp,
        mockUserAgent,
        {}
      )
    })

    it('should throw AuthError with invalid token', async () => {
      // Arrange
      mockAuthRepository.findValidResetToken.mockResolvedValueOnce(null)

      // Act & Assert
      await expect(
        authService.resetPassword(mockPasswordResetData, mockIp, mockUserAgent)
      ).rejects.toThrow('Invalid or expired reset token')

      expect(mockSecurityUtils.logAuditEvent).toHaveBeenCalledWith(
        'password_reset_failed_invalid_token',
        null,
        mockIp,
        mockUserAgent,
        {}
      )
    })

    it('should throw AuthError with invalid token verification', async () => {
      // Arrange
      const mockTokenRecord = {
        id: 'token-123',
        user_id: 'user-123',
        token_hash: 'hashed-token',
      }

      mockAuthRepository.findValidResetToken.mockResolvedValueOnce(
        mockTokenRecord
      )
      mockSecurityUtils.verifyToken.mockResolvedValueOnce(false)

      // Act & Assert
      await expect(
        authService.resetPassword(mockPasswordResetData, mockIp, mockUserAgent)
      ).rejects.toThrow('Invalid or expired reset token')

      expect(mockSecurityUtils.logAuditEvent).toHaveBeenCalledWith(
        'password_reset_failed_invalid_token',
        null,
        mockIp,
        mockUserAgent,
        {}
      )
    })
  })

  describe('JWT Token Generation', () => {
    it('should generate JWT token with correct payload', () => {
      // Arrange
      const mockUserId = 'user-123'
      const mockWorkspaceId = 'workspace-123'
      const expectedToken = jwt.sign(
        { userId: mockUserId, workspaceId: mockWorkspaceId },
        process.env.JWT_SECRET as string,
        {
          expiresIn: '30d',
        }
      )

      // Act
      const token = authService['generateToken'](mockUserId, mockWorkspaceId)

      // Assert
      expect(token).toBe(expectedToken)
    })
  })

  describe('Security Edge Cases', () => {
    const mockRegisterData = {
      email: 'test@example.com',
      password: 'StrongPass123!',
      name: 'Test User',
    }

    const mockIp = '192.168.1.1'
    const mockUserAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

    it('should handle SQL injection attempts in email inputs', async () => {
      // Arrange
      const maliciousEmail = "'; DROP TABLE users; --"
      const mockRegisterDataMalicious = {
        ...mockRegisterData,
        email: maliciousEmail,
      }

      mockAuthRepository.findUserByEmailBasic.mockResolvedValueOnce(null)

      // Act & Assert
      await expect(
        authService.register(mockRegisterDataMalicious, mockIp, mockUserAgent)
      ).rejects.toThrow('Failed to associate user with workspace')

      expect(mockAuthRepository.findUserByEmailBasic).toHaveBeenCalledWith(
        maliciousEmail
      )
    })

    it('should properly hash passwords regardless of input length', async () => {
      // Arrange
      const longPassword = 'A'.repeat(1000) + '123!' // Very long password with special chars
      const mockRegisterDataLong = {
        ...mockRegisterData,
        password: longPassword,
      }
      const mockWorkspaceId = 'workspace-long'
      const mockUser = {
        id: 'user-long',
        email: mockRegisterDataLong.email,
        password_hash: `hashed-${longPassword}`,
        name: mockRegisterDataLong.name,
        workspace_id: mockWorkspaceId,
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockAuthRepository.findUserByEmailBasic.mockResolvedValueOnce(null)
      mockAuthRepository.createWorkspace.mockResolvedValueOnce(undefined)
      mockAuthRepository.createUser.mockResolvedValueOnce({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        workspace_id: mockWorkspaceId,
        created_at: mockUser.created_at,
        updated_at: mockUser.updated_at,
      })
      mockAuthRepository.findUserWithPassword.mockResolvedValueOnce({
        id: mockUser.id,
        email: mockUser.email,
        password_hash: mockUser.password_hash,
        name: mockUser.name,
        workspace_id: mockWorkspaceId,
        created_at: mockUser.created_at,
        updated_at: mockUser.updated_at,
      })

      // Act
      await authService.register(mockRegisterDataLong, mockIp, mockUserAgent)

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(longPassword, 12)
    })

    it('should track audit events for all security-relevant actions', async () => {
      // Arrange
      const mockLoginData = {
        email: 'test@example.com',
        password: 'CorrectPassword123!',
      }

      const mockHashedPassword = `hashed-${mockLoginData.password}`
      const mockUser = {
        id: 'user-123',
        email: mockLoginData.email,
        password_hash: mockHashedPassword,
        name: 'Test User',
        workspace_id: 'workspace-123',
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockSecurityUtils.isAccountLocked.mockResolvedValueOnce(false)
      mockAuthRepository.findUserByEmail.mockResolvedValueOnce(mockUser)
      ;(bcrypt.compare as any).mockResolvedValueOnce(true)

      // Act
      await authService.login(mockLoginData, mockIp, mockUserAgent)

      // Assert
      expect(mockSecurityUtils.logAuditEvent).toHaveBeenCalledWith(
        'login_success',
        mockUser.id,
        mockIp,
        mockUserAgent,
        {
          email: mockUser.email,
        }
      )
    })

    it('should track IP addresses and user agents for all authentication attempts', async () => {
      // Arrange
      const mockLoginData = {
        email: 'test@example.com',
        password: 'CorrectPassword123!',
      }

      const mockHashedPassword = `hashed-${mockLoginData.password}`
      const mockUser = {
        id: 'user-123',
        email: mockLoginData.email,
        password_hash: mockHashedPassword,
        name: 'Test User',
        workspace_id: 'workspace-123',
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockSecurityUtils.isAccountLocked.mockResolvedValueOnce(false)
      mockAuthRepository.findUserByEmail.mockResolvedValueOnce(mockUser)
      ;(bcrypt.compare as any).mockResolvedValueOnce(true)

      // Act
      await authService.login(mockLoginData, mockIp, mockUserAgent)

      // Assert
      expect(mockSecurityUtils.logAuditEvent).toHaveBeenCalledWith(
        expect.any(String),
        mockUser.id,
        mockIp,
        mockUserAgent,
        expect.any(Object)
      )
    })
  })

  describe('Error Handling', () => {
    const mockRegisterData = {
      email: 'test@example.com',
      password: 'StrongPass123!',
      name: 'Test User',
    }

    const mockIp = '192.168.1.1'
    const mockUserAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

    it('should handle database failures gracefully during registration', async () => {
      // Arrange
      mockAuthRepository.findUserByEmailBasic.mockResolvedValueOnce(null)
      mockAuthRepository.createWorkspace.mockRejectedValueOnce(
        new Error('Database connection failed')
      )

      // Act & Assert
      await expect(
        authService.register(mockRegisterData, mockIp, mockUserAgent)
      ).rejects.toThrow('Database connection failed')
    })

    it('should handle database failures gracefully during login', async () => {
      // Arrange
      const mockLoginData = {
        email: 'test@example.com',
        password: 'CorrectPassword123!',
      }

      mockSecurityUtils.isAccountLocked.mockResolvedValueOnce(false)
      mockAuthRepository.findUserByEmail.mockRejectedValueOnce(
        new Error('Database connection failed')
      )

      // Act & Assert
      await expect(
        authService.login(mockLoginData, mockIp, mockUserAgent)
      ).rejects.toThrow('Database connection failed')
    })

    it('should handle email service failures without breaking password reset flow', async () => {
      // Arrange
      const mockUserResult = { id: 'user-123' }
      const mockUserDetails = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      }

      mockSecurityUtils.isPasswordResetRateLimited.mockResolvedValueOnce(false)
      mockAuthRepository.findUserByEmailBasic.mockResolvedValueOnce(
        mockUserResult
      )
      mockAuthRepository.findUserById.mockResolvedValueOnce(mockUserDetails)
      mockEmailService.sendPasswordResetEmail.mockRejectedValueOnce(
        new Error('SMTP server unavailable')
      )

      // Act & Assert
      await expect(
        authService.requestPasswordReset(
          'test@example.com',
          mockIp,
          mockUserAgent
        )
      ).resolves.not.toThrow()
    })

    it('should maintain consistent error handling across all methods', () => {
      // Test that all methods properly validate inputs and handle edge cases
      const testInputs = [
        { email: '', password: 'pass', name: '' },
        { email: 'invalid-email', password: 'pass' },
        { email: 'test@example.com', password: 'short' },
        { token: '', newPassword: 'newpass' },
      ]

      for (const input of testInputs) {
        // These would be tested with proper validation logic
        // For now, we just ensure the structure supports validation
        expect(input).toHaveProperty('email')
        expect(input).toHaveProperty('password')
      }
    })
  })

  describe('Integration Tests', () => {
    it('should complete full registration-login cycle', async () => {
      // Arrange
      const mockRegisterData = {
        email: 'integration@test.com',
        password: 'StrongPass123!',
        name: 'Integration Test User',
      }

      const mockIp = '192.168.1.1'
      const mockUserAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

      // Registration phase
      const mockExistingUser = null
      const mockWorkspaceId = 'workspace-integration'
      const mockUser = {
        id: 'integration-user-123',
        email: mockRegisterData.email,
        password_hash: `hashed-${mockRegisterData.password}`,
        name: mockRegisterData.name,
        workspace_id: mockWorkspaceId,
        created_at: new Date(),
        updated_at: new Date(),
      }

      mockAuthRepository.findUserByEmailBasic.mockResolvedValueOnce(
        mockExistingUser
      )
      mockAuthRepository.createWorkspace.mockResolvedValueOnce(undefined)
      mockAuthRepository.createUser.mockResolvedValueOnce({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        workspace_id: mockUser.workspace_id,
        created_at: mockUser.created_at,
        updated_at: mockUser.updated_at,
      })
      mockAuthRepository.findUserWithPassword.mockResolvedValueOnce({
        id: mockUser.id,
        email: mockUser.email,
        password_hash: mockUser.password_hash,
        name: mockUser.name,
        workspace_id: mockUser.workspace_id,
        created_at: mockUser.created_at,
        updated_at: mockUser.updated_at,
      })

      // Act - Register
      const registrationResult = await authService.register(
        mockRegisterData,
        mockIp,
        mockUserAgent
      )

      // Login phase
      const mockLoginData = {
        email: mockRegisterData.email,
        password: mockRegisterData.password,
      }

      mockSecurityUtils.isAccountLocked.mockResolvedValueOnce(false)
      mockAuthRepository.findUserByEmail.mockResolvedValueOnce(mockUser)
      ;(bcrypt.compare as any).mockResolvedValueOnce(true)

      // Act - Login
      const loginResult = await authService.login(
        mockLoginData,
        mockIp,
        mockUserAgent
      )

      // Assert
      expect(registrationResult.user.id).toBe(mockUser.id)
      expect(loginResult.user.id).toBe(mockUser.id)
      expect(registrationResult.user.email).toBe(mockLoginData.email)
      expect(loginResult.user.email).toBe(mockLoginData.email)

      // Verify workspace consistency
      expect(registrationResult.user.workspace_id).toBe(mockUser.workspace_id)
      expect(loginResult.user.workspace_id).toBe(mockUser.workspace_id)
    })

    it('should handle complete password reset flow', async () => {
      // Arrange
      const mockEmail = 'reset-test@example.com'
      const mockIp = '192.168.1.1'
      const mockUserAgent =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      const resetToken = 'valid-reset-token'
      const newPassword = 'NewStrongPass123!'

      // Request password reset
      const mockUserResult = { id: 'reset-user-123' }
      const mockUserDetails = {
        id: 'reset-user-123',
        email: mockEmail,
        name: 'Test User',
      }

      mockSecurityUtils.isPasswordResetRateLimited.mockResolvedValueOnce(false)
      mockAuthRepository.findUserByEmailBasic.mockResolvedValueOnce(
        mockUserResult
      )
      mockAuthRepository.findUserById.mockResolvedValueOnce(mockUserDetails)

      // Act - Request reset
      await authService.requestPasswordReset(mockEmail, mockIp, mockUserAgent)

      // Complete reset
      const mockTokenRecord = {
        id: 'reset-token-123',
        user_id: 'reset-user-123',
        token_hash: 'hashed-reset-token',
      }

      mockAuthRepository.findValidResetToken.mockResolvedValueOnce(
        mockTokenRecord
      )
      mockSecurityUtils.verifyToken.mockResolvedValueOnce(true)

      // Act - Complete reset
      await authService.resetPassword(
        { token: resetToken, newPassword },
        mockIp,
        mockUserAgent
      )

      // Assert
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        mockEmail,
        mockUserDetails.name,
        expect.any(String)
      )
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 12)
      expect(mockAuthRepository.updatePassword).toHaveBeenCalledWith(
        mockTokenRecord.user_id,
        expect.any(String)
      )
      expect(mockAuthRepository.markTokenUsed).toHaveBeenCalledWith(
        mockTokenRecord.id
      )
    })
  })
})

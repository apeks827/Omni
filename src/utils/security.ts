import { randomBytes } from 'crypto'
import { query } from '../config/database.js'
import bcrypt from 'bcryptjs'

/**
 * Generate a cryptographically secure random token
 * @param length Length of the token in bytes (default 32 bytes = 256 bits)
 * @returns Hex-encoded token string
 */
export const generateSecureToken = (length: number = 32): string => {
  return randomBytes(length).toString('hex')
}

/**
 * Hash a token for storage
 * @param token Plain token string
 * @returns Hashed token
 */
export const hashToken = async (token: string): Promise<string> => {
  return await bcrypt.hash(token, 10)
}

/**
 * Verify a token against its hash
 * @param token Plain token string
 * @param hash Stored hash
 * @returns True if valid
 */
export const verifyToken = async (
  token: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(token, hash)
}

/**
 * Check if an account is locked based on failed login attempts
 * @param email User's email
 * @param ip IP address of the request
 * @returns True if account is locked
 */
export const isAccountLocked = async (
  email: string,
  ip: string
): Promise<boolean> => {
  const result = await query(
    `SELECT locked_until 
     FROM failed_login_attempts 
     WHERE email = $1 AND ip_address = $2 
     ORDER BY created_at DESC 
     LIMIT 1`,
    [email, ip]
  )

  if (result.rows.length === 0) {
    return false
  }

  const lockedUntil = result.rows[0].locked_until
  if (!lockedUntil) {
    return false
  }

  // Check if lockout period has expired
  return new Date() < new Date(lockedUntil)
}

/**
 * Record a failed login attempt
 * @param email User's email
 * @param ip IP address of the request
 * @returns True if account should be locked (after 5 failed attempts)
 */
export const recordFailedLoginAttempt = async (
  email: string,
  ip: string
): Promise<boolean> => {
  // Check if there's a recent record for this email/IP combination
  const existing = await query(
    `SELECT id, attempt_count, locked_until, updated_at
     FROM failed_login_attempts 
     WHERE email = $1 AND ip_address = $2 
     ORDER BY created_at DESC 
     LIMIT 1`,
    [email, ip]
  )

  let attemptCount = 1
  let shouldLockAccount = false

  if (existing.rows.length > 0) {
    const lastAttempt = existing.rows[0]

    // Check if the last attempt was within the last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
    const lastAttemptTime = new Date(lastAttempt.updated_at)

    if (lastAttemptTime > fifteenMinutesAgo && !lastAttempt.locked_until) {
      // Increment attempt count
      attemptCount = lastAttempt.attempt_count + 1

      // Lock account after 5 failed attempts
      if (attemptCount >= 5) {
        shouldLockAccount = true
        const lockedUntil = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now

        await query(
          `UPDATE failed_login_attempts 
           SET attempt_count = $2, locked_until = $3, updated_at = NOW()
           WHERE id = $1`,
          [lastAttempt.id, attemptCount, lockedUntil.toISOString()]
        )
      } else {
        // Update attempt count without locking
        await query(
          `UPDATE failed_login_attempts 
           SET attempt_count = $2, updated_at = NOW()
           WHERE id = $1`,
          [lastAttempt.id, attemptCount]
        )
      }
    } else {
      // Reset counter if last attempt was more than 15 minutes ago
      if (lastAttempt.locked_until) {
        // Clear the lock if it has expired
        const lockedUntil = new Date(lastAttempt.locked_until)
        if (new Date() >= lockedUntil) {
          await query(
            `UPDATE failed_login_attempts 
             SET attempt_count = 1, locked_until = NULL, updated_at = NOW()
             WHERE id = $1`,
            [lastAttempt.id]
          )
        } else {
          // Account still locked, increment attempt count
          attemptCount = lastAttempt.attempt_count + 1
          await query(
            `UPDATE failed_login_attempts 
             SET attempt_count = $2, updated_at = NOW()
             WHERE id = $1`,
            [lastAttempt.id, attemptCount]
          )
        }
      } else {
        // Create new record for this attempt
        await query(
          `INSERT INTO failed_login_attempts (email, ip_address, attempt_count, created_at, updated_at)
           VALUES ($1, $2, 1, NOW(), NOW())`,
          [email, ip]
        )
      }
    }
  } else {
    // Create new record for this attempt
    await query(
      `INSERT INTO failed_login_attempts (email, ip_address, attempt_count, created_at, updated_at)
       VALUES ($1, $2, 1, NOW(), NOW())`,
      [email, ip]
    )

    if (attemptCount >= 5) {
      shouldLockAccount = true
    }
  }

  return shouldLockAccount
}

/**
 * Clear failed login attempts for an email/IP combination after successful login
 * @param email User's email
 * @param ip IP address of the request
 */
export const clearFailedLoginAttempts = async (
  email: string,
  ip: string
): Promise<void> => {
  await query(
    `DELETE FROM failed_login_attempts 
     WHERE email = $1 AND ip_address = $2`,
    [email, ip]
  )
}

/**
 * Log a security event to the audit trail
 * @param eventType Type of event (e.g., login_success, login_failed, password_reset_requested)
 * @param userId User ID (if available)
 * @param ip IP address of the request
 * @param userAgent User agent string
 * @param metadata Additional event-specific data
 */
export const logAuditEvent = async (
  eventType: string,
  userId: string | null,
  ip: string | null,
  userAgent: string | null,
  metadata?: Record<string, any>
): Promise<void> => {
  await query(
    `INSERT INTO audit_logs (user_id, event_type, ip_address, user_agent, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [userId, eventType, ip, userAgent, metadata || {}]
  )
}

/**
 * Check if password reset is rate limited for an email
 * @param email User's email
 * @returns True if rate limited (more than 3 requests in last hour)
 */
export const isPasswordResetRateLimited = async (
  email: string
): Promise<boolean> => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

  const result = await query(
    `SELECT COUNT(*) as count
     FROM audit_logs
     WHERE event_type = 'password_reset_requested' 
       AND metadata->>'email' = $1
       AND created_at > $2`,
    [email, oneHourAgo.toISOString()]
  )

  const count = parseInt(result.rows[0].count)
  return count >= 3
}

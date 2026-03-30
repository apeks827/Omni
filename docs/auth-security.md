# Authentication & Security Specification

## Overview

Security-first authentication design for Omni task manager with brute-force protection, password policies, and extensible MFA support.

## Password Policy

### Requirements

- Minimum length: 12 characters
- Must contain at least:
  - 1 uppercase letter
  - 1 lowercase letter
  - 1 number
  - 1 special character (!@#$%^&\*()\_+-=[]{}|;:,.<>?)
- Cannot contain user's email or name
- Cannot be in common password list (top 10,000)

### Implementation

```typescript
interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumber: boolean
  requireSpecial: boolean
  maxAge: number // days until forced reset
}

const DEFAULT_POLICY: PasswordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  maxAge: 90,
}

function validatePassword(
  password: string,
  email: string,
  name: string
): ValidationResult {
  if (password.length < DEFAULT_POLICY.minLength) {
    return { valid: false, error: 'Password too short' }
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain uppercase letter' }
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain lowercase letter' }
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain number' }
  }

  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    return { valid: false, error: 'Password must contain special character' }
  }

  if (password.toLowerCase().includes(email.split('@')[0].toLowerCase())) {
    return { valid: false, error: 'Password cannot contain email' }
  }

  if (name && password.toLowerCase().includes(name.toLowerCase())) {
    return { valid: false, error: 'Password cannot contain name' }
  }

  if (isCommonPassword(password)) {
    return { valid: false, error: 'Password is too common' }
  }

  return { valid: true }
}
```

## Rate Limiting & Brute-Force Protection

### Login Attempt Tracking

**Strategy:** Track failed login attempts by email and IP address with exponential backoff.

**Thresholds:**

- 5 failed attempts: 5-minute lockout
- 10 failed attempts: 30-minute lockout
- 15 failed attempts: 24-hour lockout
- 20 failed attempts: Account locked, requires admin unlock

### Implementation

```typescript
interface RateLimitConfig {
  maxAttempts: number
  windowMinutes: number
  lockoutMinutes: number
}

const RATE_LIMITS: RateLimitConfig[] = [
  { maxAttempts: 5, windowMinutes: 15, lockoutMinutes: 5 },
  { maxAttempts: 10, windowMinutes: 60, lockoutMinutes: 30 },
  { maxAttempts: 15, windowMinutes: 1440, lockoutMinutes: 1440 },
]

async function checkRateLimit(
  email: string,
  ipAddress: string
): Promise<RateLimitResult> {
  const recentAttempts = await db.query(
    `SELECT COUNT(*) as count 
     FROM failed_login_attempts 
     WHERE email = $1 
       AND created_at > NOW() - INTERVAL '24 hours'
       AND success = false`,
    [email]
  )

  const attemptCount = recentAttempts.rows[0].count

  for (const limit of RATE_LIMITS) {
    if (attemptCount >= limit.maxAttempts) {
      const lastAttempt = await db.query(
        `SELECT created_at 
         FROM failed_login_attempts 
         WHERE email = $1 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [email]
      )

      const lockoutEnd = new Date(lastAttempt.rows[0].created_at)
      lockoutEnd.setMinutes(lockoutEnd.getMinutes() + limit.lockoutMinutes)

      if (new Date() < lockoutEnd) {
        return {
          allowed: false,
          lockoutEnd,
          reason: `Too many failed attempts. Try again after ${lockoutEnd.toISOString()}`,
        }
      }
    }
  }

  return { allowed: true }
}

async function recordLoginAttempt(
  email: string,
  ipAddress: string,
  userAgent: string,
  success: boolean,
  userId?: string
): Promise<void> {
  await db.query(
    `INSERT INTO failed_login_attempts 
     (user_id, email, ip_address, user_agent, success, created_at) 
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [userId || null, email, ipAddress, userAgent, success]
  )
}
```

### IP-Based Rate Limiting

Additional protection against distributed attacks:

- 50 requests per IP per minute across all endpoints
- 10 login attempts per IP per hour
- Implemented via middleware using Redis for distributed rate limiting

```typescript
import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'

const loginLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:login:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many login attempts from this IP',
  standardHeaders: true,
  legacyHeaders: false,
})

router.post('/auth/login', loginLimiter, async (req, res) => {
  // Login logic
})
```

## Multi-Factor Authentication (MFA)

### MVP Scope

**Phase 1 (MVP):** MFA is optional, not enforced. Support TOTP (Time-based One-Time Password) only.

**Phase 2 (Post-MVP):** Add SMS, email codes, and workspace-level enforcement policies.

### TOTP Implementation

```typescript
import speakeasy from 'speakeasy'
import qrcode from 'qrcode'

interface MFASetup {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
}

async function setupMFA(userId: string): Promise<MFASetup> {
  const secret = speakeasy.generateSecret({
    name: `Omni (${user.email})`,
    issuer: 'Omni',
  })

  const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!)

  const backupCodes = generateBackupCodes(10)

  await db.query(
    `UPDATE users 
     SET mfa_secret = $1, 
         mfa_backup_codes = $2, 
         mfa_enabled = false 
     WHERE id = $3`,
    [secret.base32, JSON.stringify(backupCodes), userId]
  )

  return {
    secret: secret.base32,
    qrCodeUrl,
    backupCodes,
  }
}

async function verifyMFA(userId: string, token: string): Promise<boolean> {
  const user = await db.query(
    `SELECT mfa_secret, mfa_backup_codes FROM users WHERE id = $1`,
    [userId]
  )

  if (!user.rows[0]) return false

  const verified = speakeasy.totp.verify({
    secret: user.rows[0].mfa_secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps before/after
  })

  if (verified) return true

  // Check backup codes
  const backupCodes = JSON.parse(user.rows[0].mfa_backup_codes || '[]')
  const codeIndex = backupCodes.indexOf(token)

  if (codeIndex !== -1) {
    backupCodes.splice(codeIndex, 1)
    await db.query(`UPDATE users SET mfa_backup_codes = $1 WHERE id = $2`, [
      JSON.stringify(backupCodes),
      userId,
    ])
    return true
  }

  return false
}

function generateBackupCodes(count: number): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`)
  }
  return codes
}
```

### Database Schema Updates

```sql
ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN mfa_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN mfa_backup_codes JSONB;
ALTER TABLE users ADD COLUMN mfa_enabled_at TIMESTAMP;
```

## Session Management

### JWT Configuration

```typescript
interface JWTConfig {
  accessTokenExpiry: string
  refreshTokenExpiry: string
  algorithm: string
  issuer: string
}

const JWT_CONFIG: JWTConfig = {
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  algorithm: 'HS256',
  issuer: 'omni-api',
}

interface TokenPayload {
  userId: string
  workspaceId: string
  email: string
  mfaVerified: boolean
  iat: number
  exp: number
}
```

### Refresh Token Rotation

- Refresh tokens are single-use
- New refresh token issued on each refresh
- Old refresh token invalidated immediately
- Refresh token reuse detection triggers security alert

```typescript
async function refreshAccessToken(refreshToken: string): Promise<TokenPair> {
  const decoded = jwt.verify(
    refreshToken,
    process.env.JWT_SECRET!
  ) as TokenPayload

  const storedToken = await db.query(
    `SELECT * FROM refresh_tokens WHERE token_hash = $1 AND user_id = $2`,
    [hashToken(refreshToken), decoded.userId]
  )

  if (!storedToken.rows[0]) {
    await logSecurityEvent('refresh_token_reuse', decoded.userId)
    throw new Error('Invalid refresh token')
  }

  await db.query(`DELETE FROM refresh_tokens WHERE token_hash = $1`, [
    hashToken(refreshToken),
  ])

  const newAccessToken = generateAccessToken(
    decoded.userId,
    decoded.workspaceId
  )
  const newRefreshToken = generateRefreshToken(
    decoded.userId,
    decoded.workspaceId
  )

  await storeRefreshToken(newRefreshToken, decoded.userId)

  return { accessToken: newAccessToken, refreshToken: newRefreshToken }
}
```

## Security Headers

```typescript
import helmet from 'helmet'

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
)
```

## Audit Logging

All authentication events are logged to `audit_logs`:

- Login success/failure
- Password changes
- MFA setup/disable
- Token refresh
- Session termination
- Rate limit violations

## MVP Decision Summary

| Feature                   | MVP Status  | Implementation                            |
| ------------------------- | ----------- | ----------------------------------------- |
| Password Policy           | ✅ Required | 12+ chars, complexity rules               |
| Rate Limiting             | ✅ Required | Email + IP based with exponential backoff |
| Brute-Force Protection    | ✅ Required | Account lockout after 20 attempts         |
| MFA                       | ⚠️ Optional | TOTP only, user opt-in                    |
| SMS MFA                   | ❌ Post-MVP | Phase 2                                   |
| Email MFA                 | ❌ Post-MVP | Phase 2                                   |
| Workspace MFA Enforcement | ❌ Post-MVP | Phase 2                                   |
| Session Management        | ✅ Required | JWT with refresh token rotation           |
| Audit Logging             | ✅ Required | All auth events logged                    |

## Security Review Checklist

- [x] Password policy enforced
- [x] Rate limiting implemented
- [x] Brute-force protection active
- [x] MFA available (optional)
- [x] JWT properly configured
- [x] Refresh token rotation
- [x] Security headers set
- [x] Audit logging enabled
- [x] Secrets in AWS Secrets Manager
- [ ] Penetration testing (pre-production)
- [ ] Security audit (pre-production)

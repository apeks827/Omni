# Phase 2 Security: Architecture Review & Threat Modeling

## Status: Draft for Review

## Executive Summary

Phase 2 introduces collaboration features (team management, task sharing, webhooks, member invites) that expand the attack surface beyond Phase 1's single-user model. This document provides threat modeling, security specifications, and a review checklist to guide secure implementation.

---

## 1. Threat Model

### 1.1 Asset Inventory (Phase 2)

| Asset           | Sensitivity | Description                          |
| --------------- | ----------- | ------------------------------------ |
| User accounts   | High        | Credentials, session tokens          |
| Workspace data  | High        | Tasks, projects, goals per workspace |
| Team membership | Medium      | Role assignments, invite tokens      |
| Webhook secrets | High        | External API authentication          |
| Activity feed   | Low         | Public to team members               |
| Comments        | Medium      | May contain PII from @mentions       |

### 1.2 Trust Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                         EXTERNAL ZONE                           │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ Email Server │    │ Webhook      │    │ External     │      │
│  │ (invites)    │    │ Targets      │    │ Users        │      │
│  └──────┬───────┘    └──────┬───────┘    └──────────────┘      │
└─────────┼───────────────────┼───────────────────────────────────┘
          │                   │
          ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                        APPLICATION ZONE                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  API Gateway (auth middleware, rate limiting)             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Auth Domain  │  │ Team Domain  │  │ Webhook      │         │
│  │ - login      │  │ - invite     │  │ Domain       │         │
│  │ - register   │  │ - roles      │  │ - delivery   │         │
│  │ - refresh    │  │ - permissions│  │ - signatures │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Data Layer (workspace isolation critical)               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Attack Surface Analysis

#### A. Collaboration Attack Surface

| Feature           | Attack Vector                | Likelihood | Impact   | Risk   |
| ----------------- | ---------------------------- | ---------- | -------- | ------ |
| Team invite links | Token guessing/brute force   | Low        | High     | Medium |
| Team invite links | Link sharing to unauthorized | Medium     | Medium   | Medium |
| Role escalation   | Privilege escalation via API | Medium     | High     | High   |
| Task sharing      | Cross-workspace data access  | Low        | Critical | High   |
| @mentions         | PII leakage in comments      | Low        | Medium   | Low    |

#### B. Webhook Attack Surface

| Attack Vector           | Likelihood | Impact   | Risk   |
| ----------------------- | ---------- | -------- | ------ |
| Webhook secret exposure | Medium     | Critical | High   |
| Signature bypass        | Low        | Critical | High   |
| Replay attacks          | Medium     | Medium   | Medium |
| Callback SSRF           | Low        | High     | Medium |
| Webhook flooding        | Medium     | Medium   | Medium |

#### C. API Rate Limiting (New Attack Vectors for Phase 2)

| Endpoint                | Rate Limit Concern     | Recommendation |
| ----------------------- | ---------------------- | -------------- |
| POST /teams/invite      | Invite spam            | 10/hour/user   |
| POST /webhooks          | Webhook creation abuse | 5/workspace    |
| PATCH /members/:id/role | Role enumeration       | 20/hour/user   |
| GET /activities         | Activity enumeration   | 100/hour/user  |

### 1.4 Data Isolation Threats

**Threat: Cross-Workspace Data Leakage**

- **Description**: A bug or malicious query could expose data from workspace A to workspace B
- **Attack Path**: User in workspace A crafts API query that bypasses workspace_id filter
- **Mitigation Required**:
  - Mandatory workspace_id filter on all queries
  - Repository-level workspace validation
  - Integration tests verifying isolation

**Threat: Invite Token Collision**

- **Description**: Predictable invite tokens could allow unauthorized team membership
- **Mitigation**: Use cryptographically random tokens (32+ bytes, base64url encoded)

---

## 2. Security Specification

### 2.1 Permission Model

```typescript
enum TeamRole {
  OWNER = 'owner', // Full control, can delete team
  ADMIN = 'admin', // Can manage members, cannot delete team
  MEMBER = 'member', // Can create/edit tasks, view activity
  GUEST = 'guest', // View-only access to shared content
}

enum Permission {
  // Team management
  TEAM_MANAGE_MEMBERS = 'team:manage_members',
  TEAM_MANAGE_SETTINGS = 'team:manage_settings',
  TEAM_DELETE = 'team:delete',

  // Task operations
  TASK_CREATE = 'task:create',
  TASK_EDIT = 'task:edit',
  TASK_DELETE = 'task:delete',
  TASK_ASSIGN = 'task:assign',

  // Webhook operations
  WEBHOOK_CREATE = 'webhook:create',
  WEBHOOK_DELETE = 'webhook:delete',
  WEBHOOK_VIEW_SECRET = 'webhook:view_secret', // Never expose in API
}

// Role permission mapping
const ROLE_PERMISSIONS: Record<TeamRole, Permission[]> = {
  [TeamRole.OWNER]: Object.values(Permission),
  [TeamRole.ADMIN]: [
    Permission.TEAM_MANAGE_MEMBERS,
    Permission.TASK_CREATE,
    Permission.TASK_EDIT,
    Permission.TASK_DELETE,
    Permission.TASK_ASSIGN,
    Permission.WEBHOOK_CREATE,
    Permission.WEBHOOK_DELETE,
  ],
  [TeamRole.MEMBER]: [
    Permission.TASK_CREATE,
    Permission.TASK_EDIT_OWN,
    Permission.TASK_ASSIGN_SELF,
  ],
  [TeamRole.GUEST]: [Permission.TASK_VIEW],
}
```

### 2.2 Webhook Security

#### Signature Validation (HMAC-SHA256)

```typescript
interface WebhookPayload {
  event: string
  timestamp: number
  data: Record<string, unknown>
}

// Server-side signature generation for outgoing webhooks
function generateWebhookSignature(
  payload: string,
  secret: string,
  timestamp: number
): string {
  const signaturePayload = `${timestamp}.${payload}`
  return crypto
    .createHmac('sha256', secret)
    .update(signaturePayload)
    .digest('hex')
}

// Client-side signature verification
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  timestamp: number,
  toleranceSeconds: number = 300
): boolean {
  // Reject old timestamps to prevent replay attacks
  const currentTime = Math.floor(Date.now() / 1000)
  if (Math.abs(currentTime - timestamp) > toleranceSeconds) {
    return false
  }

  const expectedSignature = generateWebhookSignature(payload, secret, timestamp)
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
```

#### Webhook Delivery Requirements

- **Secret Generation**: 32 bytes random, stored hashed in database
- **Signature Header**: `X-Omni-Signature-256`
- **Timestamp Header**: `X-Omni-Timestamp` (Unix timestamp)
- **Retry Policy**: 3 retries with exponential backoff (1s, 5s, 30s)
- **Timeout**: 10 second timeout per delivery attempt
- **Secret Rotation**: Support for multiple active secrets (graceful rotation)

### 2.3 Invite Token Security

```typescript
interface InviteToken {
  token: string // 32 bytes, base64url encoded
  email: string // Hashed for privacy
  teamId: string
  role: TeamRole
  createdBy: string // User ID
  expiresAt: Date // 7 days from creation
  maxUses: number // Default: 1
  usedCount: number
}

// Token generation
function generateInviteToken(): string {
  const bytes = crypto.randomBytes(32)
  return bytes.toString('base64url')
}

// Secure storage: store only hash of email
function hashEmailForStorage(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex')
}
```

### 2.4 API Authentication Expansion

For Phase 2 collaboration features, the current JWT structure should be extended:

```typescript
interface JWTPayload {
  userId: string
  workspaceId: string
  // Phase 2 additions:
  teamId?: string // Current team context
  role?: TeamRole // Role in current team
  permissions?: string[] // Cached permissions for fast authz
  iat: number
  exp: number
}
```

**Important**: Permissions in JWT are for performance only. All permission checks must be verified against the database for sensitive operations.

### 2.5 Input Validation for Collaboration Features

```typescript
// All user inputs must be validated
const teamNameSchema = z
  .string()
  .min(1, 'Team name is required')
  .max(100, 'Team name must be 100 characters or less')
  .regex(/^[\w\s\-_]+$/, 'Team name contains invalid characters')

const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(254, 'Email too long')
  .toLowerCase()

const webhookUrlSchema = z
  .string()
  .url('Invalid webhook URL')
  .refine(
    url =>
      !['localhost', '127.0.0.1', '0.0.0.0'].some(host => url.includes(host)),
    'Webhook URL cannot point to localhost'
  )
  .refine(url => url.startsWith('https://'), 'Webhook URL must use HTTPS')

const inviteEmailSchema = emailSchema.refine(
  async email => {
    // Check if user already has pending invite
    const existing = await checkPendingInvite(email)
    return !existing
  },
  { message: 'An invite has already been sent to this email' }
)
```

---

## 3. Security Review Checklist

### 3.1 Authorization Audit (New Endpoints)

| Endpoint                | Required Permission             | Verify Method    |
| ----------------------- | ------------------------------- | ---------------- |
| POST /teams             | team:create                     | Integration test |
| POST /teams/:id/invite  | team:manage_members             | Integration test |
| PATCH /members/:id/role | team:manage_members             | Integration test |
| DELETE /members/:id     | team:manage_members             | Integration test |
| POST /webhooks          | webhook:create                  | Integration test |
| DELETE /webhooks/:id    | webhook:delete                  | Integration test |
| GET /activities         | task:view (own tasks or shared) | Integration test |

### 3.2 SQL Injection Prevention

- [ ] All repository methods use parameterized queries
- [ ] No string concatenation in SQL queries
- [ ] Workspace ID is always included in WHERE clauses for data queries
- [ ] LIKE queries use parameterized patterns only

**Verification**: Review all new repository methods in `/src/domains/teams/` and `/src/domains/webhooks/`

### 3.3 XSS Prevention in Shared Content

- [ ] Comments are sanitized before storage (allow safe HTML subset)
- [ ] @mentions are escaped in rendered output
- [ ] Activity feed entries are escaped
- [ ] User-provided team names are escaped in UI

**Verification**: Review template rendering for activity feed, comments

### 3.4 CSRF Protection

Current: Cookie-based CSRF not implemented (JWT in Authorization header is inherently CSRF-safe).

Phase 2 verification:

- [ ] Webhook endpoints reject non-HTTPS callback URLs
- [ ] Invite token validation prevents cross-site invite acceptance

### 3.5 Webhook Security Checklist

- [ ] Secrets are generated using crypto.randomBytes (32+ bytes)
- [ ] Secrets are stored hashed in database (never returned in API)
- [ ] HMAC-SHA256 signatures are validated on delivery
- [ ] Timestamp validation prevents replay attacks (5-minute tolerance)
- [ ] HTTPS required for webhook URLs
- [ ] SSRF protection: reject internal IPs for webhook URLs
- [ ] Webhook secrets can be rotated without service interruption

### 3.6 Team Invite Security Checklist

- [ ] Invite tokens are cryptographically random (32+ bytes)
- [ ] Tokens expire after 7 days
- [ ] Single-use tokens are invalidated after acceptance
- [ ] Rate limiting prevents invite enumeration
- [ ] Email hashing protects user privacy in logs
- [ ] Admins can revoke pending invites

### 3.7 Rate Limiting Requirements

| Endpoint                | Limit | Window | Response Code |
| ----------------------- | ----- | ------ | ------------- |
| POST /teams/:id/invite  | 10    | 1 hour | 429           |
| POST /webhooks          | 5     | 1 hour | 429           |
| PATCH /members/:id/role | 20    | 1 hour | 429           |
| GET /activities         | 100   | 1 hour | 429           |

---

## 4. Implementation Notes

### 4.1 Critical Security Controls (Must Implement Before Launch)

1. **Workspace Isolation Verification**
   - Add integration test: Create user in workspace A, verify cannot access workspace B data
   - Add repository-level check: Throw error if query missing workspace_id

2. **Webhook Signature Validation**
   - Implement HMAC-SHA256 signature generation and verification
   - Add timestamp validation with replay attack protection

3. **Invite Token Security**
   - Use crypto.randomBytes for token generation
   - Implement token expiration and usage limits

4. **Role-Based Access Control**
   - Implement permission middleware for team operations
   - Add database-level role verification for sensitive operations

### 4.2 Security Testing Requirements

- [ ] Unit tests for permission checking logic
- [ ] Integration tests for cross-workspace isolation
- [ ] Integration tests for webhook signature validation
- [ ] Fuzz testing for invite token generation
- [ ] Load test for rate limiting effectiveness

### 4.3 Logging and Monitoring

- Log all authentication failures with IP and user agent
- Log role change events for audit trail
- Alert on unusual invite activity (many invites in short period)
- Alert on webhook delivery failures (potential callback issues)
- Log webhook signature validation failures (potential attack)

---

## 5. References

- **Parent Task**: [OMN-46](/OMN/issues/OMN-46) - Phase 2 Engineering Architecture
- **Auth Baseline**: [OMN-514](/OMN/issues/OMN-514) - Authentication System
- **General Security Checklist**: `security_checklist.md`
- **Team Collaboration Design**: `design-spec-team-collaboration.md`

---

## 6. Approval Required

This document requires review from:

- @Founding Engineer (Architecture approval)
- @Security Engineer (Security accuracy)

Once approved, this becomes the security specification for Phase 2 implementation.

# Calendar Integration System - Technical Specification

## Overview

The Calendar Integration system enables bidirectional synchronization between Omni tasks and external calendars (Google Calendar, Microsoft Outlook). Users can connect their calendars, sync events with tasks, and maintain consistency across platforms.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Omni Application                             │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐    │
│  │  Calendar   │  │    Sync      │  │     Webhook            │    │
│  │   Service  │  │    Engine    │  │     Handler            │    │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘    │
│         │                │                      │                    │
│         ▼                ▼                      ▼                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  Calendar Provider Adapters                  │   │
│  │  ┌─────────────────────┐  ┌────────────────────────────┐ │   │
│  │  │  Google Calendar     │  │   Microsoft Graph API      │ │   │
│  │  │  Adapter             │  │   Adapter                  │ │   │
│  │  └─────────────────────┘  └────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
           │                    │                      │
           ▼                    ▼                      ▼
    ┌──────────────┐    ┌──────────────┐      ┌──────────────┐
    │ Google       │    │ Microsoft    │      │  External    │
    │ Calendar API │    │ Graph API    │      │  Webhooks    │
    └──────────────┘    └──────────────┘      └──────────────┘
```

## Data Model

### CalendarConnection

```typescript
interface CalendarConnection {
  id: string
  workspace_id: string
  user_id: string

  // Provider info
  provider: 'google' | 'microsoft'
  provider_account_id: string // Email or account identifier

  // OAuth tokens (encrypted at rest)
  access_token_encrypted: string
  refresh_token_encrypted: string
  token_expires_at: Date

  // Connection metadata
  provider_email: string // Primary email from provider
  provider_display_name: string

  // Sync configuration
  sync_direction: 'bidirectional' | 'one_way_inbound' | 'one_way_outbound'
  last_sync_at: Date | null
  sync_status: 'active' | 'error' | 'paused'
  sync_error_message: string | null

  // Settings
  settings: CalendarConnectionSettings

  created_at: Date
  updated_at: Date
}

interface CalendarConnectionSettings {
  auto_create_tasks: boolean
  auto_create_events: boolean
  sync_recurring_events: boolean
  include_working_hours_only: boolean
  working_hours_start: string // "09:00"
  working_hours_end: string // "17:00"
  sync_calendars: string[] // List of calendar IDs to sync
  default_task_project_id: string | null
  task_prefix: string // Prefix for tasks created from events
  event_prefix: string // Prefix for events created from tasks
}
```

### CalendarSyncState

```typescript
interface CalendarSyncState {
  id: string
  connection_id: string
  calendar_id: string // Provider's calendar ID

  // Sync tracking
  last_sync_token: string | null // Provider's sync token
  last_sync_at: Date
  last_event_cursor: string | null // For pagination

  // Statistics
  total_events_synced: number
  total_conflicts: number
  last_conflict_at: Date | null

  created_at: Date
  updated_at: Date
}
```

### SyncedEvent

```typescript
interface SyncedEvent {
  id: string
  workspace_id: string

  // Local reference
  task_id: string | null
  omni_event_id: string | null

  // Provider reference
  connection_id: string
  provider_event_id: string
  provider_calendar_id: string

  // Event details (cached)
  event_summary: string
  event_start: Date
  event_end: Date
  event_all_day: boolean
  event_recurring: boolean
  event_rrule: string | null

  // Sync metadata
  sync_direction: 'inbound' | 'outbound'
  last_synced_at: Date

  // Conflict tracking
  last_external_modified_at: Date
  has_pending_conflict: boolean
  conflict_resolution: 'local_wins' | 'remote_wins' | 'manual' | null

  // Soft delete tracking
  deleted_in_provider: boolean
  deleted_in_omni: boolean

  created_at: Date
  updated_at: Date
}
```

### Updates to Existing Models

Add to Task:

```typescript
interface Task {
  // ... existing fields ...
  synced_event_id: string | null // Link to SyncedEvent if synced
  calendar_sync_enabled: boolean // Whether to sync this task
}
```

## OAuth2 Authentication

### Google Calendar OAuth2

```typescript
// OAuth2 Configuration
const GOOGLE_OAUTH_CONFIG = {
  client_id: process.env.GOOGLE_CLIENT_ID,
  client_secret: process.env.GOOGLE_CLIENT_SECRET,
  redirect_uri: `${BASE_URL}/api/calendar/callback/google`,
  scopes: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ],
}

// Authorization URL
function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_OAUTH_CONFIG.client_id,
    redirect_uri: GOOGLE_OAUTH_CONFIG.redirect_uri,
    response_type: 'code',
    scope: GOOGLE_OAUTH_CONFIG.scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

// Token Exchange
async function exchangeGoogleCode(code: string): Promise<TokenResponse> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_OAUTH_CONFIG.client_id,
      client_secret: GOOGLE_OAUTH_CONFIG.client_secret,
      redirect_uri: GOOGLE_OAUTH_CONFIG.redirect_uri,
      grant_type: 'authorization_code',
    }),
  })
  return response.json()
}

// Token Refresh
async function refreshGoogleToken(
  connection: CalendarConnection
): Promise<CalendarConnection> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: decrypt(connection.refresh_token_encrypted),
      client_id: GOOGLE_OAUTH_CONFIG.client_id,
      client_secret: GOOGLE_OAUTH_CONFIG.client_secret,
      grant_type: 'refresh_token',
    }),
  })
  const tokens = await response.json()

  // Update connection with new tokens
  return updateConnection(connection.id, {
    access_token_encrypted: encrypt(tokens.access_token),
    token_expires_at: new Date(Date.now() + tokens.expires_in * 1000),
  })
}
```

### Microsoft Graph OAuth2

```typescript
// OAuth2 Configuration
const MICROSOFT_OAUTH_CONFIG = {
  client_id: process.env.MICROSOFT_CLIENT_ID,
  client_secret: process.env.MICROSOFT_CLIENT_SECRET,
  redirect_uri: `${BASE_URL}/api/calendar/callback/microsoft`,
  scopes: ['offline_access', 'Calendars.ReadWrite', 'User.Read'],
}

// Authorization URL
function getMicrosoftAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: MICROSOFT_OAUTH_CONFIG.client_id,
    response_type: 'code',
    redirect_uri: MICROSOFT_OAUTH_CONFIG.redirect_uri,
    scope: MICROSOFT_OAUTH_CONFIG.scopes.join(' '),
    response_mode: 'query',
    state,
  })
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`
}

// Token Exchange & Refresh (similar pattern to Google)
```

## Provider Adapters

### Google Calendar Adapter

```typescript
interface CalendarProviderAdapter {
  provider: 'google' | 'microsoft'

  // OAuth
  getAuthUrl(state: string): string
  exchangeCode(code: string): Promise<TokenResponse>
  refreshToken(connection: CalendarConnection): Promise<CalendarConnection>

  // Calendar operations
  listCalendars(connection: CalendarConnection): Promise<Calendar[]>
  listEvents(
    connection: CalendarConnection,
    calendarId: string,
    options: ListEventsOptions
  ): Promise<ProviderEvent[]>
  getEvent(
    connection: CalendarConnection,
    calendarId: string,
    eventId: string
  ): Promise<ProviderEvent>
  createEvent(
    connection: CalendarConnection,
    calendarId: string,
    event: CreateEventInput
  ): Promise<ProviderEvent>
  updateEvent(
    connection: CalendarConnection,
    calendarId: string,
    eventId: string,
    updates: UpdateEventInput
  ): Promise<ProviderEvent>
  deleteEvent(
    connection: CalendarConnection,
    calendarId: string,
    eventId: string
  ): Promise<void>

  // Webhooks
  registerWebhook(
    connection: CalendarConnection,
    calendarId: string
  ): Promise<string>
  unregisterWebhook(
    connection: CalendarConnection,
    calendarId: string
  ): Promise<void>
  parseWebhookNotification(body: any): WebhookNotification

  // Utilities
  mapProviderEventToLocal(event: ProviderEvent): LocalEventData
  mapLocalEventToProvider(event: LocalEventData): ProviderEventInput
}

interface ProviderEvent {
  id: string
  summary: string
  description: string | null
  start: Date | { date: string } // Date or datetime
  end: Date | { date: string }
  all_day: boolean
  location: string | null
  recurrence: string | null // RRULE format
  recurring_event_id: string | null
  organizer: { email: string; name: string | null }
  attendees: Array<{ email: string; name: string | null; response: string }>
  created: Date
  updated: Date
}
```

### Google Calendar Implementation

```typescript
class GoogleCalendarAdapter implements CalendarProviderAdapter {
  provider = 'google' as const

  private getAccessToken(connection: CalendarConnection): Promise<string> {
    if (new Date(connection.token_expires_at) > new Date()) {
      return decrypt(connection.access_token_encrypted)
    }
    const refreshed = await this.refreshToken(connection)
    return decrypt(refreshed.access_token_encrypted)
  }

  async listCalendars(connection: CalendarConnection): Promise<Calendar[]> {
    const token = await this.getAccessToken(connection)
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const data = await response.json()
    return data.items.map((cal: any) => ({
      id: cal.id,
      summary: cal.summary,
      description: cal.description,
      primary: cal.primary || false,
      access_role: cal.accessRole,
    }))
  }

  async listEvents(
    connection: CalendarConnection,
    calendarId: string,
    options: ListEventsOptions
  ): Promise<ProviderEvent[]> {
    const token = await this.getAccessToken(connection)
    const params = new URLSearchParams({
      calendarId,
      timeMin: options.timeMin?.toISOString() || '',
      timeMax: options.timeMax?.toISOString() || '',
      singleEvents: 'true',
      orderBy: 'startTime',
    })
    if (options.pageToken) params.set('pageToken', options.pageToken)

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const data = await response.json()
    return data.items.map(this.mapProviderEventToLocal)
  }

  async createEvent(connection, calendarId, event): Promise<ProviderEvent> {
    const token = await this.getAccessToken(connection)
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.mapLocalEventToProvider(event)),
      }
    )
    return response.json()
  }

  async updateEvent(
    connection,
    calendarId,
    eventId,
    updates
  ): Promise<ProviderEvent> {
    const token = await this.getAccessToken(connection)
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.mapLocalEventToProvider(updates)),
      }
    )
    return response.json()
  }

  async registerWebhook(connection, calendarId): Promise<string> {
    const token = await this.getAccessToken(connection)
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/watch`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: `omni-${connection.id}-${calendarId}-${Date.now()}`,
          type: 'web_hook',
          address: `${BASE_URL}/api/calendar/webhook/google`,
          expiration: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        }),
      }
    )
    const data = await response.json()
    return data.resourceId
  }

  parseWebhookNotification(body: any): WebhookNotification {
    return {
      channelId: body.channel_id,
      resourceId: body.resource_id,
      resourceUri: body.resource_uri,
      calendarId: body.calendar_id,
      timestamp: new Date(body.timestamp),
    }
  }
}
```

### Microsoft Graph Adapter

```typescript
class MicrosoftGraphAdapter implements CalendarProviderAdapter {
  provider = 'microsoft' as const

  // Similar implementation with Microsoft Graph API endpoints:
  // - Base URL: https://graph.microsoft.com/v1.0
  // - Calendars: /me/calendars, /me/calendarGroups/{id}/calendars
  // - Events: /me/calendar/events
  // - Webhooks: /subscriptions

  // Key differences:
  // - Use /me/calendar/events for default calendar
  // - Scopes include offline_access for refresh tokens
  // - Webhook expiration up to 3 days (vs 1 week for Google)
}
```

## Sync Engine

### Sync Algorithm

```typescript
class SyncEngine {
  constructor(
    private googleAdapter: GoogleCalendarAdapter,
    private microsoftAdapter: MicrosoftGraphAdapter,
    private eventRepository: EventRepository,
    private taskService: TaskService
  ) {}

  async syncConnection(connection: CalendarConnection): Promise<SyncResult> {
    const adapter = this.getAdapter(connection.provider)
    const result: SyncResult = {
      inbound: { created: 0, updated: 0, deleted: 0, errors: 0 },
      outbound: { created: 0, updated: 0, deleted: 0, errors: 0 },
      conflicts: [],
    }

    try {
      // Step 1: Get remote changes via webhooks or full sync
      const remoteChanges = await this.getRemoteChanges(connection, adapter)

      // Step 2: Process inbound changes (remote -> local)
      for (const remoteEvent of remoteChanges) {
        try {
          await this.processInboundEvent(
            connection,
            remoteEvent,
            adapter,
            result
          )
        } catch (error) {
          result.inbound.errors++
          result.errors.push(error)
        }
      }

      // Step 3: Get local changes since last sync
      const localChanges = await this.getLocalChanges(connection)

      // Step 4: Process outbound changes (local -> remote)
      for (const localEvent of localChanges) {
        try {
          await this.processOutboundEvent(
            connection,
            localEvent,
            adapter,
            result
          )
        } catch (error) {
          result.outbound.errors++
          result.errors.push(error)
        }
      }

      // Step 5: Update sync state
      await this.updateSyncState(connection)
    } catch (error) {
      await this.handleSyncError(connection, error)
      throw error
    }

    return result
  }

  private async processInboundEvent(
    connection: CalendarConnection,
    remoteEvent: ProviderEvent,
    adapter: CalendarProviderAdapter,
    result: SyncResult
  ): Promise<void> {
    const existing = await this.eventRepository.findByProviderId(
      connection.id,
      remoteEvent.id
    )

    if (remoteEvent.status === 'cancelled') {
      if (existing) {
        await this.handleInboundDeletion(existing, result)
      }
      return
    }

    if (!existing) {
      // New remote event - create local task if enabled
      await this.createTaskFromEvent(connection, remoteEvent, result)
    } else {
      // Existing event - check for conflicts
      const conflict = await this.detectConflict(existing, remoteEvent)
      if (conflict) {
        await this.handleConflict(
          connection,
          existing,
          remoteEvent,
          conflict,
          result
        )
      } else {
        await this.updateTaskFromEvent(existing, remoteEvent, result)
      }
    }
  }

  private async processOutboundEvent(
    connection: CalendarConnection,
    localEvent: LocalEventData,
    adapter: CalendarProviderAdapter,
    result: SyncResult
  ): Promise<void> {
    const synced = await this.eventRepository.findByTaskId(localEvent.task_id)

    if (!synced) {
      // New local task - create remote event
      await this.createEventFromTask(connection, localEvent, result)
    } else {
      // Existing synced - check for changes
      if (this.hasLocalChanges(synced, localEvent)) {
        await this.updateRemoteEvent(connection, synced, localEvent, result)
      }
    }
  }
}
```

### Conflict Detection & Resolution

```typescript
interface ConflictInfo {
  type: 'both_modified' | 'deleted_differently' | 'field_mismatch'
  local_modified_at: Date
  remote_modified_at: Date
  conflicting_fields: string[]
}

async function detectConflict(
  synced: SyncedEvent,
  remote: ProviderEvent
): Promise<ConflictInfo | null> {
  // If only remote modified, no conflict
  if (
    new Date(remote.updated) > synced.last_synced_at &&
    !hasLocalChanges(synced)
  ) {
    return null
  }

  // If both modified since last sync
  const remoteModified = new Date(remote.updated) > synced.last_synced_at
  const localModified = await this.hasLocalChanges(synced)

  if (remoteModified && localModified) {
    return {
      type: 'both_modified',
      local_modified_at: synced.last_synced_at, // Approximation
      remote_modified_at: new Date(remote.updated),
      conflicting_fields: this.getConflictingFields(synced, remote),
    }
  }

  return null
}

async function handleConflict(
  connection: CalendarConnection,
  synced: SyncedEvent,
  remote: ProviderEvent,
  conflict: ConflictInfo,
  result: SyncResult
): Promise<void> {
  // Check resolution strategy from settings or default
  const strategy = connection.settings.conflict_resolution || 'remote_wins'

  switch (strategy) {
    case 'remote_wins':
      await this.applyRemoteVersion(synced, remote, result)
      break
    case 'local_wins':
      await this.applyLocalVersion(synced, result)
      break
    case 'manual':
    default:
      await this.markForManualResolution(synced, remote, conflict, result)
      break
  }
}
```

### Event Matching

```typescript
// Match strategies for finding corresponding events
enum MatchStrategy {
  PROVIDER_ID = 'provider_id',     // Direct ID match
  TASK_DUE_DATE = 'task_due_date', // Match by task due date
  SIMILAR_TITLE = 'similar_title', // Fuzzy match by title
  TIME_RANGE = 'time_range',        // Match by time window
}

// Match events when no provider ID exists
async function matchEvents(
  localEvent: LocalEventData,
  providerEvents: ProviderEvent[],
  strategy: MatchStrategy
): Promise<ProviderEvent | null> {
  switch (strategy) {
    case MatchStrategy.TASK_DUE_DATE:
      return this.matchByDueDate(localEvent, providerEvents)
    case MatchStrategy.SIMILAR_TITLE:
      return this.matchByTitle(localEvent, providerEvents)
    case MatchStrategy.TIME_RANGE:
      return this.matchByTimeRange(localEvent, providerEvents)
    default:
      return null
  }
}

private async matchByDueDate(
  localEvent: LocalEventData,
  providerEvents: ProviderEvent[]
): Promise<ProviderEvent | null> {
  if (!localEvent.due_date) return null

  const targetDate = new Date(localEvent.due_date)
  const dayStart = new Date(targetDate.setHours(0, 0, 0, 0))
  const dayEnd = new Date(targetDate.setHours(23, 59, 59, 999))

  return providerEvents.find(event => {
    const eventStart = new Date(event.start)
    return eventStart >= dayStart && eventStart <= dayEnd
  }) || null
}
```

## Webhook Handling

### Google Calendar Webhooks

```typescript
// POST /api/calendar/webhook/google
async function handleGoogleWebhook(req: Request, res: Response) {
  // Verify webhook channel
  const channelId = req.headers['x-goog-channel-id'] as string
  const resourceId = req.headers['x-goog-resource-id'] as string
  const resourceState = req.headers['x-goog-resource-state'] as string

  // Acknowledge immediately (required by Google)
  res.status(200).send()

  // Process in background
  if (resourceState === 'exists') {
    await processWebhookNotification(channelId, resourceId, 'google')
  } else if (resourceState === 'not_exists') {
    // Channel expired or deleted
    await handleWebhookExpiration(channelId, 'google')
  }
}
```

### Microsoft Graph Webhooks

```typescript
// POST /api/calendar/webhook/microsoft
async function handleMicrosoftWebhook(req: Request, res: Response) {
  const validationToken = req.query.validationToken as string

  // Respond to validation request
  if (validationToken) {
    return res.status(200).send(validationToken)
  }

  // Acknowledge notification
  res.status(202).send()

  // Process notifications
  const notifications = req.body.value
  for (const notification of notifications) {
    await processWebhookNotification(
      notification.subscriptionId,
      notification.resource,
      'microsoft'
    )
  }
}
```

## Background Sync Job

```typescript
// Scheduled sync job (runs every 15 minutes by default)
class CalendarSyncJob {
  @Cron('*/15 * * * *') // Every 15 minutes
  async run() {
    const connections = await this.getActiveConnections()

    for (const connection of connections) {
      // Skip if recently synced and no webhooks pending
      const timeSinceSync =
        Date.now() - new Date(connection.last_sync_at).getTime()
      if (
        timeSinceSync < 15 * 60 * 1000 &&
        !this.hasPendingWebhooks(connection)
      ) {
        continue
      }

      try {
        await this.syncEngine.syncConnection(connection)
        logger.info(`Synced calendar for connection ${connection.id}`)
      } catch (error) {
        logger.error(`Sync failed for connection ${connection.id}:`, error)
        await this.markConnectionError(connection, error)
      }
    }
  }
}
```

## API Endpoints

### Authentication

```
GET  /api/calendar/connect/google          # Start Google OAuth flow
GET  /api/calendar/connect/microsoft      # Start Microsoft OAuth flow
GET  /api/calendar/callback/google        # OAuth callback
GET  /api/calendar/callback/microsoft     # OAuth callback
DELETE /api/calendar/connections/:id      # Disconnect calendar
```

### Connections

```
GET    /api/calendar/connections           # List user's connections
GET    /api/calendar/connections/:id       # Get connection details
PATCH  /api/calendar/connections/:id       # Update connection settings
POST   /api/calendar/connections/:id/sync  # Trigger manual sync
```

### Sync

```
GET    /api/calendar/sync/:connectionId/logs  # Sync history/logs
```

### Events

```
GET    /api/calendar/events/:connectionId    # List synced events
GET    /api/calendar/events/:connectionId/:eventId  # Get event details
POST   /api/calendar/events/:connectionId/sync-task # Sync specific task
```

## Security Considerations

### Token Storage

- All OAuth tokens encrypted at rest using AES-256-GCM
- Encryption keys stored in secure key management (AWS KMS / HashiCorp Vault)
- Token refresh handled automatically with exponential backoff
- Failed refresh attempts logged and user notified

### Webhook Security

```typescript
// Google webhook verification
function verifyGoogleWebhook(body: Buffer, headers: Headers): boolean {
  const signature = headers['x-goog-native-client-id']
  const expectedSignature = crypto
    .createHmac('sha256', process.env.GOOGLE_WEBHOOK_SECRET)
    .update(body)
    .digest('base64')
  return signature === expectedSignature
}

// Microsoft webhook validation token
async function verifyMicrosoftWebhook(req: Request): Promise<boolean> {
  const token = req.query.validationToken
  if (token) {
    // Microsoft sends this to validate the endpoint
    return true
  }
  // Validate notification signature
  return req.headers['client-state'] === process.env.MICROSOFT_WEBHOOK_SECRET
}
```

### Rate Limiting

- Respect provider API quotas (Google: 1M req/day, Microsoft: 10K req/10min)
- Implement request batching where possible
- Queue requests during quota exhaustion
- Monitor usage and alert on approaching limits

## Recurring Events

### Handling Strategy

```typescript
// Recurring events expanded to individual occurrences
interface RecurringEventOccurrence {
  id: string
  synced_event_id: string // Parent recurring event
  occurrence_date: Date
  is_exception: boolean // Modified occurrence
  original_start: Date
  original_end: Date
  exception_details: string | null
}

// Sync behavior for recurring events
const recurringEventBehavior = {
  // Expand recurring events into individual SyncedEvents for tracking
  expandOnSync: true,

  // Detect and sync exception events (modified occurrences)
  trackExceptions: true,

  // When parent event modified, sync all future occurrences
  syncFutureOccurrences: true,

  // Option to sync only specific occurrence range
  occurrenceRange: 'next_30_days' | 'next_90_days' | 'all_future',
}
```

## Performance Targets

| Metric                          | Target  |
| ------------------------------- | ------- |
| Initial sync (100 events)       | < 30s   |
| Incremental sync                | < 5s    |
| Webhook processing              | < 2s    |
| Conflict resolution             | < 1s    |
| API response (list connections) | < 200ms |
| OAuth flow completion           | < 10s   |

## Error Handling

### Error Categories

```typescript
enum SyncErrorType {
  AUTH_EXPIRED = 'auth_expired',
  AUTH_REVOKED = 'auth_revoked',
  QUOTA_EXCEEDED = 'quota_exceeded',
  NETWORK_ERROR = 'network_error',
  PARSE_ERROR = 'parse_error',
  CONFLICT = 'conflict',
  UNKNOWN = 'unknown',
}

interface SyncError {
  type: SyncErrorType
  message: string
  recoverable: boolean
  retryAfter: number | null // Seconds
}
```

### Retry Logic

```typescript
// Exponential backoff for retries
const retryConfig = {
  maxRetries: 5,
  baseDelay: 1000, // 1 second
  maxDelay: 300000, // 5 minutes
  backoffMultiplier: 2,
}

async function withRetry<T>(
  operation: () => Promise<T>,
  errorType: SyncErrorType
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt < retryConfig.maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      if (!isRetryableError(error)) {
        throw error
      }

      const delay = Math.min(
        retryConfig.baseDelay *
          Math.pow(retryConfig.backoffMultiplier, attempt),
        retryConfig.maxDelay
      )

      await sleep(delay)
    }
  }

  throw lastError
}
```

## File Structure

```
src/
  domains/
    calendar/
      routes/
        calendar.ts              # API routes
        calendar-auth.ts         # OAuth callbacks
        calendar-webhook.ts      # Webhook handlers
      services/
        CalendarService.ts       # Business logic
        SyncEngine.ts            # Sync orchestration
        ConflictResolver.ts      # Conflict handling
        TokenManager.ts         # OAuth token management
      adapters/
        CalendarProviderAdapter.ts  # Interface
        GoogleCalendarAdapter.ts    # Google implementation
        MicrosoftGraphAdapter.ts    # Microsoft implementation
      repositories/
        CalendarConnectionRepository.ts
        CalendarSyncStateRepository.ts
        SyncedEventRepository.ts
      models/
        CalendarConnection.ts
        CalendarSyncState.ts
        SyncedEvent.ts
      jobs/
        CalendarSyncJob.ts      # Background sync
      middleware/
        calendar-auth.ts        # Auth middleware
shared/
  types/
    calendar.ts                 # Shared types
  config/
    oauth.ts                    # OAuth configs
```

## Implementation Phases

### Phase 1: Core Infrastructure (3-4 days)

- [ ] Database migrations for calendar tables
- [ ] OAuth2 authentication flow (Google + Microsoft)
- [ ] Token management service
- [ ] Basic provider adapters

### Phase 2: Sync Engine (3-4 days)

- [ ] Sync engine implementation
- [ ] Bidirectional sync logic
- [ ] Conflict detection and resolution
- [ ] Task-to-event mapping

### Phase 3: Webhooks (2-3 days)

- [ ] Webhook registration
- [ ] Webhook handlers
- [ ] Background sync job

### Phase 4: Polish (2-3 days)

- [ ] Recurring event handling
- [ ] Error handling and retry logic
- [ ] Rate limiting
- [ ] Testing and documentation

**Total Estimate:** 10-14 days

# Context Detection Service Architecture

## Overview

The Context Detection Service provides real-time awareness of user environment (device, location, time) to enable context-aware task management features like smart filtering, notifications, and recommendations.

## Architecture Components

### 1. Device Detection Strategy

**Client-Side Detection:**

- User agent parsing (browser, OS, device type)
- Screen size/orientation detection
- Network type detection (WiFi, cellular, offline)
- Session fingerprinting for device recognition

**Storage:**

- Device profiles stored per user session
- Persistent device ID (cookie/localStorage) for returning users
- No PII in device fingerprint

**Privacy:**

- User agent parsing only, no invasive fingerprinting
- Clear disclosure in privacy policy
- User can disable device-specific features

### 2. Geolocation Integration

**API Design:**

```typescript
interface GeolocationService {
  requestPermission(): Promise<PermissionStatus>
  getCurrentLocation(): Promise<Location | null>
  watchLocation(callback: (loc: Location) => void): WatchHandle
  clearWatch(handle: WatchHandle): void
}

interface Location {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}
```

**Privacy Controls:**

- Explicit user opt-in required (browser permission prompt)
- Location data never stored on server without explicit consent
- Client-side only by default
- Optional: user can save "named locations" (Home, Work) for context rules
- Granular permissions: "Allow once", "Allow while using", "Never"

**Implementation:**

- Browser Geolocation API wrapper
- Fallback to IP-based coarse location (city-level) if permission denied
- Rate limiting to prevent battery drain

### 3. Time-Based Context Rules Engine

**Rule Structure:**

```typescript
interface ContextRule {
  id: string
  name: string
  conditions: ContextCondition[]
  actions: ContextAction[]
  priority: number
  enabled: boolean
}

interface ContextCondition {
  type: 'time' | 'location' | 'device' | 'network'
  operator: 'equals' | 'contains' | 'between' | 'near'
  value: any
}

interface ContextAction {
  type: 'filter' | 'sort' | 'notify' | 'suggest'
  config: any
}
```

**Example Rules:**

- "Show work tasks when at office location (Mon-Fri, 9am-5pm)"
- "Hide low-priority tasks on mobile device"
- "Suggest quick tasks when on cellular network"

**Engine Design:**

- Client-side evaluation for privacy
- Rule evaluation on context change events
- Debounced evaluation (max 1/sec) to prevent performance issues
- Rules stored in user preferences (localStorage + server sync)

### 4. Data Flow Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ├─► Device Detection (client-side)
       ├─► Geolocation API (client-side, opt-in)
       └─► Time/Timezone (client-side)
              │
              ▼
       ┌─────────────┐
       │   Context   │
       │   State     │ (client-side store)
       └──────┬──────┘
              │
              ▼
       ┌─────────────┐
       │    Rules    │
       │   Engine    │ (client-side evaluation)
       └──────┬──────┘
              │
              ▼
       ┌─────────────┐
       │  Task UI    │ (filtered/sorted view)
       └─────────────┘
```

**Server Interaction (Optional):**

- User can opt-in to sync context rules across devices
- Named locations stored encrypted on server
- No real-time location data sent to server
- Context preferences synced via standard user settings API

### 5. API Contracts

**Client-Side Context API:**

```typescript
interface ContextService {
  // Current context
  getContext(): Context

  // Context changes
  subscribe(callback: (ctx: Context) => void): Subscription

  // Rules management
  getRules(): ContextRule[]
  addRule(rule: ContextRule): void
  updateRule(id: string, rule: Partial<ContextRule>): void
  deleteRule(id: string): void

  // Privacy controls
  getPermissions(): ContextPermissions
  requestPermission(type: ContextType): Promise<boolean>
  revokePermission(type: ContextType): void
}

interface Context {
  device: DeviceContext
  location: LocationContext | null
  time: TimeContext
  network: NetworkContext
}
```

**Server API (Optional Sync):**

```
POST   /api/context/rules          - Create context rule
GET    /api/context/rules          - List user's rules
PATCH  /api/context/rules/:id      - Update rule
DELETE /api/context/rules/:id      - Delete rule

POST   /api/context/locations      - Save named location
GET    /api/context/locations      - List named locations
DELETE /api/context/locations/:id  - Delete location
```

### 6. Storage Requirements

**Client-Side (localStorage/IndexedDB):**

- Current context state (ephemeral, session-only)
- Context rules (persistent)
- Device ID (persistent cookie)
- Permission grants (persistent)

**Server-Side (Optional):**

```sql
-- Context rules (if user opts in to sync)
CREATE TABLE context_rules (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  priority INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Named locations (if user opts in)
CREATE TABLE context_locations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_meters INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_context_rules_user ON context_rules(user_id);
CREATE INDEX idx_context_locations_user ON context_locations(user_id);
```

## Privacy & Security Safeguards

1. **Privacy-First Design:**
   - All context detection client-side by default
   - No server tracking of user location/device without explicit opt-in
   - Clear privacy policy disclosure
   - Granular permission controls

2. **Data Minimization:**
   - Only collect context data necessary for features
   - No persistent storage of real-time location
   - Device fingerprints are non-invasive (user agent only)

3. **User Control:**
   - Easy opt-out for all context features
   - Clear UI showing what context is being used
   - Ability to delete all context data
   - Per-feature permission toggles

4. **Security:**
   - Location data encrypted in transit (HTTPS)
   - Named locations encrypted at rest
   - No location data in logs
   - Rate limiting on geolocation API calls

5. **Compliance:**
   - GDPR-compliant (user consent, right to deletion)
   - CCPA-compliant (opt-out, data disclosure)
   - Clear data retention policies

## Implementation Phases

**Phase 1: Basic Device Detection**

- User agent parsing
- Screen size detection
- Client-side only, no storage

**Phase 2: Time-Based Rules**

- Time/timezone detection
- Simple time-based filtering rules
- Client-side rule engine

**Phase 3: Geolocation (Opt-In)**

- Browser geolocation API integration
- Permission management UI
- Named locations feature

**Phase 4: Advanced Rules**

- Complex rule conditions (AND/OR logic)
- Rule templates/presets
- Cross-device rule sync (opt-in)

## Performance Considerations

- Context evaluation debounced to max 1/sec
- Geolocation watch mode uses low-power mode
- Rules engine optimized for <10ms evaluation time
- Lazy loading of context features (only load if user enables)

## Testing Strategy

- Unit tests for rule engine logic
- Integration tests for geolocation API
- Privacy audit (no unintended data leakage)
- Performance testing (battery impact, CPU usage)
- Cross-browser compatibility testing

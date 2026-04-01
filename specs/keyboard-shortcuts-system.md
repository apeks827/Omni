# Keyboard Shortcuts System Architecture

## Overview

This document defines the technical requirements for a comprehensive keyboard shortcuts system that enables power users to navigate and control the Omni task manager efficiently through keyboard commands.

## System Requirements

### 1. Event Listener Architecture

**Global Event Handler:**

- Single `keydown` event listener attached to `document` or root element
- Event delegation pattern to minimize listener overhead
- Capture phase for system-level shortcuts, bubble phase for context-specific shortcuts
- Prevent default browser behavior for registered shortcuts

**Event Processing Pipeline:**

```typescript
KeyboardEvent → Normalization → Context Detection → Registry Lookup → Conflict Resolution → Handler Execution
```

**Key Normalization:**

- Normalize key codes across browsers (use `event.key` over deprecated `event.keyCode`)
- Handle modifier keys: `Ctrl`, `Alt`, `Shift`, `Meta` (Cmd on Mac)
- Case-insensitive matching for letter keys
- Special key handling: `Escape`, `Enter`, `Space`, `Tab`, `Delete`, `Backspace`

**Event Filtering:**

- Ignore shortcuts when focus is in text input fields (unless explicitly allowed)
- Detect input contexts: `input`, `textarea`, `contenteditable`, `select`
- Allow override for specific shortcuts (e.g., `Escape` works in inputs)

### 2. Shortcut Registry and Conflict Detection

**Registry Data Structure:**

```typescript
interface ShortcutRegistry {
  shortcuts: Map<string, ShortcutDefinition>
  contextMap: Map<string, Set<string>>
  conflictIndex: Map<string, string[]>
}

interface ShortcutDefinition {
  id: string
  key: string
  modifiers: ModifierKeys
  handler: ShortcutHandler
  context: ShortcutContext
  description: string
  category: ShortcutCategory
  enabled: boolean
  priority: number
}

interface ModifierKeys {
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  meta?: boolean
}

type ShortcutContext =
  | 'global' // Works everywhere
  | 'task-list' // Only in task list view
  | 'task-detail' // Only in task detail view
  | 'calendar' // Only in calendar view
  | 'modal' // Only when modal is open
  | 'input-focused' // Only when input is focused

type ShortcutCategory = 'navigation' | 'tasks' | 'editing' | 'views' | 'system'

type ShortcutHandler = (event: KeyboardEvent) => void | Promise<void>
```

**Conflict Detection Algorithm:**

1. Generate unique key signature: `${modifiers}+${key}+${context}`
2. Check if signature exists in registry for same context
3. If conflict exists, apply priority-based resolution:
   - Higher priority shortcuts take precedence
   - Context-specific shortcuts override global shortcuts
   - User-customized shortcuts override defaults
4. Maintain conflict index for UI warnings

**Registration API:**

```typescript
interface ShortcutManager {
  register(shortcut: ShortcutDefinition): void
  unregister(shortcutId: string): void
  update(shortcutId: string, updates: Partial<ShortcutDefinition>): void
  enable(shortcutId: string): void
  disable(shortcutId: string): void
  getConflicts(key: string, context: ShortcutContext): ShortcutDefinition[]
  getByCategory(category: ShortcutCategory): ShortcutDefinition[]
  getByContext(context: ShortcutContext): ShortcutDefinition[]
}
```

### 3. Context-Aware Shortcut Routing

**Context Detection Strategy:**

- Track active view/route via router state
- Detect focused element and its ancestors
- Maintain context stack for nested contexts (e.g., modal over task list)
- Use data attributes for context markers: `data-shortcut-context="task-list"`

**Context Priority Stack:**

```
[Most Specific] Modal → Detail View → List View → Global [Least Specific]
```

**Routing Logic:**

1. Determine current context stack from DOM and app state
2. Look up shortcuts registered for each context (most specific first)
3. Execute first matching enabled shortcut
4. Stop propagation if handler returns `false` or calls `event.preventDefault()`

**Context Transitions:**

- Clean up context-specific listeners on unmount
- Re-evaluate active shortcuts on route change
- Debounce context detection (max 1 evaluation per 100ms)

### 4. User Customization Storage

**Storage Schema:**

```typescript
interface UserShortcutPreferences {
  userId: string
  customizations: ShortcutCustomization[]
  disabledShortcuts: string[]
  version: number
  updatedAt: Date
}

interface ShortcutCustomization {
  shortcutId: string
  customKey: string
  customModifiers: ModifierKeys
}
```

**Storage Strategy:**

- Primary: `localStorage` for immediate access
- Backup: Server-side storage for cross-device sync
- Versioning for migration support
- Merge strategy: server wins on conflict, with timestamp comparison

**Persistence API:**

```typescript
interface ShortcutStorage {
  load(): Promise<UserShortcutPreferences>
  save(preferences: UserShortcutPreferences): Promise<void>
  sync(): Promise<void>
  reset(): Promise<void>
  export(): string
  import(data: string): Promise<void>
}
```

**Server Endpoints:**

```
GET    /api/users/me/shortcuts          - Get user shortcuts
PUT    /api/users/me/shortcuts          - Update user shortcuts
DELETE /api/users/me/shortcuts          - Reset to defaults
POST   /api/users/me/shortcuts/import   - Import shortcuts
GET    /api/users/me/shortcuts/export   - Export shortcuts
```

### 5. Accessibility Considerations

**Screen Reader Support:**

- Announce shortcut availability via `aria-keyshortcuts` attribute
- Provide text alternatives for all shortcut actions
- Ensure shortcuts don't interfere with screen reader navigation keys

**Keyboard-Only Navigation:**

- All shortcuts must have mouse/touch equivalents
- Focus management: shortcuts should move focus appropriately
- Focus trap in modals with `Escape` to exit
- Skip links for main content areas

**Visual Indicators:**

- Display shortcut hints in tooltips and menus
- Keyboard shortcut help modal (`?` key)
- Visual feedback on shortcut activation (e.g., flash effect)

**Customization for Accessibility:**

- Allow users to disable conflicting shortcuts
- Support alternative key bindings for users with motor disabilities
- Respect OS-level keyboard settings (sticky keys, slow keys)

### 6. Cross-Browser Compatibility

**Browser Differences:**

- `Meta` key (Cmd on Mac, Win on Windows) handling
- `event.key` vs `event.code` normalization
- Modifier key detection on different platforms
- IME (Input Method Editor) composition events

**Compatibility Matrix:**
| Browser | Version | Support Level |
|---------|---------|---------------|
| Chrome | 90+ | Full |
| Firefox | 88+ | Full |
| Safari | 14+ | Full |
| Edge | 90+ | Full |

**Polyfills:**

- `event.key` polyfill for older browsers
- Modifier key normalization utility
- Cross-platform key code mapping

**Testing Strategy:**

- Automated tests for key event handling
- Manual testing on Mac, Windows, Linux
- Browser-specific quirk documentation

## Data Model

### Database Schema

```sql
-- User shortcut customizations
CREATE TABLE user_shortcuts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shortcut_id VARCHAR(100) NOT NULL,
  custom_key VARCHAR(50),
  custom_modifiers JSONB,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, shortcut_id)
);

CREATE INDEX idx_user_shortcuts_user ON user_shortcuts(user_id);
```

### Client-Side State

```typescript
interface ShortcutState {
  registry: ShortcutRegistry
  activeContext: ShortcutContext[]
  userPreferences: UserShortcutPreferences
  conflicts: ShortcutConflict[]
  enabled: boolean
}

interface ShortcutConflict {
  shortcutId: string
  conflictingId: string
  key: string
  context: ShortcutContext
  message: string
}
```

## API Contracts

### Client-Side API

```typescript
// Main shortcut manager
class ShortcutManager {
  // Lifecycle
  initialize(): void
  destroy(): void

  // Registration
  register(shortcut: ShortcutDefinition): void
  unregister(shortcutId: string): void

  // Customization
  customize(shortcutId: string, key: string, modifiers: ModifierKeys): void
  reset(shortcutId: string): void
  resetAll(): void

  // State
  enable(): void
  disable(): void
  isEnabled(): boolean

  // Query
  getShortcut(shortcutId: string): ShortcutDefinition | null
  getByCategory(category: ShortcutCategory): ShortcutDefinition[]
  getByContext(context: ShortcutContext): ShortcutDefinition[]
  getConflicts(): ShortcutConflict[]

  // Storage
  save(): Promise<void>
  load(): Promise<void>
  sync(): Promise<void>
}

// React hook
function useShortcuts(
  shortcuts: ShortcutDefinition[],
  context: ShortcutContext,
  deps?: any[]
): void

// React hook for customization UI
function useShortcutManager(): {
  shortcuts: ShortcutDefinition[]
  conflicts: ShortcutConflict[]
  customize: (id: string, key: string, modifiers: ModifierKeys) => void
  reset: (id: string) => void
  resetAll: () => void
}
```

### Server API

```typescript
// GET /api/users/me/shortcuts
interface GetShortcutsResponse {
  customizations: ShortcutCustomization[]
  disabledShortcuts: string[]
  version: number
  updatedAt: string
}

// PUT /api/users/me/shortcuts
interface UpdateShortcutsRequest {
  customizations: ShortcutCustomization[]
  disabledShortcuts: string[]
}

interface UpdateShortcutsResponse {
  success: boolean
  version: number
  updatedAt: string
}
```

## Event Flow

### Shortcut Execution Flow

```
1. User presses key
   ↓
2. Global keydown listener captures event
   ↓
3. Normalize key and modifiers
   ↓
4. Check if input is focused (skip if text input, unless override)
   ↓
5. Detect current context stack
   ↓
6. Look up shortcuts in registry (most specific context first)
   ↓
7. Check if shortcut is enabled
   ↓
8. Execute handler
   ↓
9. Prevent default if handler succeeded
   ↓
10. Update UI feedback (optional)
```

### Customization Flow

```
1. User opens shortcuts settings
   ↓
2. Display current shortcuts grouped by category
   ↓
3. User clicks "Edit" on a shortcut
   ↓
4. Enter recording mode (listen for next key press)
   ↓
5. User presses new key combination
   ↓
6. Validate key (check conflicts)
   ↓
7. If conflict, show warning and allow override
   ↓
8. Save customization to localStorage
   ↓
9. Sync to server (background)
   ↓
10. Update registry with new binding
```

## Default Shortcuts

### Global Shortcuts

- `?` - Show keyboard shortcuts help
- `/` - Focus search
- `Escape` - Close modal/panel/cancel
- `Ctrl+K` / `Cmd+K` - Command palette

### Navigation

- `g h` - Go to home/dashboard
- `g t` - Go to tasks
- `g c` - Go to calendar
- `g p` - Go to projects

### Task Management

- `n` - New task
- `x` - Mark task complete
- `e` - Edit task
- `Delete` - Delete selected task(s)
- `1` / `2` / `3` - Set priority (high/medium/low)
- `Shift+Click` - Range select tasks
- `Ctrl+A` / `Cmd+A` - Select all tasks

### Views

- `l` - List view
- `b` - Board view
- `c` - Calendar view
- `d` - Dashboard view

### Editing

- `Ctrl+Z` / `Cmd+Z` - Undo
- `Ctrl+Shift+Z` / `Cmd+Shift+Z` - Redo
- `Ctrl+S` / `Cmd+S` - Save
- `Ctrl+Enter` / `Cmd+Enter` - Submit form

## Performance Targets

- **Event Processing**: < 5ms from keydown to handler execution
- **Registry Lookup**: < 1ms for conflict detection
- **Context Detection**: < 2ms per evaluation
- **Storage Load**: < 50ms from localStorage
- **Storage Save**: < 100ms to localStorage + background sync

## Security Considerations

- Sanitize user-provided shortcut keys to prevent XSS
- Validate shortcut definitions before registration
- Rate limit shortcut customization API endpoints
- Prevent shortcuts from executing in untrusted contexts
- Audit log for sensitive shortcut actions (e.g., delete)

## Testing Strategy

### Unit Tests

- Key normalization across browsers
- Conflict detection algorithm
- Context detection logic
- Storage serialization/deserialization

### Integration Tests

- Shortcut execution in different contexts
- Customization persistence and sync
- Conflict resolution with priority
- Accessibility with screen readers

### E2E Tests

- User customizes shortcut and uses it
- Shortcuts work across page navigation
- Sync works across devices/sessions
- Help modal displays correct shortcuts

## Migration Path

### Phase 1: Core Infrastructure

- Implement event listener and registry
- Basic conflict detection
- Global shortcuts only

### Phase 2: Context Awareness

- Context detection system
- Context-specific shortcuts
- Priority-based routing

### Phase 3: Customization

- User customization UI
- localStorage persistence
- Server-side sync

### Phase 4: Advanced Features

- Command palette integration
- Shortcut recording mode
- Import/export functionality
- Analytics and usage tracking

## Open Questions

1. Should we support sequential shortcuts (e.g., `g h` for "go home")?
2. How to handle shortcuts in iframe contexts?
3. Should we provide shortcut templates for different user personas?
4. How to handle shortcuts for third-party integrations?

---

**Related Documents:**

- [OMN-378](/OMN/issues/OMN-378) - Parent feature request
- [Context Detection Service](./context-detection-service.md)
- [Architecture Overview](../architecture.md)

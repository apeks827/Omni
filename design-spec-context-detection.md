# Context Detection UI/UX Design Spec

## Overview

Design system for context detection features including settings, permission flows, and context-aware suggestions. Built on existing Omni design tokens.

---

## Design Tokens (from existing system)

| Token             | Value          |
| ----------------- | -------------- |
| Primary           | `#007bff`      |
| Spacing           | 4/8/16/24/32px |
| Border Radius     | 2/4/8/9999px   |
| Mobile Breakpoint | 768px          |

---

## 1. Settings UI - Context Preferences

### Desktop Layout

```
┌─────────────────────────────────────────────────────────┐
│  Context Detection Settings                        [×] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─ Device Context ──────────────────────────────────┐  │
│  │                                                     │  │
│  │  Detect device type                          [○──] │  │
│  │  Suggest work tasks on desktop                   │  │
│  │  Suggest errands on mobile                        │  │
│  │                                                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─ Time Context ───────────────────────────────────┐  │
│  │                                                     │  │
│  │  Time-based suggestions                      [○──] │  │
│  │  Peak productivity hours: Morning ● Afternoon ○   │  │
│  │                                                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─ Location Context ───────────────────────────────┐  │
│  │                                                     │  │
│  │  Location detection                           [○──] │  │
│  │  Requires: Location permission                   │  │
│  │                                                     │  │
│  │  Privacy: Location never leaves your device       │  │
│  │                                                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                         │
│  [Back to Settings]                    [Save Changes]    │
└─────────────────────────────────────────────────────────┘
```

### Mobile Layout

Full-screen modal with vertical stack, larger touch targets (48px min).

### Component: Toggle Switch

New design system component replacing native checkboxes for boolean settings.

```tsx
// Props
interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  label?: string
  description?: string
}

// States
// - Default: Track gray (#e9ecef), thumb white
// - Active: Track primary (#007bff), thumb white
// - Disabled: 50% opacity, cursor not-allowed
// - Hover: Track darkens 10%

// Animation: 200ms ease-out thumb slide + color transition
```

### Component: Settings Section Card

```tsx
interface SettingsSectionProps {
  title: string
  icon?: ReactNode
  children: ReactNode
}

// Style: Card with 16px padding, 8px border-radius
// Title: 14px semibold, uppercase tracking
```

---

## 2. Location Permission Opt-in Flow

### Step 1: Permission Request Modal

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    📍 [Icon]                            │
│                                                         │
│           Enable Location Detection?                   │
│                                                         │
│   We'd like to suggest errands when you're near        │
│   stores, and work tasks when you're at your           │
│   desk.                                                 │
│                                                         │
│   ┌─ Privacy Guarantee ────────────────────────────┐  │
│   │  🔒 Your location never leaves your device.    │  │
│   │     All processing happens locally.            │  │
│   └─────────────────────────────────────────────────┘  │
│                                                         │
│   [Not Now]                        [Enable Location]    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Step 2: OS Permission (system dialog)

Standard browser/device location permission dialog.

### Step 3: Permission Result

**Success:** Toast notification "Location enabled. We'll suggest nearby tasks."

**Denied:** Inline message in settings card:

```
⚠️ Location access denied. Enable in browser settings
   to unlock place-based suggestions.
   [Open Settings]
```

---

## 3. Context-Aware Task Suggestions

### Suggestion Card Component

```tsx
interface ContextSuggestionProps {
  task: Task
  context: 'device' | 'location' | 'time'
  reason: string
  onAccept: () => void
  onDismiss: () => void
}
```

### Desktop: Inline Suggestions

Appears in sidebar or as a floating panel:

```
┌─────────────────────────────────┐
│  💡 Suggested for this context │
├─────────────────────────────────┤
│  📱 Mobile context              │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🛒 Buy groceries        │   │
│  │ Near Whole Foods        │   │
│  │                         │   │
│  │ [Add to Today] [Skip]   │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 💊 Pick up prescription │   │
│  │ Near CVS Pharmacy       │   │
│  │                         │   │
│  │ [Add to Today] [Skip]   │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

### Mobile: Bottom Sheet

```
┌────────────────────────────────┐
│  ───                            │
│                                 │
│  💡 Suggested for this context │
│  📱 Near Whole Foods            │
│                                 │
│  🛒 Buy groceries              │
│  ─────────────────────         │
│  [Add to Today]                │
│  [Skip for now]                │
│                                 │
└────────────────────────────────┘
```

### Context Badge Component

Displays on tasks to show why they were suggested:

```tsx
interface ContextBadgeProps {
  context: 'desktop' | 'mobile' | 'location' | 'morning' | 'evening'
}

// Styles
// - Desktop: 💻 blue badge
// - Mobile: 📱 purple badge
// - Location: 📍 green badge
// - Morning: 🌅 orange badge
// - Evening: 🌙 indigo badge
```

---

## 4. Privacy Controls & Transparency

### Privacy Dashboard Section

```
┌─ Your Privacy ───────────────────────────────────────┐
│                                                        │
│  🔒 Location Data                                     │
│     Status: Enabled ●   Last used: 2 min ago          │
│     [View Data]  [Clear History]  [Disable]          │
│                                                        │
│  📊 Usage Statistics                                  │
│     Suggestions made today: 5                         │
│     Accuracy rate: 87%                                │
│                                                        │
│  📜 Privacy Policy                    [View Full →]  │
└────────────────────────────────────────────────────────┘
```

### Transparent Explanation Card

Shows users exactly what context detection does:

```
┌──────────────────────────────────────────────────────┐
│  How Context Detection Works                         │
├──────────────────────────────────────────────────────┤
│                                                      │
│  We detect:                                          │
│  ✓ What device you're using                          │
│  ✓ Time of day and day of week                       │
│  ✓ Your location (only if you enable it)             │
│                                                      │
│  We NEVER:                                           │
│  ✗ Share your location with anyone                   │
│  ✗ Store location history on servers                 │
│  ✗ Track you in the background                       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 5. Component Inventory

| Component               | File                                                             | States                                |
| ----------------------- | ---------------------------------------------------------------- | ------------------------------------- |
| Toggle                  | `design-system/components/Toggle/Toggle.tsx`                     | default, hover, active, disabled      |
| SettingsSection         | `components/SettingsSection/SettingsSection.tsx`                 | default                               |
| ContextSuggestion       | `components/ContextSuggestion/ContextSuggestion.tsx`             | default, loading, accepted, dismissed |
| ContextBadge            | `components/ContextBadge/ContextBadge.tsx`                       | device, location, time variants       |
| LocationPermissionModal | `components/LocationPermissionModal/LocationPermissionModal.tsx` | default, loading, denied              |
| PrivacyDashboard        | `components/PrivacyDashboard/PrivacyDashboard.tsx`               | default                               |

---

## 6. Interaction Flows

### Flow 1: First-time Location Enable

1. User opens Settings → Context Detection
2. Location toggle is OFF, shows "Enable" button
3. User clicks toggle → Permission modal appears
4. User confirms → OS permission dialog
5. Permission granted → Toggle animates to ON, toast appears
6. If denied → Inline warning message, toggle stays OFF

### Flow 2: Context Suggestion Interaction

1. User switches to mobile device
2. System detects device change
3. Context suggestion card appears (fade-in, 300ms)
4. User can: Accept (adds task), Dismiss (hides card), Ignore (auto-dismiss after 30s)
5. On accept: Card transforms to success state, task added

### Flow 3: Privacy Review

1. User clicks "View Data" in Privacy Dashboard
2. Modal shows:
   - List of detected contexts with timestamps
   - "Clear All" button
   - Link to disable feature entirely
3. User can export data as JSON or delete

---

## 7. Accessibility

- All toggles: `role="switch"`, `aria-checked`
- Keyboard: Tab navigates, Space/Enter toggles
- Focus visible: 2px primary outline
- Color contrast: 4.5:1 minimum
- Screen reader: Context badges announce context type
- Reduced motion: Disable slide animations

---

## 8. Responsive Breakpoints

| Breakpoint | Layout                                     |
| ---------- | ------------------------------------------ |
| < 480px    | Full-screen modals, bottom sheets          |
| 480-768px  | Slightly padded, stacked cards             |
| > 768px    | Centered modal (max 560px), sidebar panels |

---

## 9. Implementation Priority

1. **P0:** Toggle component, Settings UI, Context badges
2. **P1:** Location permission modal, Context suggestion cards
3. **P2:** Privacy dashboard, Suggestion analytics

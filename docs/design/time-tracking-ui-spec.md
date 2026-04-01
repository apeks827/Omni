# Time Tracking UI/UX Design Specification

## Overview

This document defines the user interface and interaction patterns for the time tracking system, enabling users to track time spent on tasks through active timers, manual entries, and Pomodoro sessions.

## Design Principles

- **Minimal friction**: Start/stop timer in one click
- **Persistent state**: Timer survives page refresh and browser close
- **Visual clarity**: Always show timer status at a glance
- **Flexible input**: Support both automatic timers and manual entries
- **Actionable insights**: Analytics help users understand time usage

## Component Architecture

### 1. TimerWidget

**Purpose**: Global timer control visible across all views

**Features**:

- Compact display showing current running timer
- Task name and elapsed time
- Play/pause/stop controls
- Click to expand for full timer interface
- Sticky position (top-right or bottom-right)
- Pomodoro mode indicator

**Visual Design**:

- Floating widget: 280px width, auto height
- Background: White with `shadows.lg`
- Border-radius: 8px
- Position: Fixed, top-right with 16px margin (desktop)
- Position: Fixed, bottom with 0 margin (mobile, full-width)
- Collapsed state: 56px height, shows task + time + controls
- Expanded state: 320px height, shows full controls + history

**States**:

- Idle (no timer running): Gray, "Start timer" prompt
- Running (timer active): Green accent, pulsing indicator
- Paused (timer paused): Orange accent, static
- Syncing (network sync): Blue spinner overlay

**Interaction**:

- Click widget: Toggle expand/collapse
- Click play: Start timer for current task
- Click pause: Pause active timer
- Click stop: Stop timer, save entry, show summary
- Drag widget: Reposition (desktop only)

### 2. TaskTimerButton

**Purpose**: Quick timer start from task card

**Features**:

- Icon button on task card
- Shows if timer is running for this task
- One-click start/stop
- Visual indicator when active

**Visual Design**:

- Icon: Clock or play icon, 20px
- Button: 36px square, ghost variant
- Active state: Green background, pulsing animation
- Hover: Tooltip "Start timer" or "Stop timer"
- Position: Task card actions area

**Interaction**:

- Click when idle: Start timer for this task
- Click when running: Stop timer, save entry
- Long press: Show timer options (Pomodoro mode)

### 3. TimerDisplay

**Purpose**: Large, readable timer counter

**Features**:

- Elapsed time in HH:MM:SS format
- Smooth second-by-second updates
- Color-coded by status
- Pomodoro progress ring (when in Pomodoro mode)

**Visual Design**:

- Font: Monospace, 32px bold (expanded), 18px medium (collapsed)
- Color: `colors.text.primary` (running), `colors.gray600` (paused)
- Pomodoro ring: Circular progress, 120px diameter
- Ring colors: Green (work), blue (break), purple (long break)
- Background: Subtle gradient when running

**States**:

- Running: Updates every second, smooth animation
- Paused: Static, dimmed
- Completed: Flash green, show total time

### 4. ManualTimeEntryForm

**Purpose**: Add time entries manually

**Features**:

- Task selector (dropdown or search)
- Start time picker (date + time)
- End time picker (date + time)
- Duration calculator (auto-fills from start/end)
- Description field (optional)
- Type selector (manual, timer, pomodoro)

**Visual Design**:

- Modal: 500px width on desktop, full-screen on mobile
- Form fields: Stack with 16px spacing
- Time pickers: Native datetime-local inputs
- Duration display: Large, 24px, auto-calculated
- Submit button: Full-width, primary variant
- Cancel: Ghost button, top-left

**Validation**:

- Task required: Red border + error message
- Start time required: Red border + error message
- End time must be after start time: Error message
- Duration must be positive: Error message
- Real-time duration calculation

**Interaction**:

- Select task: Dropdown with search
- Pick start time: Calendar + time picker
- Pick end time: Calendar + time picker (defaults to now)
- Duration auto-updates on start/end change
- Click submit: Create entry, close modal, show success toast

### 5. TimeLogList

**Purpose**: Display time entries for a task

**Features**:

- List of all time entries
- Group by date
- Show duration, type, description
- Edit/delete actions
- Filter by date range
- Sort by date (newest first)

**Visual Design**:

- List item: 64px height, white background
- Left border: 4px colored by type (green=timer, blue=manual, purple=pomodoro)
- Date header: 14px semibold, `colors.gray700`, sticky
- Duration: 18px bold, right-aligned
- Description: 14px, `colors.gray600`, truncated
- Actions: Icon buttons, visible on hover
- Empty state: Illustration + "No time logged yet"

**States**:

- Default: List of entries
- Loading: Skeleton loaders
- Empty: Empty state illustration
- Error: Error message with retry button

**Interaction**:

- Click entry: Expand to show full details
- Click edit: Open edit modal
- Click delete: Confirm, then delete
- Swipe left (mobile): Show delete action

### 6. TimeAnalyticsDashboard

**Purpose**: Visualize time tracking data

**Features**:

- Total time tracked (today, week, month)
- Time by task (bar chart)
- Time by day (line chart)
- Pomodoro statistics (work sessions, breaks)
- Most productive hours (heatmap)
- Export button (CSV/JSON)

**Visual Design**:

- Grid layout: 2 columns on desktop, 1 on mobile
- Stat card: 120px height, centered content
- Large number: 32px bold, `colors.text.primary`
- Label: 14px, `colors.text.secondary`
- Charts: Recharts library, consistent colors
- Date range picker: Top-right, defaults to last 7 days
- Export button: Outline variant, top-right

**Charts**:

- Bar chart: Time by task, horizontal bars
- Line chart: Time by day, smooth curve
- Heatmap: Hours of day vs days of week, color intensity

**Interaction**:

- Select date range: Update all charts
- Hover chart: Show tooltip with exact values
- Click task bar: Navigate to task detail
- Click export: Download CSV/JSON file

### 7. PomodoroTimer

**Purpose**: Pomodoro technique timer with work/break cycles

**Features**:

- Work session timer (default 25 min)
- Short break timer (default 5 min)
- Long break timer (default 15 min)
- Session counter (4 work sessions → long break)
- Auto-transition to next phase (optional)
- Audio notification on phase complete
- Settings: Customize durations

**Visual Design**:

- Circular progress ring: 200px diameter
- Center: Time remaining in MM:SS
- Ring color: Green (work), blue (break), purple (long break)
- Session dots: Below ring, show completed work sessions
- Phase label: Above ring, "Work Session 2 of 4"
- Controls: Play/pause/skip buttons below
- Settings icon: Top-right, opens settings modal

**States**:

- Work session: Green ring, "Focus time"
- Short break: Blue ring, "Take a break"
- Long break: Purple ring, "Long break"
- Paused: Ring stops, controls show resume
- Completed: Ring full, celebration animation

**Interaction**:

- Click start: Begin work session
- Click pause: Pause timer
- Click skip: Skip to next phase (confirm)
- Click settings: Open Pomodoro settings modal
- Auto-transition: Ring completes, audio plays, next phase starts after 3s

### 8. PomodoroSettings

**Purpose**: Configure Pomodoro timer durations

**Features**:

- Work duration slider (15-60 min)
- Short break duration slider (3-15 min)
- Long break duration slider (10-30 min)
- Sessions before long break (2-8)
- Auto-start next phase toggle
- Audio notification toggle
- Reset to defaults button

**Visual Design**:

- Modal: 400px width
- Sliders: Full-width, show current value
- Toggles: Switch component
- Preview: Shows example cycle timeline
- Save button: Primary variant, bottom-right
- Reset button: Ghost variant, bottom-left

**Validation**:

- Work duration ≥ 15 min
- Break durations ≥ 3 min
- Sessions ≥ 2

### 9. TimerSyncIndicator

**Purpose**: Show timer sync status with server

**Features**:

- Synced: Green checkmark
- Syncing: Blue spinner
- Offline: Orange warning
- Conflict: Red error

**Visual Design**:

- Icon: 16px, positioned in timer widget
- Tooltip: Shows last sync time
- Colors: Match status (green/blue/orange/red)
- Animation: Pulse when syncing

**States**:

- Synced: Static green checkmark
- Syncing: Rotating blue spinner
- Offline: Orange warning triangle
- Conflict: Red error icon, click to resolve

## Interaction Patterns

### Starting a Timer

1. User clicks timer button on task card
2. Timer widget appears (if not visible)
3. Timer starts counting from 00:00:00
4. Task card shows active timer indicator
5. Timer widget shows task name and elapsed time
6. Server creates timer session in Redis

### Pausing a Timer

1. User clicks pause button in timer widget
2. Timer stops counting
3. Visual state changes to paused (orange)
4. Server updates timer session with paused_at timestamp
5. User can resume or stop

### Stopping a Timer

1. User clicks stop button in timer widget
2. Confirmation: "Save time entry for [task]?"
3. Optional: Add description in modal
4. User confirms
5. Timer stops, entry saved to database
6. Success toast: "Logged 1h 23m to [task]"
7. Timer widget returns to idle state

### Manual Time Entry

1. User clicks "Add time" button
2. ManualTimeEntryForm modal opens
3. User selects task from dropdown
4. User picks start time (defaults to now - 1 hour)
5. User picks end time (defaults to now)
6. Duration auto-calculates and displays
7. User optionally adds description
8. User clicks "Save"
9. Entry created, modal closes, success toast

### Pomodoro Session

1. User clicks "Start Pomodoro" on task
2. PomodoroTimer opens (modal or sidebar)
3. Work session begins (25 min countdown)
4. User works on task
5. Timer reaches 00:00, audio plays
6. Auto-transition to short break (5 min)
7. User takes break
8. Break ends, auto-transition to next work session
9. After 4 work sessions, long break (15 min)
10. Cycle repeats or user stops

### Viewing Time Analytics

1. User navigates to "Time Tracking" page
2. TimeAnalyticsDashboard loads with last 7 days
3. User sees total time, charts, Pomodoro stats
4. User changes date range to last 30 days
5. Charts update with new data
6. User clicks "Export" button
7. CSV file downloads with all entries in range

### Timer Persistence (Page Refresh)

1. User has active timer running
2. User refreshes page or closes browser
3. On page load, client calls GET /api/timer/status
4. Server returns active timer session from Redis
5. Client restores timer state and continues counting
6. Timer widget shows correct elapsed time
7. No data loss

## Responsive Design

### Desktop (>1024px)

- Timer widget: Floating, top-right, draggable
- Time log list: 2-column layout
- Analytics dashboard: 2-column grid
- Pomodoro timer: Modal, centered

### Tablet (768px - 1024px)

- Timer widget: Floating, top-right, fixed position
- Time log list: Single column
- Analytics dashboard: Single column
- Pomodoro timer: Modal, centered

### Mobile (<768px)

- Timer widget: Fixed bottom bar, full-width
- Task timer button: Larger touch target (44px)
- Time log list: Single column, swipe actions
- Analytics dashboard: Single column, scrollable
- Pomodoro timer: Full-screen overlay
- Manual entry form: Full-screen modal

## Accessibility

### Keyboard Navigation

- Tab: Navigate between timer controls
- Space/Enter: Start/pause/stop timer
- Escape: Close modals, stop Pomodoro
- Arrow keys: Adjust time in manual entry form

### Screen Reader Support

- Timer status announced: "Timer running, 23 minutes 45 seconds elapsed"
- Pomodoro phase: "Work session 2 of 4, 18 minutes remaining"
- Time entry: "Logged 1 hour 30 minutes to Implement feature"
- ARIA labels for all icon buttons
- Live regions for timer updates (throttled to every 10 seconds)

### Visual Accessibility

- Color contrast: 4.5:1 minimum
- Focus indicators: 2px solid outline
- Icons paired with text labels
- Reduced motion: Disable animations if `prefers-reduced-motion`
- Large touch targets: 44px minimum on mobile

## Performance Considerations

- Timer updates: Client-side only, sync every 30s
- Background sync: Use `visibilitychange` to sync on tab focus
- Optimistic UI: Instant feedback, background sync
- Lazy load analytics: Load charts on demand
- Virtual scrolling: For time log lists >100 entries
- Debounce manual entry duration calculation: 300ms
- Cache Pomodoro settings locally
- Strategy selector response: <50ms

## New Features - Timer Strategy Selector

### Strategy Selection Component

- **Location**: TimerWidget controls area
- **Options**: Auto, Manual, Pomodoro modes
- **Behavior**: Instant mode switching without timer reset
- **Accessibility**: Full keyboard navigation support
- **Visual Feedback**: Selected strategy indicator

## Success Metrics

- Timer start time: <100ms from click to running
- Timer sync latency: <100ms to server
- Manual entry form: <2s to open and render
- Analytics load time: <500ms for 30-day range
- Mobile touch target size: ≥44px (Enhanced)
- Keyboard navigation: All actions accessible
- Strategy selector response: <50ms
- Accessibility score: WCAG 2.1 AA compliant

# Habits & Routines UI/UX Design Specification

## Overview

This document defines the user interface and interaction patterns for the habits and routines system, enabling users to build consistent behaviors and structured workflows.

## Design Principles

- **Motivation**: Visual feedback (streaks, progress) encourages consistency
- **Simplicity**: Quick actions for daily habit completion
- **Flexibility**: Routines adapt to user context and schedule
- **Clarity**: Clear distinction between habits (recurring) and routines (sequential)

## Component Architecture

### 1. HabitList

**Purpose**: Display all active habits with completion status

**Features**:

- Today's habits prominently displayed at top
- Streak visualization with fire icon and count
- Quick complete/skip actions (single tap/click)
- Filter by status: All, Active, Completed Today, Missed
- Sort by: Streak length, Creation date, Custom order
- Drag-to-reorder for custom sorting
- Archive completed/inactive habits

**Visual Design**:

- Card layout with 8px border-radius
- Habit card: White background, 1px border `colors.border.subtle`
- Completed state: Green checkmark, subtle green background tint
- Skipped state: Gray with skip icon
- Missed state: Red indicator for broken streaks
- Streak badge: Orange/red gradient, positioned top-right
- Card height: 72px with 16px padding
- Touch target: Minimum 44px for mobile

**States**:

- Default (pending completion)
- Completed (green checkmark, disabled actions)
- Skipped (gray, can undo)
- Missed (red indicator, can mark late)
- Archived (hidden by default, accessible via filter)

### 2. HabitCard

**Purpose**: Individual habit display with quick actions

**Features**:

- Habit name and description
- Frequency indicator (Daily, Weekly, Custom)
- Current streak with icon
- Best streak (personal record)
- Quick complete button (primary action)
- Quick skip button (secondary action)
- Expand for details and history

**Visual Design**:

- Left border: 4px colored by category/priority
- Icon: 32px circle with habit icon or emoji
- Name: 16px semibold, `colors.text.primary`
- Streak: Fire icon + count, 14px medium weight
- Actions: Icon buttons, 36px touch target
- Hover: Slight elevation, `shadows.sm` → `shadows.md`

**Interaction**:

- Tap/click complete: Instant feedback, confetti animation
- Long press: Show context menu (edit, skip, delete)
- Swipe right: Quick complete (mobile)
- Swipe left: Quick skip (mobile)

### 3. HabitCreationForm

**Purpose**: Create and edit habits

**Features**:

- Habit name (required, max 60 chars)
- Description (optional, max 200 chars)
- Icon/emoji picker
- Frequency selector:
  - Daily
  - Weekly (select days)
  - Custom interval (every N days)
- Reminder time (optional)
- Category/tag selection
- Goal tracking (optional count/duration)

**Visual Design**:

- Modal: 600px width on desktop, full-screen on mobile
- Form fields: Stack with 16px spacing
- Icon picker: Grid of 48px icons, 8 per row
- Frequency selector: Segmented control for common options
- Day selector: 7 circular buttons for weekdays
- Submit button: Full-width, primary variant
- Cancel: Ghost button, top-left

**Validation**:

- Name required: Red border + error message
- Frequency required: Highlight selector
- Real-time character count for name/description

### 4. StreakVisualization

**Purpose**: Show habit completion history

**Features**:

- Calendar heatmap (GitHub-style)
- 7-day mini view in habit card
- 30-day view in expanded detail
- Color intensity by completion rate
- Hover tooltip: Date + status
- Click date: View day details

**Visual Design**:

- Grid: 12px squares, 2px gap
- Colors:
  - Empty: `colors.gray200`
  - Completed: `colors.success` (intensity by streak)
  - Skipped: `colors.gray400`
  - Missed: `colors.danger.light`
- Tooltip: 8px border-radius, `shadows.md`
- Legend: Below grid, shows color meanings

### 5. RoutineBuilder

**Purpose**: Create multi-step routines

**Features**:

- Drag-and-drop step ordering
- Add step: Name, duration, optional notes
- Step types:
  - Task (checkbox completion)
  - Timer (countdown)
  - Habit (link to existing habit)
  - Break (rest period)
- Reorder steps with drag handles
- Delete step with swipe or button
- Duplicate step
- Save as template

**Visual Design**:

- Step list: Vertical stack with 8px gaps
- Step card: 56px height, white background
- Drag handle: 6 dots icon, left side, `colors.gray500`
- Step number: Circle badge, 24px, `colors.primary`
- Duration badge: Pill shape, `colors.info.light`
- Add step button: Dashed border, full-width
- Total duration: Sticky footer, shows sum

**Interaction**:

- Drag step: Lift animation, drop zones highlight
- Click step: Expand for edit mode
- Add step: Modal or inline form
- Delete: Swipe left (mobile) or trash icon (desktop)

### 6. RoutinePlayer

**Purpose**: Execute routine step-by-step

**Features**:

- Current step highlighted
- Progress bar (steps completed / total)
- Timer for timed steps
- Complete step button
- Skip step option
- Pause/resume routine
- Exit with save progress option
- Audio/visual cues for step transitions

**Visual Design**:

- Full-screen overlay on mobile
- Sidebar panel on desktop (400px width)
- Current step: Large card, centered
- Progress bar: Top, `colors.primary`, animated
- Timer: 48px font, countdown format (MM:SS)
- Complete button: Large, bottom-fixed, `colors.success`
- Step list: Collapsed view below current step
- Completed steps: Checkmark, `colors.gray600`
- Upcoming steps: Numbered, `colors.gray400`

**States**:

- Playing (timer active, can pause)
- Paused (timer stopped, can resume)
- Completed (all steps done, show summary)
- Abandoned (exited early, save progress)

### 7. CalendarIntegration

**Purpose**: View habits and routines in calendar context

**Features**:

- Month view with habit indicators
- Day view with scheduled routines
- Drag routine to reschedule
- Habit completion dots on dates
- Filter by habit/routine
- Export to external calendar (iCal)

**Visual Design**:

- Calendar grid: 7 columns, 5-6 rows
- Date cell: 48px square
- Habit dots: 6px circles, max 3 visible + count
- Routine blocks: Colored bars with time
- Today: Bold border, `colors.primary`
- Selected date: Background `colors.primary.light`
- Hover: Tooltip with habit/routine names

### 8. HabitStats

**Purpose**: Analytics and insights

**Features**:

- Total habits tracked
- Current active streaks
- Longest streak (all-time)
- Completion rate (7-day, 30-day, all-time)
- Most consistent habit
- Streak recovery suggestions
- Weekly/monthly reports

**Visual Design**:

- Card grid: 2 columns on desktop, 1 on mobile
- Stat card: 120px height, centered content
- Large number: 32px bold, `colors.text.primary`
- Label: 14px, `colors.text.secondary`
- Chart: Line graph for completion rate over time
- Colors: Match habit categories

## Interaction Patterns

### Completing a Habit

1. User sees habit in today's list
2. User taps/clicks complete button
3. Instant visual feedback: Checkmark animation
4. Streak increments with celebration (confetti for milestones)
5. Card moves to "Completed" section
6. Undo option appears briefly (5 seconds)

### Skipping a Habit

1. User taps/clicks skip button
2. Confirmation: "Skip [habit name] today?"
3. User confirms or cancels
4. On confirm: Card grays out, streak preserved
5. Note added: "Skipped on [date]"

### Creating a Routine

1. User clicks "New Routine" button
2. RoutineBuilder modal opens
3. User enters routine name
4. User adds steps via "Add Step" button
5. User configures each step (name, duration, type)
6. User reorders steps via drag-and-drop
7. User clicks "Save Routine"
8. Routine appears in routines list

### Running a Routine

1. User clicks "Start" on routine card
2. RoutinePlayer opens (full-screen or sidebar)
3. First step displays with timer (if applicable)
4. User completes step, clicks "Next"
5. Progress bar updates
6. Next step displays
7. Repeat until all steps complete
8. Summary screen shows completion time and stats
9. Option to save as completed or discard

### Viewing Habit History

1. User clicks on habit card to expand
2. Detail view shows 30-day calendar heatmap
3. User hovers over date to see status
4. User clicks date to view notes/details
5. Scroll down for all-time stats and charts

## Responsive Design

### Desktop (>1024px)

- Habit list: 3-column grid
- Routine builder: Side-by-side step list and preview
- Calendar: Full month view
- Stats: 4-column dashboard

### Tablet (768px - 1024px)

- Habit list: 2-column grid
- Routine builder: Stacked layout
- Calendar: Full month view, smaller cells
- Stats: 2-column dashboard

### Mobile (<768px)

- Habit list: Single column, full-width cards
- Routine builder: Full-screen modal
- Routine player: Full-screen overlay
- Calendar: Week view by default, swipe to navigate
- Stats: Single column, scrollable
- Bottom navigation: Quick access to habits, routines, calendar

## Accessibility

### Keyboard Navigation

- Tab: Navigate between habits and actions
- Space/Enter: Complete habit, start routine
- Arrow keys: Navigate calendar, reorder steps
- Escape: Close modals, exit routine player

### Screen Reader Support

- Habit status announced: "Morning meditation, 7-day streak, not completed"
- Routine progress: "Step 2 of 5: Stretching, 5 minutes"
- Calendar dates: "March 15, 2 habits completed, 1 routine scheduled"
- ARIA labels for all icon buttons
- Live regions for completion feedback

### Visual Accessibility

- Color contrast: 4.5:1 minimum
- Focus indicators: 2px solid outline
- Icons paired with text labels
- Reduced motion: Disable animations if `prefers-reduced-motion`
- Large touch targets: 44px minimum

## Performance Considerations

- Lazy load habit history (load on expand)
- Virtual scrolling for long habit lists (>50 items)
- Debounce search/filter (300ms)
- Optimistic UI for habit completion
- Cache routine templates locally
- Preload next routine step during current step

## Success Metrics

- Habit completion time: <500ms perceived (optimistic UI)
- Routine start time: <1s from click to first step
- Calendar load time: <200ms for month view
- Mobile touch target size: ≥44px
- Keyboard navigation: All actions accessible
- Accessibility score: WCAG 2.1 AA compliant

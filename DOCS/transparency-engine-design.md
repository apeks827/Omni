# Transparency Engine Design Specification

## Overview

This document specifies the UI/UX design for the "Why now?" transparency feature that explains scheduling decisions to users.

---

## Component: "Why Now?" Button

### Placement

- **Location**: Task card in CalendarView, positioned below task title and duration
- **Spacing**: `marginTop: 6px` from the task duration text
- **Never shown**: For unscheduled tasks (tasks without `due_date`)

### Visual Design

| State        | Appearance                              |
| ------------ | --------------------------------------- |
| Default      | `💡 Why now?` in primary blue (#007bff) |
| Hover        | 80% opacity                             |
| Active/Focus | Focus ring with `focus` color           |
| Disabled     | N/A (only shown for scheduled tasks)    |

### Icon

- Use emoji `💡` (light bulb) for universal support
- Font size: 16px

### Accessibility

- `aria-label="Why this time?"`
- `aria-expanded` reflects open/closed state
- Keyboard navigable (Enter/Space to activate)

---

## Explanation Modal/Popover

### Desktop Behavior

- **Type**: Popover (positioned below trigger button)
- **Width**: 320px - 400px
- **Max Height**: 80vh with scroll
- **Position**: Absolute, below the trigger button

### Mobile Behavior (<768px)

- **Type**: Full-screen modal sliding up from bottom
- **Border Radius**: Top corners only (12px)
- **Max Height**: 90vh

### Visual Design

#### Header

- Title: "Why this time?" (h2, semibold, 1.25rem)
- Close button (×) on right side
- Border-bottom: 1px gray-200

#### Content Sections

**1. Suggested Time Block**

- Label: "Suggested time" (caption, gray-600)
- Time display: Formatted date/time (semibold, 16px)
  - Format: "Mon, Mar 30, 2:00 PM"
- Duration: "(45 minutes)" (caption, gray-600)

**2. Decision Factors Section**

- Title: "Decision factors" (body, medium weight)
- Factors sorted by weight (highest first)

**Factor Item Design:**

```
┌─────────────────────────────────────────┐
│ 🔥 Priority level              35%      │
│ ███████████████████░░░░░░░░░░░░░░░░░░░ │
│ This task has high priority             │
└─────────────────────────────────────────┘
```

| Element      | Style                                  |
| ------------ | -------------------------------------- |
| Icon         | 20px emoji, flex-shrink: 0             |
| Label        | Body text, medium weight               |
| Percentage   | Body text, semibold, colored by weight |
| Progress Bar | 6px height, full width, rounded        |
| Reason       | Caption, gray-600                      |

**Weight Color Coding:**
| Weight Range | Color |
|--------------|-------|
| ≥70% | Green (#28a745) |
| 40-69% | Yellow (#ffc107) |
| <40% | Gray (#adb5bd) |

**Factor Labels (Plain Language):**
| Type | Label |
|------|-------|
| priority | Priority level |
| energy | Energy alignment |
| available_time | Available time slot |
| deadline | Deadline proximity |
| user_preference | Your preferences |
| context | Task context |

#### 3. Action Buttons Section

- Border-top: 1px gray-200
- Padding-top: spacing.md

**Primary Actions:**
| Button | Variant | Width |
|--------|---------|-------|
| Accept | success (green) | flex: 1 |
| Re-suggest | outline | flex: 1 |

**Manual Override:**

- Label: "Or choose a different time" (caption, gray-600)
- DateTime picker input
- Set button (primary)

---

## Interaction States

### Loading State

- Display: "Loading explanation..." centered in content area
- Color: gray-600

### Empty/Error State

- Display: Error message if API fails
- Retry: Automatic on component mount

### Close Interactions

- Click overlay backdrop
- Click × button
- Press Escape key
- On mobile: Swipe down gesture (optional enhancement)

---

## Responsive Breakpoints

| Breakpoint | Layout                                |
| ---------- | ------------------------------------- |
| < 768px    | Full-screen modal, bottom sheet style |
| ≥ 768px    | Popover, 320-400px width              |

---

## Animation

| Element      | Animation                    |
| ------------ | ---------------------------- |
| Modal appear | Fade in overlay (0.2s)       |
| Weight bars  | Width transition (0.3s ease) |
| Button hover | Opacity transition (0.2s)    |

---

## Accessibility (WCAG 2.1 AA)

- [ ] All interactive elements focusable
- [ ] Focus indicators visible
- [ ] Color contrast ratios meet AA standards
- [ ] ARIA labels on icon-only buttons
- [ ] Modal traps focus when open
- [ ] Escape key closes modal
- [ ] Screen reader announces state changes

---

## Analytics Events

| Event                     | Trigger                   |
| ------------------------- | ------------------------- |
| `explanation_viewed`      | Modal opened              |
| `explanation_accepted`    | Accept button clicked     |
| `explanation_resuggest`   | Re-suggest button clicked |
| `explanation_manual_edit` | Manual time set           |

---

## Implementation Files

- Component: `client/src/components/ScheduleExplanationTooltip.tsx`
- Calendar Integration: `client/src/components/CalendarView.tsx`
- Types: `shared/types/scheduling.ts`
- Design System: `client/src/design-system/`

---

## Mockup Reference

### Desktop Popover (320-400px)

```
┌─────────────────────────────────────┐
│ Why this time?                  [×] │
├─────────────────────────────────────┤
│ Suggested time                      │
│ Mon, Mar 30, 2:00 PM                │
│ (45 minutes)                        │
│                                     │
│ Decision factors                    │
│ ┌─────────────────────────────────┐ │
│ │ ⭐ Priority level         35%   │ │
│ │ ████████████████░░░░░░░░░░░░░  │ │
│ │ This task has high priority     │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ⚡ Energy alignment       28%   │ │
│ │ ████████████░░░░░░░░░░░░░░░░░  │ │
│ │ Peak energy hours available     │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 📅 Available time slot    22%   │ │
│ │ █████████░░░░░░░░░░░░░░░░░░░░░  │ │
│ │ 2-hour slot fits your task      │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ⏰ Deadline proximity     15%   │ │
│ │ ███████░░░░░░░░░░░░░░░░░░░░░░  │ │
│ │ Due in 3 days                   │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ ┌────────────┐ ┌────────────┐       │
│ │   Accept   │ │ Re-suggest │       │
│ └────────────┘ └────────────┘       │
│                                     │
│ Or choose a different time          │
│ ┌─────────────────────┐ ┌────┐      │
│ │ 03/30/2026  3:00 PM│ │Set │      │
│ └─────────────────────┘ └────┘      │
└─────────────────────────────────────┘
```

### Mobile Modal (Full-width, bottom sheet)

```
┌─────────────────────────────────────┐
│ Why this time?                  [×] │
├─────────────────────────────────────┤
│                                     │
│ Suggested time                      │
│ Mon, Mar 30, 2:00 PM                │
│ (45 minutes)                        │
│                                     │
│ Decision factors                    │
│ ...                                 │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │            Accept               │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │          Re-suggest             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Or choose a different time          │
│ ┌─────────────────────────────────┐ │
│ │ 03/30/2026  3:00 PM        Set │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

# Phase 2 Interaction Patterns and Visual Mockups

## Design System Foundation
These patterns implement the Omni Design System documented in `design_system_spec.md`. All components, colors, typography, and spacing follow the established guidelines to ensure visual and interaction consistency.

### Design System Usage Examples
- **Color Usage**: Primary color #007bff for interactive elements, Danger #dc3545 for destructive actions
- **Typography**: Headings use Roboto 600 weight, Body uses Roboto 400 weight
- **Spacing**: 8px base unit with 4px/8px/16px/24px/32px/48px scale
- **Components**: TaskItem, Form elements, Buttons follow specification exactly

## 1. Intent Processing Design

### Visual Design

- **Input Field**: Large, centered text area with placeholder "What do you want to do?" (Roboto 1.1rem, color #6c757d)
- **Submit Button**: Primary style (#007bff), positioned to the right of input or below on mobile
- **Suggested Intents**: Display 3-5 suggestion tiles below input once user starts typing
- **Confirmation Card**: Modal showing parsed intent with edit capabilities

### Interaction Flow

1. **Initial State**
   - Clean input field with subtle placeholder animation
   - Optional: Quick-add buttons for common task types

2. **Typing Phase**
   - Real-time parsing indicator (pulsing animation)
   - Auto-suggestions based on keywords
   - Smart form auto-filling (detected date, priority)

3. **Confirmation Phase**
   - Card appears with parsed details: Title, Type (task/habit/routine), Duration, Priority, Suggested Time
   - Editable fields for user correction
   - "Confirm" (primary) or "Cancel" (secondary) actions
   - "Explain" button for parsing reasoning

### States

- **Idle**: Input only
- **Parsing**: Spinner in the input field, suggestions disabled
- **Ambiguous**: Show disambiguation cards with multiple interpretations
- **Error**: Inline error message with suggestions for refinement

---

## 2. Adaptive Scheduling Design

### Visual Design

- **Calendar View**: Weekly view as default, with day columns
- **Time slots**: 30min blocks, color-coded by task category
- **Conflict indicator**: Red highlight for overlapping tasks
- **Reschedule prompt**: Modal showing alternative slots

### Interaction Flow

1. **View Schedule**
   - User can toggle between day, week, and list views
   - Tasks display as colored blocks with title and time
   - Drag-and-drop support for manual rescheduling

2. **Autoplacement**
   - System places task in optimal slot automatically
   - User receives notification with "Undo" option
   - Scheduling explanation accessible via "Why this time?" button

3. **Conflict Resolution**
   - Visual warning on conflicting tasks
   - System proposes solution: reschedule lower priority, split task, or manual pick
   - User selects resolution path

4. **Real-time Adjustment**
   - When a task is completed early/late, adjacent tasks may shift
   - Smooth animation for schedule updates
   - Toast notification for significant changes

### States

- **Optimal**: Clean schedule, green/blue tasks
- **Conflict**: Red border on overlapping tasks, warning icon
- **Dense**: Schedule >90% full, yellow accent
- **Overbooked**: >100% full, red accent with overflow indicator

---

## 3. Context Awareness Design

### Visual Design

- **Context Indicator**: Small status icon in header showing current context (Home, Work, Transit, etc.)
- **Context-aware suggestions**: Filtered task list based on location/device
- **Privacy Mode Toggle**: Switch in settings to limit context collection

### Privacy & Consent

- **Explicit Opt-in**: Location and context features require explicit user consent during onboarding
- **Granular Controls**: Users can enable/disable individual context sources (location, calendar, device type)
- **Data Transparency**: Settings panel shows what data is collected and how it's used
- **Privacy Mode**: One-tap toggle to disable all context collection temporarily
- **Data Retention**: Clear policy on how long context data is stored (default: 30 days)

### Interaction Flow

1. **Automatic Detection**
   - System detects location change (geofencing) - only if user has granted permission
   - Device type switches (mobile <-> desktop)
   - Calendar event changes

2. **Adaptive Response**
   - Relevant tasks surface to top of list
   - Notifications appear for context-sensitive items
   - Schedule recalculates based on new context

3. **User Override**
   - Manual context setting available
   - "I'm at..." button for quick context declaration
   - Override duration selection (1hr, 3hrs, until...)

---

## 4. Transparency and Explanation Design

### Visual Design

- **Explain Button**: "Why?" icon next to scheduled tasks
- **Explanation Panel**: Side panel or modal showing detailed reasoning
- **Decision Log**: Timeline of system actions with reasons

### Interaction Flow

1. **Request Explanation**
   - Click "Why?" next to any system-generated decision
   - Panel slides in from right or opens modal
   - Factors listed with confidence levels

2. **Feedback Mechanism**
   - "This was helpful" / "This wasn't helpful" buttons
   - Optional free-text feedback
   - Feedback influences future weighting

3. **Preference Adjustment**
   - From explanation view, user can access related preference sliders
   - "Adjust my settings" links directly to relevant config

### Content Structure

- **What**: Brief summary of decision
- **Why**: Bulleted list of primary factors
- **Data**: What information was used (location, calendar, history)
- **Alternatives**: What other options were considered
- **Impact**: How this affects other scheduled items

---

## 5. Notification System Design

### Visual Design

- **Toast Notifications**: Non-intrusive banners at top-right (desktop) or bottom (mobile)
- **Persistent Alerts**: For critical schedule changes requiring action
- **Quiet Hours**: Dimmed notifications, no sound

### Interaction Patterns

- **Swipe to dismiss** on mobile
- **Action buttons** within notification (Undo, Snooze, View)
- **Notification History** accessible via bell icon

---

## 6. Micro-interactions

### Loading States

- Skeleton screens for content loading with wave animation
- Subtle spinner (20px) for inline actions with aria-label for screen readers
- Full-page loading only for initial app load
- Progress indicators for longer operations (>2s)

### Transitions

- Task updates: quick fade (150ms)
- Schedule changes: smooth slide (300ms ease-out)
- Modals: scale + fade (200ms)
- Page transitions: slide horizontally (250ms)
- Animation reduction: Respects user's "prefers-reduced-motion" setting

### Hover/Focus States

- Buttons: 2px border outward or subtle lift with accessible focus indicator
- Task items: border highlight or background tint
- Icons: color shift to primary
- All interactive elements have visible focus states for keyboard navigation

### Mobile Consistency

- Touch targets: Minimum 48x48dp for all interactive elements
- Gestures: Swipe actions for common operations (swipe to delete, swipe to archive)
- Responsive adaptation: Designs adapt to mobile viewport (320px minimum) with adjusted spacing and font sizes
- Orientation support: Both portrait and landscape layouts tested
- Haptic feedback: Subtle vibration for critical actions (delete, save)

---

## 7. Accessibility Considerations

- All colors meet WCAG 2.1 AA standards as defined in the Design System
- Focus order follows logical reading order (header → main → navigation → content → footer)
- ARIA labels for icon buttons and interactive elements without visible text
- Keyboard navigation support:
  - Ctrl/Cmd + K: Open intent input
  - Esc: Close modals and dropdowns
  - Tab: Navigate interactive elements in logical order
  - Arrow keys: Navigate within grouped elements (lists, tabs, menus)
  - Space/Enter: Activate focused elements
- Screen reader compatibility:
  - Semantic HTML structure with proper heading hierarchy (H1 → H6)
  - ARIA landmarks for page structure (banner, main, navigation, contentinfo)
  - Dynamic content updates announced via live regions
  - Form elements with associated labels and error messaging
- Focus indicators: Visible 3px outline for keyboard navigation as specified in Design System

---

## Conclusion

These interaction patterns and visual specs provide a complete design foundation for Phase 2 features. They align with the core product principles of transparency, adaptability, and efficiency while maintaining consistency with the existing design system.

The Design System Specification (design_system_spec.md) and these Phase 2 patterns together constitute the complete set of UI/UX deliverables for review by Product Critic.

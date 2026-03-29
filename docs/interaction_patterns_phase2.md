# Phase 2 Interaction Patterns and Visual Mockups

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

### Interaction Flow

1. **Automatic Detection**
   - System detects location change (geofencing)
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

- Skeleton screens for content loading
- Subtle spinner (20px) for inline actions
- Full-page loading only for initial app load

### Transitions

- Task updates: quick fade (150ms)
- Schedule changes: smooth slide (300ms ease-out)
- Modals: scale + fade (200ms)
- Page transitions: slide horizontally (250ms)

### Hover States

- Buttons: 2px border outward or subtle lift
- Task items: border highlight or background tint
- Icons: color shift to primary

---

## 7. Accessibility Considerations

- All colors meet WCAG AA standards
- Focus order follows logical reading order
- ARIA labels for icon buttons
- Keyboard shortcuts:
  - Ctrl/Cmd + K: Open intent input
  - Esc: Close modals
  - Tab: Navigate interactive elements

---

## Conclusion

These interaction patterns and visual specs provide a complete design foundation for Phase 2 features. They align with the core product principles of transparency, adaptability, and efficiency while maintaining consistency with the existing design system.

The Design System Specification (design_system_spec.md) and these Phase 2 patterns together constitute the complete set of UI/UX deliverables for review by Product Critic.

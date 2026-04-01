# Wireframes: Natural Language Input UI

## Overview

Design for natural language task input with real-time parsing, confidence indicators, and fallback to manual entry.

## User Flow

```
[Input] → [Parse] → [Preview] → [Review Modal] → [Save/Edit]
```

## Desktop Wireframes

### 1. Initial State - Empty Input

```
┌─────────────────────────────────────────────────────────────┐
│  Add a task... (e.g., "Buy groceries tomorrow at 5pm")     │
└─────────────────────────────────────────────────────────────┘
```

### 2. Typing State

```
┌─────────────────────────────────────────────────────────────┐
│  Buy groceries tomorrow at 5pm                   Waiting... │
└─────────────────────────────────────────────────────────────┘
```

### 3. Analyzing State

```
┌─────────────────────────────────────────────────────────────┐
│  Buy groceries tomorrow at 5pm                              │
└─────────────────────────────────────────────────────────────┘

  ⟳ Analyzing...
```

### 4. Preview State - High Confidence

```
┌─────────────────────────────────────────────────────────────┐
│  Buy groceries tomorrow at 5pm                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Preview                                                     │
│                                                              │
│  Title: Buy groceries                                       │
│                                                              │
│  [medium] [Mar 31, 2026] [17:00]                           │
│                                                              │
│  title: 95%  due_date: 88%  due_time: 92%  priority: 75%  │
│  (green)     (green)        (green)         (green)        │
│                                                              │
│  [Review & Create]  [Clear]                                 │
└─────────────────────────────────────────────────────────────┘
```

### 5. Preview State - Low Confidence Warning

```
┌─────────────────────────────────────────────────────────────┐
│  Buy stuff maybe next week sometime                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ⚠ Low confidence detected. Some fields may not have been   │
│     parsed correctly. Please review carefully.              │
│                                                              │
│  Preview                                                     │
│                                                              │
│  Title: Buy stuff                                           │
│                                                              │
│  [medium] [Apr 6, 2026]                                   │
│                                                              │
│  title: 65%  due_date: 42%  priority: 38%                  │
│  (yellow)    (red)          (red)                          │
│                                                              │
│  [Review & Create]  [Clear]                                 │
└─────────────────────────────────────────────────────────────┘
```

### 6. Error State

```
┌─────────────────────────────────────────────────────────────┐
│  Buy groceries tomorrow at 5pm                              │
└─────────────────────────────────────────────────────────────┘

  ✗ Failed to extract task data  [Retry]
```

### 7. Review Modal - Desktop

```
┌───────────────────────────────────────────────────────────────┐
│  Review Task                                            [×]   │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  Title  95%                                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Buy groceries                                           │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  Priority  75%          Due Date  88%      Due Time  92%     │
│  ┌──────────────┐      ┌──────────────┐   ┌──────────────┐  │
│  │ Medium    ▼  │      │ 2026-03-31   │   │ 17:00        │  │
│  └──────────────┘      └──────────────┘   └──────────────┘  │
│                                                               │
│  Location               Category                             │
│  ┌──────────────┐      ┌──────────────┐                     │
│  │ Optional     │      │ Optional     │                     │
│  └──────────────┘      └──────────────┘                     │
│                                                               │
│  ─────────────────────────────────────────────────────────   │
│  Overall parsing confidence: 87%                             │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│                    [Edit as Manual] [Cancel] [Save Task]     │
└───────────────────────────────────────────────────────────────┘
```

## Mobile Wireframes

### 1. Mobile - Initial State

```
┌─────────────────────────┐
│  ☰  Omni            👤  │
├─────────────────────────┤
│                         │
│  ┌───────────────────┐  │
│  │ Add a task...     │  │
│  │ (e.g., "Buy      │  │
│  │ groceries...")   │  │
│  └───────────────────┘  │
│                         │
│  [Tasks List Below]     │
│                         │
└─────────────────────────┘
```

### 2. Mobile - Preview State

```
┌─────────────────────────┐
│  ┌───────────────────┐  │
│  │ Buy groceries     │  │
│  │ tomorrow at 5pm   │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ Preview           │  │
│  │                   │  │
│  │ Title:            │  │
│  │ Buy groceries     │  │
│  │                   │  │
│  │ [medium]          │  │
│  │ [Mar 31, 2026]    │  │
│  │ [17:00]           │  │
│  │                   │  │
│  │ Confidence:       │  │
│  │ title: 95%        │  │
│  │ date: 88%         │  │
│  │ time: 92%         │  │
│  │                   │  │
│  │ [Review & Create] │  │
│  │ [Clear]           │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

### 3. Mobile - Review Modal

```
┌─────────────────────────┐
│  Review Task        [×] │
├─────────────────────────┤
│                         │
│  Title  95%             │
│  ┌───────────────────┐  │
│  │ Buy groceries     │  │
│  └───────────────────┘  │
│                         │
│  Priority  75%          │
│  ┌───────────────────┐  │
│  │ Medium         ▼  │  │
│  └───────────────────┘  │
│                         │
│  Due Date  88%          │
│  ┌───────────────────┐  │
│  │ 2026-03-31        │  │
│  └───────────────────┘  │
│                         │
│  Due Time  92%          │
│  ┌───────────────────┐  │
│  │ 17:00             │  │
│  └───────────────────┘  │
│                         │
│  Location               │
│  ┌───────────────────┐  │
│  │ Optional          │  │
│  └───────────────────┘  │
│                         │
│  Category               │
│  ┌───────────────────┐  │
│  │ Optional          │  │
│  └───────────────────┘  │
│                         │
│  ───────────────────    │
│  Overall: 87%           │
│                         │
├─────────────────────────┤
│  [Edit as Manual]       │
│  [Cancel] [Save Task]   │
└─────────────────────────┘
```

## Design Specifications

### Colors & Visual Feedback

**Confidence Indicators:**

- High (≥70%): Green (#28a745)
- Medium (50-69%): Yellow (#ffc107)
- Low (<50%): Red (#dc3545)

**States:**

- Primary Action: Blue (#007bff)
- Secondary Action: Gray (#6c757d)
- Warning Background: Yellow tint (#ffc10720)
- Error: Red (#dc3545)
- Success: Green (#28a745)

### Typography

- Input placeholder: 1rem, gray (#6c757d)
- Preview title: 0.875rem, bold
- Confidence badges: 0.75rem
- Field labels: 0.875rem, medium weight

### Spacing

- Input padding: 8px 16px
- Preview container: 16px padding
- Modal padding: 24px
- Element gaps: 8-16px

### Interactions

**Input Field:**

- Debounce: 300ms after typing stops
- Loading spinner appears during API call
- Clear button appears when text is entered

**Preview Panel:**

- Slides in smoothly after parsing
- Badges show extracted values
- Confidence percentages color-coded
- "Review & Create" button is primary action

**Review Modal:**

- Opens on "Review & Create" click
- All fields editable
- Confidence badges next to each field
- Low confidence warning at top if avg < 50%
- "Edit as Manual" switches to full form
- ESC key closes modal

### Accessibility

**ARIA Labels:**

- Input: `aria-label="Natural language task input"`
- Confidence badges: `aria-label="Confidence: 95%"`
- Modal: `role="dialog"` with `aria-labelledby`

**Keyboard Navigation:**

- Tab through all interactive elements
- Enter to submit from input
- ESC to close modal
- Focus trap in modal

**Screen Reader:**

- Announce parsing status changes
- Read confidence levels with field names
- Alert on errors

### Responsive Breakpoints

- Mobile: < 768px (single column, full width)
- Tablet: 768px - 1024px (optimized spacing)
- Desktop: > 1024px (multi-column layout in modal)

## Component Architecture

```
NLPTaskInput (Inline Preview)
├── Input field with debounce
├── Loading indicator
├── Error display with retry
└── Preview panel
    ├── Parsed values display
    ├── Confidence badges
    └── Action buttons

TaskReviewModal (Full Edit)
├── Modal container
├── Low confidence warning (conditional)
├── Editable form fields
│   ├── Title (with confidence)
│   ├── Priority (with confidence)
│   ├── Due Date (with confidence)
│   ├── Due Time (with confidence)
│   ├── Location (with confidence)
│   └── Category (with confidence)
├── Overall confidence display
└── Footer actions
    ├── Edit as Manual
    ├── Cancel
    └── Save Task

NLPTaskInputWithModal (Orchestrator)
├── NLPTaskInput
└── TaskReviewModal
```

## Implementation Status

✅ **Complete:**

- Desktop wireframes
- Mobile wireframes
- Color specifications
- Interaction patterns
- Accessibility requirements
- Component architecture

✅ **Already Implemented:**

- NLPTaskInput component (client/src/components/NLPTaskInput.tsx)
- TaskReviewModal component (client/src/components/TaskReviewModal.tsx)
- NLPTaskInputWithModal orchestrator (client/src/components/NLPTaskInputWithModal.tsx)
- Design system tokens (colors, spacing, typography)
- Modal component (design-system/components/Modal/Modal.tsx)
- Input component (design-system/components/Input/Input.tsx)

🔧 **Fixed:**

- API endpoint corrected from `/api/tasks/extract` to `/api/intents`

## Next Steps for Frontend Engineer

1. Verify API integration with `/api/intents` endpoint
2. Test confidence indicator thresholds (0.7, 0.5)
3. Implement responsive layout for mobile
4. Add keyboard shortcuts (Enter to submit, ESC to close)
5. Test with various natural language inputs
6. Verify accessibility with screen readers
7. Add unit tests for parsing logic
8. Add integration tests for full flow

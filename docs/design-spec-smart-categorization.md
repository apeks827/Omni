# Design Specification: Smart Categorization UI

## Overview

UI components for displaying and overriding automatic task/habit/routine classification.

## Category Badge Component

### Visual Design

**Badge Variants:**

- **Task** (one-time actions)
  - Color: `#007bff` (primary blue)
  - Icon: ✓ checkmark
  - Label: "Task"

- **Habit** (recurring personal)
  - Color: `#8b5cf6` (purple)
  - Icon: ⟳ repeat
  - Label: "Habit"

- **Routine** (recurring household)
  - Color: `#10b981` (green)
  - Icon: 🏠 home
  - Label: "Routine"

### Badge Specifications

- Size: Small (`sm`) - matches existing Badge component
- Border radius: `9999px` (full rounded)
- Padding: `2px 8px`
- Font size: `0.75rem`
- Font weight: `500` (medium)
- Display: Inline with other badges (priority, duration, context)

### Placement

- Position: In TaskCard badge row, after priority badge
- Mobile: Same position, wraps naturally with other badges
- List view: Inline with task title on the left side

## Category Override UI

### Interaction Pattern

**Dropdown Menu Approach** (recommended for simplicity)

1. **Trigger**: Click on category badge
2. **Menu**: Dropdown with 3 options
   - Task ✓
   - Habit ⟳
   - Routine 🏠
3. **Selection**: Single click to change
4. **Feedback**: Badge updates immediately, subtle animation

### Override Dropdown Specs

- Width: `140px`
- Position: Below badge, aligned left
- Shadow: `0 4px 6px rgba(0,0,0,0.1)`
- Border radius: `4px`
- Background: White
- Each option:
  - Height: `36px`
  - Padding: `8px 12px`
  - Hover: Light gray background `#f8f9fa`
  - Active: Checkmark on right side

### Confidence Indicator (Optional Enhancement)

For ambiguous classifications (confidence < 70%):

- Add small dot indicator next to badge
- Color: `#ffc107` (warning yellow)
- Tooltip: "Low confidence - please verify"
- Size: `6px` diameter

## Wireframes

### Task List View with Category Badges

```
┌─────────────────────────────────────────────────────────┐
│ [✓] Buy groceries                                       │
│     [HIGH] [Task ✓] [30m] [🏪 Errands]                 │
│     Due: Today at 5:00 PM                               │
├─────────────────────────────────────────────────────────┤
│ [✓] Start running every morning                         │
│     [MEDIUM] [Habit ⟳] [Daily] [💪 Health]             │
│     Next: Tomorrow at 7:00 AM                           │
├─────────────────────────────────────────────────────────┤
│ [✓] Clean kitchen                                       │
│     [LOW] [Routine 🏠] [Weekly] [🏠 Home]              │
│     Next: Thursday at 6:00 PM                           │
└─────────────────────────────────────────────────────────┘
```

### Category Override Dropdown

```
┌─────────────────────────────────────────────────────────┐
│ [✓] Start running every morning                         │
│     [MEDIUM] [Habit ⟳▼]                                 │
│              ┌──────────────┐                           │
│              │ Task ✓       │                           │
│              │ Habit ⟳    ✓ │ ← Currently selected     │
│              │ Routine 🏠   │                           │
│              └──────────────┘                           │
└─────────────────────────────────────────────────────────┘
```

### Mobile View

```
┌──────────────────────────┐
│ Buy groceries            │
│ [HIGH] [Task ✓] [30m]   │
│ Due: Today 5:00 PM       │
├──────────────────────────┤
│ Start running            │
│ [MED] [Habit ⟳] [Daily] │
│ Next: Tomorrow 7:00 AM   │
└──────────────────────────┘
```

## Component Implementation Plan

### 1. CategoryBadge Component

**File**: `client/src/components/CategoryBadge.tsx`

**Props**:

```typescript
interface CategoryBadgeProps {
  category: 'task' | 'habit' | 'routine'
  confidence?: number // 0-1 scale
  onCategoryChange?: (newCategory: 'task' | 'habit' | 'routine') => void
  size?: 'sm' | 'md'
  readonly?: boolean
}
```

**Features**:

- Displays category with icon and color
- Shows confidence indicator if < 0.7
- Opens dropdown on click (if not readonly)
- Emits change event on selection

### 2. CategoryDropdown Component

**File**: `client/src/components/CategoryDropdown.tsx`

**Props**:

```typescript
interface CategoryDropdownProps {
  currentCategory: 'task' | 'habit' | 'routine'
  onSelect: (category: 'task' | 'habit' | 'routine') => void
  onClose: () => void
  anchorEl: HTMLElement
}
```

**Features**:

- Portal-based dropdown
- Keyboard navigation (arrow keys, Enter, Escape)
- Click outside to close
- Smooth fade-in animation

### 3. Integration with TaskCard

**File**: `client/src/components/TaskCard.tsx`

**Changes**:

- Add `intent_type` field to Task type
- Display CategoryBadge in badge row
- Handle category override API call
- Show loading state during update

## API Integration

### Task Response Schema

```typescript
interface Task {
  // ... existing fields
  intent_type: 'task' | 'habit' | 'routine'
  classification_confidence?: number
}
```

### Override Endpoint

```
PATCH /api/tasks/:id
Body: {
  intent_type: 'task' | 'habit' | 'routine'
}
```

## Accessibility

- **Keyboard Navigation**:
  - Tab to focus badge
  - Enter/Space to open dropdown
  - Arrow keys to navigate options
  - Enter to select, Escape to close

- **Screen Reader**:
  - Badge: "Category: Task, clickable to change"
  - Dropdown: "Category selection menu, 3 options"
  - Options: "Task, not selected" / "Habit, currently selected"

- **Color Contrast**: All badge colors meet WCAG AA (4.5:1 minimum)

## Animation & Transitions

- **Badge Change**:
  - Duration: 200ms
  - Easing: ease-out
  - Effect: Fade + scale (0.95 → 1.0)

- **Dropdown Open**:
  - Duration: 150ms
  - Easing: ease-out
  - Effect: Fade + slide down (8px)

- **Confidence Indicator**:
  - Pulse animation: 2s infinite
  - Opacity: 0.6 → 1.0

## Design Tokens

```typescript
export const categoryColors = {
  task: '#007bff', // Primary blue
  habit: '#8b5cf6', // Purple
  routine: '#10b981', // Green
}

export const categoryIcons = {
  task: '✓',
  habit: '⟳',
  routine: '🏠',
}

export const categoryLabels = {
  task: 'Task',
  habit: 'Habit',
  routine: 'Routine',
}
```

## Handoff Checklist

- [x] Badge visual design (colors, icons, labels)
- [x] Override dropdown component design
- [x] Wireframes for task list with badges
- [x] Mobile-responsive layout
- [x] Confidence indicator design
- [x] Accessibility specifications
- [x] Animation specifications
- [x] Design tokens defined
- [x] Component API defined
- [x] Integration points identified

## Next Steps for Frontend Engineer

1. Create `CategoryBadge.tsx` component with dropdown
2. Add `intent_type` field to Task type
3. Integrate CategoryBadge into TaskCard
4. Implement PATCH endpoint for category override
5. Add category colors to design tokens
6. Write Storybook stories for CategoryBadge
7. Test keyboard navigation and screen reader support

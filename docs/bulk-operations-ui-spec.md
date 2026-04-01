# Bulk Task Operations UI Specification

## Overview

Specification for implementing bulk operations on task lists, enabling users to efficiently manage multiple tasks simultaneously. Design references OmniFocus and Things for clean, intuitive bulk operation patterns.

## Components

### 1. Multi-Select Checkboxes

**Location**: Left edge of each TaskItem component

**Visual Design**:

- 20x20px checkbox with 2px border
- Unchecked: Border color `colors.gray400`, transparent background
- Checked: Background `colors.primary`, white checkmark icon
- Hover: Border color `colors.primary`, subtle scale (1.05)
- Disabled: Opacity 0.5, cursor not-allowed

**Behavior**:

- Click checkbox to toggle individual task selection
- Shift+Click: Range select from last selected to current
- Cmd/Ctrl+A: Select all visible tasks (respects current filters)
- Selection persists across filter changes

### 2. Bulk Action Toolbar

**Location**: Fixed position above task list, slides down when items selected

**Visual Design**:

- Height: 56px
- Background: `colors.gray50` with `shadows.md`
- Border-bottom: 1px solid `colors.gray200`
- Padding: `spacing.md`
- Animation: Slide down 200ms ease-out

**Layout**:

```
[Selection Counter] [Select All/None] [Spacer] [Action Buttons] [Close X]
```

**Components**:

- **Selection Counter Badge**: `{count} selected` in `Badge` variant="info"
- **Select All/None Toggle**: `Button` variant="ghost" size="sm"
- **Action Buttons**: Horizontal stack with `spacing.sm`
- **Close Button**: Icon button to clear selection

### 3. Action Buttons

**Available Actions**:

1. **Change Status**
   - Icon: Status icon
   - Dropdown menu: Todo, In Progress, Done
   - Applies status to all selected tasks
   - Shows confirmation toast

2. **Change Priority**
   - Icon: Flag icon
   - Dropdown menu: Low, Medium, High, Critical
   - Applies priority to all selected tasks
   - Shows confirmation toast

3. **Assign Tags** (future)
   - Icon: Tag icon
   - Opens tag picker modal
   - Applies selected tags to all tasks

4. **Move to Project** (future)
   - Icon: Folder icon
   - Dropdown menu of projects
   - Moves all selected tasks to chosen project

5. **Delete**
   - Icon: Trash icon
   - Button variant="danger"
   - Opens confirmation dialog (see below)
   - Shows undo toast after deletion

**Button Styling**:

- Size: "sm"
- Variant: "outline" (except Delete: "danger")
- Gap: `spacing.sm`
- Icon + Text label

### 4. Confirmation Dialog (Destructive Actions)

**Trigger**: Delete action on multiple tasks

**Modal Properties**:

- Size: "sm"
- Title: "Delete {count} tasks?"
- Escape key to cancel

**Content**:

```
Are you sure you want to delete {count} selected tasks?
This action cannot be undone.
```

**Footer Actions**:

- Cancel button: variant="outline"
- Delete button: variant="danger", text="Delete {count} tasks"

### 5. Undo Toast Notification

**Trigger**: After successful bulk action completion

**Visual Design**:

- Position: Bottom-center, 24px from bottom
- Width: Auto, max 400px
- Background: `colors.dark` with 0.95 opacity
- Border-radius: `borderRadius.lg`
- Padding: `spacing.md`
- Shadow: `shadows.lg`
- Duration: 5 seconds auto-dismiss

**Content Layout**:

```
[Success Icon] {Action} completed for {count} tasks [Undo Button] [X]
```

**Undo Button**:

- Variant: "ghost"
- Color: `colors.primary` (light blue for visibility on dark bg)
- Reverts the bulk action
- Disabled after toast dismisses

## Keyboard Shortcuts

| Shortcut         | Action                              |
| ---------------- | ----------------------------------- |
| Shift + Click    | Range select tasks                  |
| Cmd/Ctrl + A     | Select all visible tasks            |
| Cmd/Ctrl + D     | Deselect all                        |
| Delete/Backspace | Delete selected (with confirmation) |
| Escape           | Clear selection / Close toolbar     |

## Component States

### TaskItem States

1. **Default**: No checkbox visible
2. **Selection Mode Active**: Checkbox visible on left
3. **Selected**: Checkbox checked, subtle background highlight (`colors.primary` at 5% opacity)
4. **Hover (Selection Mode)**: Checkbox border highlighted

### Bulk Toolbar States

1. **Hidden**: No tasks selected
2. **Visible**: 1+ tasks selected, toolbar slides down
3. **Action In Progress**: Loading state on action buttons
4. **Action Complete**: Brief success state before returning to normal

### Selection Counter States

- "1 selected" (singular)
- "{n} selected" (plural)
- "All {n} selected" (when all visible tasks selected)

## Implementation Notes

### State Management

```typescript
interface BulkOperationState {
  selectedTaskIds: Set<string>
  isSelectionMode: boolean
  lastSelectedIndex: number | null
  actionInProgress: boolean
}
```

### TaskList Component Updates

- Add `selectionMode` state
- Add `selectedTasks` Set state
- Render BulkActionToolbar when `selectedTasks.size > 0`
- Pass selection handlers to TaskItem components
- Implement range selection logic for Shift+Click

### TaskItem Component Updates

- Add `isSelectionMode` prop
- Add `isSelected` prop
- Add `onToggleSelect` callback
- Render checkbox when `isSelectionMode === true`
- Apply selected styling when `isSelected === true`

### New Components to Create

1. `BulkActionToolbar.tsx`
2. `BulkActionButton.tsx` (dropdown variant)
3. `ConfirmationDialog.tsx` (reusable)
4. `UndoToast.tsx`

## Accessibility

- All checkboxes have proper ARIA labels: `aria-label="Select task: {taskTitle}"`
- Bulk toolbar has `role="toolbar"` and `aria-label="Bulk actions"`
- Action buttons have descriptive `aria-label` attributes
- Keyboard navigation fully supported
- Focus management: Focus returns to task list after modal closes
- Screen reader announcements for selection count changes

## Visual Reference

**Selection Mode Active**:

```
┌─────────────────────────────────────────────────────────┐
│ [✓] 3 selected  [Select None]  [Status▾] [Priority▾] [🗑️ Delete] [×] │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ [✓] Fix login bug                    [High] [In Progress] │
│ [✓] Update documentation             [Low]  [Todo]        │
│ [ ] Review PR #123                   [Med]  [Todo]        │
│ [✓] Deploy to staging                [High] [Todo]        │
└─────────────────────────────────────────────────────────┘
```

**Undo Toast**:

```
┌──────────────────────────────────────────┐
│ ✓ Status changed for 3 tasks  [Undo] [×] │
└──────────────────────────────────────────┘
```

## Design Tokens Used

- Colors: `primary`, `gray50`, `gray200`, `gray400`, `dark`, `white`, `danger`, `info`
- Spacing: `xs`, `sm`, `md`, `lg`
- Border Radius: `md`, `lg`, `full`
- Shadows: `md`, `lg`
- Typography: `fontSize.sm`, `fontWeight.medium`

## Future Enhancements

- Bulk edit mode for inline editing multiple fields
- Saved bulk action presets
- Bulk drag-and-drop to projects
- Export selected tasks
- Duplicate selected tasks

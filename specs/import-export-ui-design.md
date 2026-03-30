# Import/Export UI Design Specification

## Overview

This document describes the UI/UX design for the task import/export feature in Omni. The design follows the existing design system patterns and provides an intuitive, multi-step workflow for both importing and exporting tasks.

## Design Principles

1. **Progressive Disclosure**: Show options progressively to avoid overwhelming users
2. **Clear Feedback**: Provide immediate visual feedback for all actions
3. **Error Prevention**: Guide users with validation and helpful hints
4. **Consistency**: Follow existing Omni design patterns and component library

## Component Architecture

```
ImportExportModal (Main Container)
├── Tab Navigation (Export | Import)
├── Progress Indicator (when processing)
├── Error Display (when errors occur)
└── Content Area
    ├── ExportPanel
    │   ├── Format Selection
    │   ├── Project Filter
    │   ├── Status Filter
    │   ├── Tag Filter
    │   ├── Date Range Filter
    │   └── Attachment Options
    └── ImportWizard
        ├── Step 1: Upload
        │   ├── Source Selection
        │   ├── File Upload
        │   └── Target Project
        ├── Step 2: Preview
        │   ├── Import Statistics
        │   ├── Sample Tasks
        │   ├── Conflict Detection
        │   └── Resolution Strategy
        └── Actions (Back | Import)
```

## Visual Design

### Color Palette

Following the existing design system tokens:

- **Primary**: `#007bff` - Action buttons, selected states
- **Success**: `#28a745` - Success indicators
- **Warning**: `#ffc107` - Conflict warnings
- **Danger**: `#dc3545` - Error states
- **Gray Scale**: `gray100` to `gray900` - Backgrounds, borders, text

### Typography

- **Headings**: `fontWeight.semibold`, `fontSize.md` to `fontSize.lg`
- **Body Text**: `fontWeight.normal`, `fontSize.md`
- **Labels**: `fontWeight.medium`, `fontSize.sm`
- **Hints**: `fontWeight.normal`, `fontSize.xs`, `color.gray600`

### Spacing

- **Section Spacing**: `spacing.lg` (24px)
- **Element Spacing**: `spacing.md` (16px)
- **Compact Spacing**: `spacing.sm` (8px)
- **Tight Spacing**: `spacing.xs` (4px)

## Export Panel Design

### Format Selection

**Visual Pattern**: Horizontal card grid

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│    { }      │  │     |||     │  │     M↓      │  │     📅      │
│    JSON     │  │     CSV     │  │  Markdown   │  │    iCal     │
│ Full backup │  │ Spreadsheet │  │ Docs & Git  │  │  Calendar   │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

**Interaction**:

- Hover: Subtle border color change
- Selected: Primary border (2px), light primary background
- Click: Single selection only

### Filter Sections

**Visual Pattern**: Collapsible sections with chip-based selection

```
┌─────────────────────────────────────────────────────────────┐
│ Projects                                    [Select All]     │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐                        │
│ │ Work    │ │ Personal│ │ Fitness │                        │
│ └─────────┘ └─────────┘ └─────────┘                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Filter by Status                                             │
│ ┌─────────┐ ┌─────────────┐ ┌──────┐ ┌─────────┐          │
│ │ todo    │ │ in progress │ │ done │ │ blocked │          │
│ └─────────┘ └─────────────┘ └──────┘ └─────────┘          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Filter by Tags                                               │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐                        │
│ │ #urgent │ │ #review │ │ #later  │                        │
│ └─────────┘ └─────────┘ └─────────┘                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Date Range (Optional)                                        │
│ From: [date picker]  To: [date picker]  [Clear]            │
└─────────────────────────────────────────────────────────────┘
```

**Interaction**:

- Chips toggle on/off with click
- Selected chips: Primary color with light background
- Unselected chips: Gray border with white background
- Multi-select enabled for all filters

### Attachment Options

**Visual Pattern**: Checkbox with label (JSON format only)

```
☑ Include attachments (metadata only)
```

## Import Wizard Design

### Step 1: Upload

**Source Selection**:

```
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│  JSON   │  │   CSV   │  │ Todoist │  │ Trello  │  │  Asana  │
└─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘
```

**File Upload Area**:

```
┌─────────────────────────────────────────────────────────────┐
│                            📁                                │
│                                                              │
│         Click to select file or drag and drop               │
│                                                              │
│              Supported formats: JSON, CSV                    │
└─────────────────────────────────────────────────────────────┘
```

**Interaction**:

- Drag-and-drop enabled
- Click to open file picker
- Show filename after selection
- Validate file type on selection

**Target Project Dropdown**:

```
┌─────────────────────────────────────────────────────────────┐
│ Select a project...                                      ▼  │
└─────────────────────────────────────────────────────────────┘
```

### Step 2: Preview

**Import Statistics**:

```
┌─────────────────────────────────────────────────────────────┐
│ Total Tasks                                              42  │
│ ─────────────────────────────────────────────────────────── │
│ Conflicts Detected                                        1  │
└─────────────────────────────────────────────────────────────┘
```

**Sample Tasks**:

```
┌─────────────────────────────────────────────────────────────┐
│ Sample Task 1                                                │
│ todo • high                                                  │
│ ─────────────────────────────────────────────────────────── │
│ Sample Task 2                                                │
│ in_progress • medium                                         │
└─────────────────────────────────────────────────────────────┘
```

**Conflict Resolution Strategy**:

```
┌─────────────────────────────────────────────────────────────┐
│ Skip conflicting items                                   ▼  │
└─────────────────────────────────────────────────────────────┘

Options:
- Skip conflicting items
- Overwrite existing items
- Merge fields (latest wins)
- Keep both (create duplicates)
- Manual resolution
```

## Progress Indicator

**Visual Pattern**: Linear progress bar with percentage

```
┌─────────────────────────────────────────────────────────────┐
│ ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ Exporting... 45%                                             │
└─────────────────────────────────────────────────────────────┘
```

**States**:

- 0-90%: Animated progress during processing
- 90-100%: Quick completion animation
- Color: Primary blue
- Height: 8px
- Border radius: Full (pill shape)

## Error Display

**Visual Pattern**: Alert box with icon and message

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠ Error                                                      │
│                                                              │
│ Failed to export tasks: Network connection lost             │
└─────────────────────────────────────────────────────────────┘
```

**Styling**:

- Background: `danger` color at 15% opacity
- Border: 1px solid `danger` color
- Text color: `danger` color
- Icon: Warning symbol
- Padding: `spacing.md`

## Modal Layout

**Size**: Large (800px width)
**Max Height**: 90vh with scrollable content
**Backdrop**: Semi-transparent black (50% opacity)
**Animation**: Fade in/out

**Header**:

- Title: "Import / Export"
- Close button (×) in top-right
- Border bottom: 1px solid gray200

**Footer**:

- Right-aligned action buttons
- Cancel button (secondary variant)
- Primary action button (disabled when processing)

## Accessibility

### Keyboard Navigation

- **Tab**: Navigate between interactive elements
- **Enter/Space**: Activate buttons and toggle chips
- **Escape**: Close modal
- **Arrow Keys**: Navigate within chip groups

### ARIA Labels

- Modal: `role="dialog"` with `aria-labelledby` for title
- Tabs: `role="tablist"` with proper `aria-selected` states
- File upload: Clear label and instructions
- Progress bar: `role="progressbar"` with `aria-valuenow`
- Error alerts: `role="alert"` for screen reader announcement

### Focus Management

- Focus trap within modal when open
- Return focus to trigger element on close
- Visible focus indicators on all interactive elements
- Logical tab order through form elements

## Responsive Behavior

### Desktop (>1024px)

- Full modal width (800px)
- Horizontal chip layouts
- Side-by-side date pickers

### Tablet (768px - 1024px)

- Modal width: 90vw
- Maintain horizontal layouts where possible
- Stack date pickers vertically if needed

### Mobile (<768px)

- Modal width: 95vw
- Stack all chip groups vertically
- Full-width buttons
- Larger touch targets (min 44px)

## Interaction States

### Buttons

- **Default**: Solid color with border radius
- **Hover**: Slight darkening (10%)
- **Active**: Pressed state with scale (0.98)
- **Disabled**: 60% opacity, no pointer events
- **Loading**: Spinner icon, disabled state

### Chips

- **Default**: White background, gray border
- **Hover**: Light gray background
- **Selected**: Primary color border, light primary background
- **Focus**: Visible outline in primary color

### File Upload Area

- **Default**: Dashed border, gray background
- **Hover**: Primary color border
- **Drag Over**: Primary color background at 10% opacity
- **File Selected**: Solid border, show filename

## Animation & Transitions

- **Tab Switch**: Fade content (150ms ease)
- **Chip Toggle**: Background color transition (150ms ease)
- **Progress Bar**: Width transition (300ms ease)
- **Modal Open/Close**: Fade + scale (200ms ease)
- **Error Display**: Slide down (200ms ease)

## Implementation Notes

### Component Files Created

1. `ImportExportModal.tsx` - Main modal container with tab navigation
2. `ExportPanel.tsx` - Export configuration interface
3. `ImportWizard.tsx` - Multi-step import workflow
4. `index.ts` - Public exports

### Design System Integration

All components use:

- Design system tokens for colors, spacing, typography
- Existing `Modal`, `Button`, `Stack`, `Text` components
- Consistent styling patterns from the codebase

### Future Enhancements

1. **Field Mapping Interface**: Visual drag-and-drop field mapper
2. **Conflict Resolution Panel**: Detailed conflict review with side-by-side comparison
3. **Advanced Filters**: Date range presets, custom field filters
4. **Export Templates**: Save and reuse export configurations
5. **Import History**: Track previous imports with rollback capability
6. **Batch Operations**: Queue multiple imports/exports

## Success Criteria

✅ Design follows existing Omni patterns
✅ All acceptance criteria from OMN-476 addressed
✅ Accessible keyboard navigation
✅ Responsive across device sizes
✅ Clear visual feedback for all states
✅ Error handling with helpful messages
✅ Progress indication during operations
✅ Intuitive multi-step workflow

## References

- Parent Issue: [OMN-391](/OMN/issues/OMN-391)
- Architecture Spec: [OMN-450](/OMN/issues/OMN-450)
- Technical Spec: [OMN-454](/OMN/issues/OMN-454)
- Design System: `/client/src/design-system/`

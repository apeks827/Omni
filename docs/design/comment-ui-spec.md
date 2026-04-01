# Comment UI/UX Design Specification

## Overview

This document defines the user interface and interaction patterns for the task commenting system.

## Design Principles

- **Clarity**: Comments should be easy to read and distinguish from each other
- **Efficiency**: Common actions (reply, edit, delete) should be one click away
- **Feedback**: All interactions provide immediate visual feedback
- **Accessibility**: Keyboard navigation, screen reader support, proper contrast ratios
- **Mobile-first**: Touch-friendly targets, responsive layouts

## Component Architecture

### 1. CommentComposer

**Purpose**: Input component for creating and editing comments

**Features**:

- Markdown editor with live preview toggle
- @mention autocomplete with user search
- File attachment with drag-and-drop support
- Character counter (optional)
- Auto-save draft to localStorage
- Keyboard shortcuts (Cmd/Ctrl+Enter to submit)

**States**:

- Default (collapsed)
- Focused (expanded with toolbar)
- Loading (submitting)
- Error (validation/network)

**Visual Design**:

- Border: 1px solid `colors.border.subtle`, focus: `colors.primary`
- Min height: 80px, expands with content
- Toolbar appears on focus with markdown formatting buttons
- Attachment preview chips below textarea
- Submit button disabled when empty

### 2. CommentList

**Purpose**: Display threaded comment discussions

**Features**:

- Nested threading (max 3 levels deep)
- Inline edit mode
- Soft delete with "[Comment deleted]" placeholder
- Relative timestamps with hover tooltip for absolute time
- Collapse/expand thread controls
- Load more pagination for long threads

**Visual Design**:

- Thread indentation: 32px per level (using left margin)
- Comment card: white background, subtle border, 8px border-radius
- Avatar: 32px circle with initials or image
- Actions: Edit/Delete/Reply buttons appear on hover
- Deleted comments: gray background, italic text

### 3. MentionAutocomplete

**Purpose**: Autocomplete dropdown for @mentions

**Features**:

- Triggered by "@" character
- Fuzzy search by name or username
- Keyboard navigation (arrow keys, Enter to select, Esc to close)
- Shows avatar, name, and role/title
- Highlights matching text

**Visual Design**:

- Dropdown positioned below cursor or above if space limited
- Max height: 240px with scroll
- Item height: 48px with padding
- Hover/selected state: light blue background
- Box shadow: `shadows.md`

### 4. CommentThread

**Purpose**: Container for comment + replies

**Features**:

- Collapse/expand control for threads with >3 replies
- "Show N more replies" button
- Visual connection line for nested comments
- Reply composer appears inline when "Reply" clicked

**Visual Design**:

- Connection line: 2px solid `colors.gray300` on left side
- Collapsed state shows first + last reply with count
- Smooth expand/collapse animation (200ms ease)

### 5. NotificationBadge

**Purpose**: Indicate unread comment notifications

**Features**:

- Real-time count updates via WebSocket
- Animated pulse on new notification
- Click to open notification panel
- Mark all as read action

**Visual Design**:

- Badge: 18px circle, `colors.danger` background
- Position: top-right of bell icon
- Count: white text, max "99+"
- Pulse animation: scale 1.0 → 1.2 → 1.0 over 600ms

## Interaction Patterns

### Creating a Comment

1. User clicks in composer textarea
2. Composer expands, showing toolbar
3. User types content (markdown supported)
4. User optionally adds @mentions (autocomplete appears)
5. User optionally attaches files (drag-drop or click)
6. User clicks "Comment" or presses Cmd/Ctrl+Enter
7. Loading state shows spinner on button
8. On success: comment appears at bottom, composer clears
9. On error: error message appears below composer

### Editing a Comment

1. User clicks "Edit" button (own comments only)
2. Comment content replaced with CommentComposer pre-filled
3. User edits content
4. User clicks "Save" or "Cancel"
5. On save: comment updates with "(edited)" indicator
6. On cancel: reverts to original content

### Replying to a Comment

1. User clicks "Reply" button
2. CommentComposer appears indented below comment
3. User creates reply (same flow as creating comment)
4. Reply appears nested under parent comment

### Deleting a Comment

1. User clicks "Delete" button (own comments only)
2. Confirmation modal appears: "Delete this comment?"
3. User confirms or cancels
4. On confirm: soft delete, shows "[Comment deleted]"
5. Replies remain visible under deleted parent

### @Mentioning Users

1. User types "@" in composer
2. Autocomplete dropdown appears
3. User types to filter or uses arrow keys
4. User presses Enter or clicks to select
5. Mention inserted as "@Username" with highlight
6. Mentioned user receives notification

## Responsive Design

### Desktop (>1024px)

- Full-width composer with toolbar
- 3-level threading visible
- Hover states for all interactive elements
- Side-by-side edit mode

### Tablet (768px - 1024px)

- Slightly narrower composer
- 2-level threading, deeper levels collapsed
- Larger touch targets (44px min)

### Mobile (<768px)

- Full-width composer, stacked toolbar
- 1-level threading, all deeper collapsed
- Swipe actions for edit/delete
- Bottom sheet for mention autocomplete
- Floating action button for new comment

## Accessibility

### Keyboard Navigation

- Tab: Navigate between comments and actions
- Enter: Activate buttons, submit composer
- Escape: Close autocomplete, cancel edit mode
- Arrow keys: Navigate autocomplete, collapsed threads

### Screen Reader Support

- Semantic HTML: `<article>` for comments, `<nav>` for actions
- ARIA labels: "Reply to [username]", "Edit comment", "Delete comment"
- Live regions: Announce new comments, errors
- Focus management: Return focus after modal close

### Visual Accessibility

- Color contrast: 4.5:1 minimum for text
- Focus indicators: 2px solid outline on all interactive elements
- No color-only indicators: Use icons + text
- Reduced motion: Respect `prefers-reduced-motion`

## Performance Considerations

- Virtual scrolling for threads >100 comments
- Lazy load images and attachments
- Debounce @mention search (300ms)
- Optimistic UI updates for instant feedback
- Pagination: Load 20 comments initially, 10 more on scroll

## Error States

### Network Error

- Message: "Failed to post comment. Check your connection."
- Action: "Retry" button, draft saved locally

### Validation Error

- Message: "Comment cannot be empty"
- Visual: Red border on composer

### Permission Error

- Message: "You don't have permission to comment"
- Action: Disable composer, show info message

## Success Metrics

- Comment creation time: <200ms perceived (optimistic UI)
- @mention autocomplete response: <100ms
- Thread expand/collapse: <200ms animation
- Mobile touch target size: ≥44px
- Keyboard navigation: All actions accessible
- Accessibility score: WCAG 2.1 AA compliant

# Team Collaboration UI/UX Design Spec

## Overview

Design system for team collaboration features including team management, member invites, task assignment, activity feed, notifications, and team statistics. Built on existing Omni design tokens.

---

## Design Tokens (from existing system)

| Token             | Value          |
| ----------------- | -------------- |
| Primary           | `#007bff`      |
| Spacing           | 4/8/16/24/32px |
| Border Radius     | 2/4/8/9999px   |
| Mobile Breakpoint | 768px          |

---

## 1. Team Creation Modal

### Desktop Layout

```
┌─────────────────────────────────────────────────────────┐
│  Create Team                                        [×] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Team Name                                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Enter team name...                               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Description (optional)                                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │ What is this team about?                         │   │
│  │                                                  │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ Settings ──────────────────────────────────────┐   │
│  │                                                     │   │
│  │  Default Role                                      │   │
│  │  [Member ▼]                                        │   │
│  │                                                     │   │
│  │  □ Allow guest access                              │   │
│  │  □ Require approval for new members                │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│                              [Cancel]  [Create Team]     │
└─────────────────────────────────────────────────────────┘
```

### Component: TeamCreateModal

```tsx
interface TeamCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (team: TeamInput) => void
  defaultWorkspaceId: string
}

// States
// - Default: Form ready for input
// - Loading: Creating team (spinner on button)
// - Error: Validation message below fields
// - Success: Modal closes, redirects to team dashboard
```

---

## 2. Member Invite Flow

### Step 1: Invite Modal

```
┌─────────────────────────────────────────────────────────┐
│  Invite Members                                    [×] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Email addresses                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │ alice@example.com                                │   │
│  │ bob@example.com, carol@example.com               │   │
│  └─────────────────────────────────────────────────┘   │
│  Separate multiple emails with commas or new lines      │
│                                                         │
│  Role                                                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Member ▼                                         │   │
│  │ ○ Owner  ○ Admin  ● Member  ○ Guest             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Personal message (optional)                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Join our team to collaborate on projects!        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│                              [Cancel]  [Send Invites]    │
└─────────────────────────────────────────────────────────┘
```

### Step 2: Pending Invitations View

```
┌─────────────────────────────────────────────────────────┐
│  Team Members                                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─ Pending Invitations (2) ─────────────────────────┐  │
│  │                                                      │  │
│  │  alice@example.com         Member      [Resend][×] │  │
│  │  Sent 2 hours ago                                  │  │
│  │                                                      │  │
│  │  david@example.com         Admin       [Resend][×] │  │
│  │  Sent 1 day ago              Expires in 6 days     │  │
│  │                                                      │  │
│  └────────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─ Team Members (5) ─────────────────────────────────┐  │
│  │                                                      │  │
│  │  👤 Sarah Chen (you)        Owner         [···]    │  │
│  │  👤 John Smith              Admin        [···]    │  │
│  │  👤 Emma Wilson             Member       [···]    │  │
│  │  👤 Michael Brown           Member       [···]    │  │
│  │  👤 Lisa Anderson           Guest        [···]    │  │
│  │                                                      │  │
│  │  [+ Invite Members]                                  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Step 3: Role Management Dropdown

```
┌─────────────────────────────────────┐
│  Change Role                        │
├─────────────────────────────────────┤
│  ○ Owner                            │
│  ○ Admin                            │
│  ● Member                           │
│  ○ Guest                            │
├─────────────────────────────────────┤
│  [Remove from Team]                  │
└─────────────────────────────────────┘
```

---

## 3. Task Assignment UI

### Task Assignment Dropdown

```
┌─────────────────────────────────────────────────────────┐
│  Assignee                                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🔍 Search members...                                    │
│                                                         │
│  ── All Members ────────────────────────────────────    │
│                                                         │
│  ○ Unassigned                                            │
│                                                         │
│  ○ 👤 John Smith                                         │
│    Admin • 3 tasks                                       │
│                                                         │
│  ● 👤 Emma Wilson                                        │
│    Member • 5 tasks                                      │
│                                                         │
│  ○ 👤 Michael Brown                                      │
│    Member • 2 tasks                                      │
│                                                         │
│  ○ 👤 Lisa Anderson                                     │
│    Guest • View only                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Assignment Status States

```
┌─────────────────────────────────────────────────────────┐
│  Task: Design new dashboard                              │
│  Assigned to: Emma Wilson                                │
│  Status: ⏳ Pending                                      │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Emma has not responded to this assignment yet.   │   │
│  │                                                  │   │
│  │  [Accept]  [Decline]  [Delegate ▼]              │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────┐
│  Task: Design new dashboard                              │
│  Assigned to: Emma Wilson                                │
│  Status: ✅ Accepted                                     │
│                                                         │
│  Assigned Mar 30, 2026 by Sarah Chen                     │
│                                                         │
│  [Delegate ▼]  [Unassign]                               │
└─────────────────────────────────────────────────────────┘
```

### Delegation Modal

```
┌─────────────────────────────────────────────────────────┐
│  Delegate Task                                      [×] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Reassigning "Design new dashboard" to:                  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🔍 Search members...                             │   │
│  │                                                  │   │
│  │  ○ 👤 John Smith - Admin                         │   │
│  │  ○ 👤 Michael Brown - Member                      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Note (optional)                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Emma is overloaded this week, taking over...     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│                              [Cancel]  [Delegate]       │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Activity Feed UI

### Team Activity Feed

```
┌─────────────────────────────────────────────────────────┐
│  Team Activity                                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [All ▼] [Members ▼] [Date Range ▼]  [🔄 Refresh]      │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 👤 John Smith created task                       │   │
│  │ "Implement user authentication"                │   │
│  │ 2 minutes ago                                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 👤 Emma Wilson completed task                   │   │
│  │ "Write API documentation"                      │   │
│  │ 15 minutes ago                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 👤 Michael Brown was assigned task              │   │
│  │ "Review pull request #42"                       │   │
│  │ 1 hour ago                                      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 👤 Lisa Anderson commented on                   │   │
│  │ "UI mockups for landing page"                   │   │
│  │ "Looks great! Minor suggestions in Figma"      │   │
│  │ 3 hours ago                                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│  Showing 1-20 of 156  [< Prev] [Next >]                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Activity Item Component

```tsx
interface ActivityItemProps {
  activity: TeamActivity
  onClickResource: (resource: Resource) => void
  actorAvatar: string
  actorName: string
}

// Visual States
// - Task created: + icon, blue
// - Task completed: ✓ icon, green
// - Task assigned: → icon, purple
// - Task delegated: ↻ icon, orange
// - Comment added: 💬 icon, gray
// - Member joined: 👤+ icon, green
// - Member left: 👤- icon, gray
// - Role changed: 👤⚙ icon, yellow
```

---

## 5. Notification Panel

### Notification Dropdown

```
┌─────────────────────────────────────────────────────────┐
│  Notifications                                    [⚙]  │
├─────────────────────────────────────────────────────────┤
│  [Mark all as read]                                     │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  ● 👤 John Smith assigned you a task                   │
│    "Review API changes" • 5 min ago                     │
│                                                         │
│  ● 💬 You were mentioned in a comment                   │
│    On "Design new dashboard" • 15 min ago               │
│                                                         │
│  ● ↻ Michael Brown delegated a task to you              │
│    "Fix login bug" • 1 hour ago                        │
│                                                         │
│  ● 👤 Sarah Chen invited you to Team Alpha             │
│    [Accept] [Decline] • 2 hours ago                    │
│                                                         │
│  ○ ✓ Task "API docs" completed by Emma Wilson          │
│    3 hours ago                                         │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│  [View all notifications]                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Notification Badge Component

```tsx
interface NotificationBadgeProps {
  count: number
  maxCount?: number // default 99
}

// Visual States
// - 0: Hidden
// - 1-99: Shows count
// - 100+: Shows "99+"
// - Pulsing: New notification arrived
```

---

## 6. Team Statistics Dashboard

### Statistics Overview

```
┌─────────────────────────────────────────────────────────┐
│  Team Statistics                              [Export ▼] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Period: [Last 7 days ▼]  [Last 30 days ▼]  [Custom]  │
│                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │    156       │ │     89       │ │     67       │    │
│  │ Total Tasks  │ │   Completed  │ │   Active     │    │
│  │     ↑ 12%    │ │    ↑ 23%     │ │     ↓ 5%     │    │
│  └──────────────┘ └──────────────┘ └──────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Tasks Completion Rate                │   │
│  │  80% ────────────────────────────────────      │   │
│  │  60% ────────────────────────────────────────── │   │
│  │  40% ────────────────────────────────────────── │   │
│  │  20% ────────────────────────────────────────── │   │
│  │   0% ────────────────────────────────────────── │   │
│  │        Mon  Tue  Wed  Thu  Fri  Sat  Sun        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ Tasks per Member ──────────────────────────────┐   │
│  │                                                      │  │
│  │  John Smith        ████████████████░░░░  15       │  │
│  │  Emma Wilson       ████████████░░░░░░░  12       │  │
│  │  Michael Brown     ██████████░░░░░░░░░   9        │  │
│  │  Sarah Chen        ████████░░░░░░░░░░░   8        │  │
│  │  Lisa Anderson     ████░░░░░░░░░░░░░░░   4        │  │
│  │                                                      │  │
│  └────────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─ Most Active Members ────────────────────────────┐   │
│  │                                                      │  │
│  │  🥇 John Smith - 45 actions                        │  │
│  │  🥈 Emma Wilson - 38 actions                       │  │
│  │  🥉 Michael Brown - 29 actions                     │  │
│  │                                                      │  │
│  └────────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Mention Autocomplete

### Comment Composer with @mention

```
┌─────────────────────────────────────────────────────────┐
│  Add Comment                                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ @Jo [↹ autocomplete below]                      │   │
│  │                                                  │   │
│  │                                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ Suggestions ───────────────────────────────────┐   │
│  │  👤 John Smith                                   │   │
│  │  👤 John Davis                                   │   │
│  │  👤 Johnny Appleseed                             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Cancel]                               [Post Comment]   │
└─────────────────────────────────────────────────────────┘
```

### Mention Autocomplete Component

```tsx
interface MentionAutocompleteProps {
  query: string
  members: TeamMember[]
  onSelect: (member: TeamMember) => void
  position: { top: number; left: number }
}

// Keyboard Navigation
// - Arrow Up/Down: Navigate suggestions
// - Enter/Tab: Select highlighted member
// - Escape: Close autocomplete
// - @ trigger: Open autocomplete
```

---

## 8. Component Inventory

| Component           | File Path                                          | States                                  |
| ------------------- | -------------------------------------------------- | --------------------------------------- |
| TeamCreateModal     | `components/collaboration/TeamCreateModal.tsx`     | default, loading, error, success        |
| MemberInviteModal   | `components/collaboration/MemberInviteModal.tsx`   | default, loading, sent, error           |
| MemberList          | `components/collaboration/MemberList.tsx`          | loading, empty, populated, filtered     |
| MemberRow           | `components/collaboration/MemberRow.tsx`           | default, hover, editing role            |
| RoleDropdown        | `components/collaboration/RoleDropdown.tsx`        | closed, open, selected                  |
| AssigneeDropdown    | `components/collaboration/AssigneeDropdown.tsx`    | closed, open, searching, selected       |
| AssignmentStatus    | `components/collaboration/AssignmentStatus.tsx`    | pending, accepted, declined             |
| DelegateModal       | `components/collaboration/DelegateModal.tsx`       | default, loading, success               |
| ActivityFeed        | `components/collaboration/ActivityFeed.tsx`        | loading, empty, populated, filtered     |
| ActivityItem        | `components/collaboration/ActivityItem.tsx`        | task, comment, member, role variants    |
| NotificationPanel   | `components/collaboration/NotificationPanel.tsx`   | loading, empty, populated, all-read     |
| NotificationItem    | `components/collaboration/NotificationItem.tsx`    | unread, read, hover                     |
| NotificationBadge   | `components/collaboration/NotificationBadge.tsx`   | hidden, count, pulsing                  |
| TeamStatistics      | `components/collaboration/TeamStatistics.tsx`      | loading, populated, date-range-selected |
| StatCard            | `components/collaboration/StatCard.tsx`            | default, loading, trend-up, trend-down  |
| MentionAutocomplete | `components/collaboration/MentionAutocomplete.tsx` | closed, open, loading, selected         |
| TeamDashboard       | `pages/TeamDashboard.tsx`                          | loading, populated, error               |

---

## 9. Interaction Flows

### Flow 1: Create and Set Up Team

1. User clicks "+ Create Team" from workspace menu
2. TeamCreateModal appears with empty form
3. User enters team name (required), description (optional)
4. User configures default role and settings
5. User clicks "Create Team"
6. Loading state on button
7. On success: Modal closes, user redirected to team dashboard
8. User sees empty team with "Invite Members" prompt

### Flow 2: Invite and Manage Members

1. Team admin clicks "Invite Members"
2. MemberInviteModal appears
3. User enters email addresses (comma-separated)
4. User selects role from dropdown
5. User adds optional personal message
6. User clicks "Send Invites"
7. Loading state, then success message
8. Modal shows pending invitations list
9. Admin can resend or cancel pending invites
10. When invitee accepts, they appear in team members list

### Flow 3: Assign Task to Team Member

1. User creates or edits task
2. User clicks "Assign to" field
3. AssigneeDropdown opens with member list
4. User can search or scroll to find member
5. User clicks member
6. Dropdown closes, assignee shown on task
7. Assignee receives real-time notification
8. Task shows "Pending" status
9. Assignee can Accept/Decline
10. On accept: Status changes to "Accepted"
11. On decline: Task returns to unassigned

### Flow 4: Delegate Task

1. Assignee opens assigned task
2. Clicks "Delegate" dropdown
3. DelegateModal opens
4. Selects new assignee from list
5. Optionally adds delegation note
6. Clicks "Delegate"
7. Original assigner receives notification
8. New assignee receives assignment notification
9. Delegation logged in activity feed

### Flow 5: @mention in Comment

1. User opens comment composer
2. Types "@" character
3. MentionAutocomplete appears with all members
4. User continues typing to filter
5. Keyboard navigation or click to select
6. Mention inserted as styled chip
7. On submit: Mentioned user receives notification

### Flow 6: Review Team Activity

1. User navigates to team dashboard
2. Activity feed loads with recent 20 items
3. User can filter by action type, member, date range
4. User clicks activity item
5. Navigates to relevant resource (task, project, member)
6. Pagination for older activities

### Flow 7: View Team Statistics

1. User navigates to team statistics
2. Default view: Last 7 days
3. User can change date range
4. Charts and metrics update
5. User can export as CSV/PDF
6. Individual member stats expandable

---

## 10. Accessibility

- All interactive elements: `tabindex`, keyboard navigable
- Dropdowns: Full keyboard support (arrows, enter, escape)
- Modals: Focus trap, escape to close
- Notifications: `aria-live="polite"` for screen readers
- Activity feed: Proper list semantics
- Role badges: Color + icon + text (not color alone)
- Form inputs: Labels, error messages linked via `aria-describedby`
- Focus visible: 2px primary outline
- Color contrast: 4.5:1 minimum (WCAG AA)
- Touch targets: 44px minimum on mobile

---

## 11. Responsive Breakpoints

| Breakpoint | Layout                                             |
| ---------- | -------------------------------------------------- |
| < 480px    | Full-screen modals, stacked layouts, bottom sheets |
| 480-768px  | Slightly padded, cards stack vertically            |
| > 768px    | Side-by-side layouts, dropdown menus, full modals  |

---

## 12. Real-time Updates

### WebSocket Events UI Response

| Event               | UI Update                                |
| ------------------- | ---------------------------------------- |
| task:created        | Activity feed, task list, notification   |
| task:updated        | Activity feed, task detail, notification |
| task:assigned       | Notification, assignee dropdown update   |
| comment:added       | Activity feed, task comments             |
| member:joined       | Member list, activity feed               |
| member:left         | Member list, activity feed               |
| member:role_changed | Member list badges, permission updates   |

### Connection Status Indicator

```
┌─────────────────────────────────────────────────────────┐
│  🔴 Reconnecting...                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 13. Error States

### Network Error

```
┌─────────────────────────────────────────────────────────┐
│  ⚠️ Connection lost                                      │
│                                                         │
│  Changes will sync when you're back online.            │
│  [Retry Now]                                            │
└─────────────────────────────────────────────────────────┘
```

### Permission Denied

```
┌─────────────────────────────────────────────────────────┐
│  🔒 You don't have permission to do this               │
│                                                         │
│  Contact your team admin to request access.            │
│  [View Team Members]                                    │
└─────────────────────────────────────────────────────────┘
```

### Conflict Resolution

```
┌─────────────────────────────────────────────────────────┐
│  ⚠️ This task was modified                             │
│                                                         │
│  Another team member made changes while you were       │
│  editing.                                               │
│                                                         │
│  Your changes: "Design the dashboard layout"            │
│  Their changes: "Update dashboard wireframes"           │
│                                                         │
│  [Keep Mine]  [Use Theirs]  [Merge Both]               │
└─────────────────────────────────────────────────────────┘
```

---

## 14. Implementation Priority

1. **P0:** Team creation modal, Member list, Assignee dropdown, Basic notifications
2. **P1:** Member invite flow, Activity feed, Assignment status, Notification panel
3. **P2:** Team statistics, @mention autocomplete, Real-time updates
4. **P3:** Export functionality, Advanced filtering, Bulk actions

---

**Status:** Ready for Implementation
**Designer:** UI/UX Designer
**Reviewers:** @Founding Engineer, @Frontend Engineer

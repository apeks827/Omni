import React from 'react'
import { Activity } from '../types'
import ActivityItem from './ActivityItem'
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from '../design-system/tokens'

interface ActivityTimelineProps {
  activities: Activity[]
  onTaskClick?: (taskId: string) => void
}

interface TimelineGroup {
  date: string
  label: string
  activities: Activity[]
}

const groupActivitiesByDate = (activities: Activity[]): TimelineGroup[] => {
  const now = new Date()
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime()
  const yesterday = today - 86400000
  const weekAgo = today - 7 * 86400000

  const groups: Record<string, Activity[]> = {}

  activities.forEach(activity => {
    const activityDate = new Date(activity.created_at)
    const activityDay = new Date(
      activityDate.getFullYear(),
      activityDate.getMonth(),
      activityDate.getDate()
    ).getTime()

    let dateKey: string
    if (activityDay >= today) {
      dateKey = 'today'
    } else if (activityDay >= yesterday) {
      dateKey = 'yesterday'
    } else if (activityDay >= weekAgo) {
      dateKey = 'this_week'
    } else {
      dateKey = 'older'
    }

    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(activity)
  })

  const timelineOrder = ['today', 'yesterday', 'this_week', 'older']
  const labelMap: Record<string, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    this_week: 'This Week',
    older: 'Older',
  }

  return timelineOrder
    .filter(key => groups[key]?.length > 0)
    .map(key => ({
      date: key,
      label: labelMap[key],
      activities: groups[key],
    }))
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  onTaskClick,
}) => {
  const groups = groupActivitiesByDate(activities)

  if (activities.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: spacing.xxl,
          color: colors.gray500,
          backgroundColor: colors.gray100,
          borderRadius: borderRadius.lg,
          border: `2px dashed ${colors.border.subtle}`,
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: spacing.md }}>📋</div>
        <div
          style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.medium,
          }}
        >
          No activity yet
        </div>
        <div
          style={{ fontSize: typography.fontSize.sm, marginTop: spacing.xs }}
        >
          Activity will appear here as tasks are updated
        </div>
      </div>
    )
  }

  const groupHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  }

  const groupLabelStyle: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  }

  const dividerStyle: React.CSSProperties = {
    flex: 1,
    height: '1px',
    backgroundColor: colors.border.subtle,
  }

  const activityListStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
  }

  return (
    <div>
      {groups.map(group => (
        <div key={group.date}>
          <div style={groupHeaderStyle}>
            <span style={groupLabelStyle}>{group.label}</span>
            <div style={dividerStyle} />
          </div>
          <div style={activityListStyle}>
            {group.activities.map(activity => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                onTaskClick={onTaskClick}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ActivityTimeline

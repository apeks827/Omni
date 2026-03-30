import React, { useState, useEffect, useCallback } from 'react'
import { Activity, ActivityActionType, ActivityFeedResponse } from '../types'
import ActivityTimeline from './ActivityTimeline'
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from '../design-system/tokens'

interface ActivityFeedProps {
  workspaceId: string
  taskId?: string
  userId?: string
  limit?: number
  onTaskClick?: (taskId: string) => void
}

type FilterType = 'all' | ActivityActionType

const ACTIVITY_TYPES: { value: ActivityActionType; label: string }[] = [
  { value: 'task_created', label: 'Created' },
  { value: 'task_updated', label: 'Updated' },
  { value: 'task_completed', label: 'Completed' },
  { value: 'task_assigned', label: 'Assigned' },
  { value: 'task_commented', label: 'Commented' },
  { value: 'status_changed', label: 'Status Changed' },
  { value: 'priority_changed', label: 'Priority Changed' },
]

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  workspaceId,
  taskId,
  userId,
  limit = 50,
  onTaskClick,
}) => {
  const [activities, setActivities] = useState<Activity[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [showFilters, setShowFilters] = useState(false)

  const fetchActivities = useCallback(
    async (currentOffset: number = 0, typeFilter: FilterType = 'all') => {
      setLoading(true)
      setError(null)

      try {
        let endpoint = ''
        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: currentOffset.toString(),
        })

        if (taskId) {
          endpoint = `/tasks/${taskId}/activities`
        } else if (userId) {
          endpoint = `/users/${userId}/activities`
        } else {
          endpoint = `/workspaces/${workspaceId}/activities`
        }

        if (typeFilter !== 'all') {
          params.set('action_type', typeFilter)
        }

        const response = await fetch(`/api${endpoint}?${params}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch activities')
        }

        const data: ActivityFeedResponse = await response.json()

        if (currentOffset === 0) {
          setActivities(data.activities)
        } else {
          setActivities(prev => [...prev, ...data.activities])
        }

        setTotal(data.total)
        setHasMore(data.activities.length === limit)
        setOffset(currentOffset)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load activities'
        )
      } finally {
        setLoading(false)
      }
    },
    [workspaceId, taskId, userId, limit]
  )

  useEffect(() => {
    fetchActivities(0, filterType)
  }, [workspaceId, taskId, userId, filterType])

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchActivities(offset + limit, filterType)
    }
  }

  const handleFilterChange = (type: FilterType) => {
    setFilterType(type)
    setShowFilters(false)
  }

  const clearFilters = () => {
    setFilterType('all')
  }

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    flexWrap: 'wrap',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray900,
    margin: 0,
  }

  const filterButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor:
      filterType !== 'all' ? colors.primary + '15' : colors.gray100,
    color: filterType !== 'all' ? colors.primary : colors.gray700,
    border: `1px solid ${filterType !== 'all' ? colors.primary : colors.border.subtle}`,
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    transition: 'all 0.2s ease',
  }

  const filterDropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: spacing.xs,
    backgroundColor: colors.white,
    border: `1px solid ${colors.border.subtle}`,
    borderRadius: borderRadius.lg,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    minWidth: '180px',
    zIndex: 100,
    overflow: 'hidden',
  }

  const filterOptionStyle: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.md}`,
    cursor: 'pointer',
    fontSize: typography.fontSize.sm,
    color: colors.gray700,
    transition: 'background-color 0.15s ease',
  }

  const filterCountStyle: React.CSSProperties = {
    fontSize: typography.fontSize.xs,
    color: colors.gray500,
  }

  const clearButtonStyle: React.CSSProperties = {
    padding: `${spacing.xs} ${spacing.sm}`,
    backgroundColor: 'transparent',
    color: colors.gray600,
    border: 'none',
    cursor: 'pointer',
    fontSize: typography.fontSize.xs,
    textDecoration: 'underline',
  }

  if (error) {
    return (
      <div
        style={{
          padding: spacing.lg,
          backgroundColor: colors.danger + '10',
          borderRadius: borderRadius.lg,
          border: `1px solid ${colors.danger}`,
          color: colors.danger,
        }}
      >
        <strong>Error:</strong> {error}
        <button
          onClick={() => fetchActivities(0, filterType)}
          style={{
            marginLeft: spacing.md,
            padding: `${spacing.xs} ${spacing.sm}`,
            backgroundColor: colors.danger,
            color: colors.white,
            border: 'none',
            borderRadius: borderRadius.md,
            cursor: 'pointer',
            fontSize: typography.fontSize.sm,
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
          <h2 style={titleStyle}>Activity Feed</h2>
          <span style={filterCountStyle}>
            {total} {total === 1 ? 'event' : 'events'}
          </span>
        </div>

        <div style={{ position: 'relative' }}>
          <button
            style={filterButtonStyle}
            onClick={() => setShowFilters(!showFilters)}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor =
                filterType !== 'all' ? colors.primary + '25' : colors.gray200
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor =
                filterType !== 'all' ? colors.primary + '15' : colors.gray100
            }}
          >
            <span>🔍</span>
            <span>Filter</span>
            {filterType !== 'all' && (
              <span
                style={{
                  backgroundColor: colors.primary,
                  color: colors.white,
                  padding: '2px 6px',
                  borderRadius: borderRadius.full,
                  fontSize: '10px',
                }}
              >
                1
              </span>
            )}
          </button>

          {showFilters && (
            <>
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 99,
                }}
                onClick={() => setShowFilters(false)}
              />
              <div style={filterDropdownStyle}>
                {ACTIVITY_TYPES.map(type => (
                  <div
                    key={type.value}
                    style={{
                      ...filterOptionStyle,
                      backgroundColor:
                        filterType === type.value
                          ? colors.primary + '10'
                          : 'transparent',
                      fontWeight:
                        filterType === type.value
                          ? typography.fontWeight.medium
                          : typography.fontWeight.normal,
                    }}
                    onClick={() => handleFilterChange(type.value)}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = colors.gray100
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor =
                        filterType === type.value
                          ? colors.primary + '10'
                          : 'transparent'
                    }}
                  >
                    {type.label}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {filterType !== 'all' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <span
            style={{ fontSize: typography.fontSize.sm, color: colors.gray600 }}
          >
            Filtered by:{' '}
            <strong>
              {ACTIVITY_TYPES.find(t => t.value === filterType)?.label}
            </strong>
          </span>
          <button style={clearButtonStyle} onClick={clearFilters}>
            Clear
          </button>
        </div>
      )}

      {loading && activities.length === 0 ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.xxl,
            color: colors.gray500,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: spacing.sm }}>⏳</div>
            <div>Loading activities...</div>
          </div>
        </div>
      ) : (
        <>
          <ActivityTimeline activities={activities} onTaskClick={onTaskClick} />

          {hasMore && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                padding: spacing.md,
              }}
            >
              <button
                onClick={handleLoadMore}
                disabled={loading}
                style={{
                  padding: `${spacing.sm} ${spacing.xl}`,
                  backgroundColor: colors.primary,
                  color: colors.white,
                  border: 'none',
                  borderRadius: borderRadius.md,
                  cursor: loading ? 'wait' : 'pointer',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  opacity: loading ? 0.7 : 1,
                  transition: 'opacity 0.2s ease',
                }}
              >
                {loading
                  ? 'Loading...'
                  : `Load More (${total - activities.length} remaining)`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ActivityFeed

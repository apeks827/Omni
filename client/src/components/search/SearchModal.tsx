import React, { useEffect, useState, useCallback } from 'react'
import { useSearchStore } from '../../stores/searchStore'
import { Task } from '../../types'
import { colors, spacing, shadows, borderRadius } from '../../design-system'
import FilterPanel from './FilterPanel'
import ActiveFilters from './ActiveFilters'
import SearchResults from './SearchResults'

interface SearchModalProps {
  onSelectTask: (task: Task) => void
  statusOptions?: Array<{ label: string; value: string }>
  priorityOptions?: Array<{ label: string; value: string }>
  projectOptions?: Array<{ label: string; value: string }>
  labelOptions?: Array<{ label: string; value: string }>
}

const defaultStatusOptions = [
  { label: 'To Do', value: 'todo' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Done', value: 'done' },
  { label: 'Cancelled', value: 'cancelled' },
]

const defaultPriorityOptions = [
  { label: 'Critical', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
]

const SearchModal: React.FC<SearchModalProps> = ({
  onSelectTask,
  statusOptions = defaultStatusOptions,
  priorityOptions = defaultPriorityOptions,
  projectOptions = [],
  labelOptions = [],
}) => {
  const {
    isOpen,
    query,
    filters,
    results,
    isLoading,
    error,
    closeSearch,
    setResults,
    setLoading,
    setError,
  } = useSearchStore()

  const [showFilters, setShowFilters] = useState(false)

  const performSearch = useCallback(async () => {
    if (!query.trim() && Object.keys(filters).length === 0) {
      setResults({ tasks: [], total: 0, suggestions: [], searchId: '' })
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/search/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          query: query.trim(),
          status: filters.status?.[0],
          priority: filters.priority?.[0],
          project_id: filters.projectId,
          label_id: filters.labelIds?.[0],
        }),
      })

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      setResults({
        tasks: data.results,
        total: data.count,
        suggestions: [],
        searchId: Date.now().toString(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    }
  }, [query, filters, setResults, setLoading, setError])

  useEffect(() => {
    if (isOpen && query) {
      performSearch()
    }
  }, [isOpen, query, filters, performSearch])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeSearch()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeSearch])

  if (!isOpen) {
    return null
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
        zIndex: 1000,
      }}
      onClick={e => {
        if (e.target === e.currentTarget) {
          closeSearch()
        }
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '700px',
          maxHeight: '80vh',
          backgroundColor: colors.white,
          borderRadius: borderRadius.xl,
          boxShadow: shadows.lg,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          margin: spacing.md,
        }}
      >
        <div
          style={{
            padding: spacing.md,
            borderBottom: `1px solid ${colors.border.subtle}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={colors.text.secondary}
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={e => useSearchStore.getState().setQuery(e.target.value)}
              placeholder="Search tasks..."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '18px',
                backgroundColor: 'transparent',
              }}
              autoFocus
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: `${spacing.sm} ${spacing.md}`,
                backgroundColor: showFilters
                  ? colors.primary + '15'
                  : 'transparent',
                border: `1px solid ${showFilters ? colors.primary : colors.border.default}`,
                borderRadius: borderRadius.lg,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
                color: showFilters ? colors.primary : colors.text.secondary,
                fontSize: '14px',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
              </svg>
              Filters
            </button>
            <button
              onClick={closeSearch}
              style={{
                padding: `${spacing.xs} ${spacing.sm}`,
                backgroundColor: colors.bg.subtle,
                border: 'none',
                borderRadius: borderRadius.md,
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}
            >
              ESC
            </button>
          </div>

          <ActiveFilters
            statusLabels={Object.fromEntries(
              statusOptions.map(o => [o.value, o.label])
            )}
            priorityLabels={Object.fromEntries(
              priorityOptions.map(o => [o.value, o.label])
            )}
            projectLabels={Object.fromEntries(
              projectOptions.map(o => [o.value, o.label])
            )}
            labelLabels={Object.fromEntries(
              labelOptions.map(o => [o.value, o.label])
            )}
          />
        </div>

        {showFilters && (
          <div
            style={{
              padding: spacing.md,
              borderBottom: `1px solid ${colors.border.subtle}`,
              backgroundColor: colors.bg.subtle,
            }}
          >
            <FilterPanel
              statusOptions={statusOptions}
              priorityOptions={priorityOptions}
              projectOptions={projectOptions}
              labelOptions={labelOptions}
            />
          </div>
        )}

        <div style={{ flex: 1, overflow: 'auto', padding: spacing.md }}>
          <SearchResults
            results={results}
            query={query}
            isLoading={isLoading}
            error={error}
            onSelectTask={onSelectTask}
          />
        </div>

        <div
          style={{
            padding: spacing.sm,
            borderTop: `1px solid ${colors.border.subtle}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: colors.text.secondary,
          }}
        >
          <div style={{ display: 'flex', gap: spacing.md }}>
            <span>
              <kbd
                style={{
                  padding: '2px 4px',
                  backgroundColor: colors.bg.subtle,
                  borderRadius: '2px',
                }}
              >
                Enter
              </kbd>{' '}
              to select
            </span>
            <span>
              <kbd
                style={{
                  padding: '2px 4px',
                  backgroundColor: colors.bg.subtle,
                  borderRadius: '2px',
                }}
              >
                ↑
              </kbd>
              <kbd
                style={{
                  padding: '2px 4px',
                  backgroundColor: colors.bg.subtle,
                  borderRadius: '2px',
                  marginLeft: '2px',
                }}
              >
                ↓
              </kbd>{' '}
              to navigate
            </span>
            <span>
              <kbd
                style={{
                  padding: '2px 4px',
                  backgroundColor: colors.bg.subtle,
                  borderRadius: '2px',
                }}
              >
                Cmd
              </kbd>
              +
              <kbd
                style={{
                  padding: '2px 4px',
                  backgroundColor: colors.bg.subtle,
                  borderRadius: '2px',
                }}
              >
                K
              </kbd>{' '}
              to toggle
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SearchModal

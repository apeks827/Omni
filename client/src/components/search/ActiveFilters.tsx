import React from 'react'
import { useSearchStore } from '../../stores/searchStore'
import { colors, spacing, typography, borderRadius } from '../../design-system'

interface ActiveFiltersProps {
  statusLabels?: Record<string, string>
  priorityLabels?: Record<string, string>
  projectLabels?: Record<string, string>
  labelLabels?: Record<string, string>
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  statusLabels = {},
  priorityLabels = {},
  projectLabels = {},
  labelLabels = {},
}) => {
  const { filters, removeFilter, clearFilters } = useSearchStore()

  const getLabel = (key: string, value: string): string => {
    switch (key) {
      case 'status':
        return statusLabels[value] || value
      case 'priority':
        return priorityLabels[value] || value
      case 'project_id':
        return projectLabels[value] || value
      case 'label_id':
        return labelLabels[value] || value
      default:
        return value
    }
  }

  const filterChips: Array<{ key: string; value: string; label: string }> = []

  Object.entries(filters).forEach(([key, values]) => {
    if (Array.isArray(values)) {
      values.forEach(value => {
        filterChips.push({ key, value, label: getLabel(key, value) })
      })
    }
  })

  if (filterChips.length === 0) {
    return null
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: spacing.sm,
        alignItems: 'center',
        padding: `${spacing.sm} 0`,
      }}
    >
      <span
        style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary,
          fontWeight: typography.fontWeight.medium,
        }}
      >
        Active filters:
      </span>
      {filterChips.map(({ key, value, label }) => (
        <FilterChip
          key={`${key}-${value}`}
          label={label}
          type={key}
          onRemove={() => removeFilter(key as keyof typeof filters, value)}
        />
      ))}
      <button
        onClick={clearFilters}
        style={{
          padding: `${spacing.xs} ${spacing.sm}`,
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary,
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textDecoration: 'underline',
        }}
      >
        Clear all
      </button>
    </div>
  )
}

interface FilterChipProps {
  label: string
  type: string
  onRemove: () => void
}

const FilterChip: React.FC<FilterChipProps> = ({ label, type, onRemove }) => {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing.xs,
        padding: `${spacing.xs} ${spacing.sm}`,
        backgroundColor: colors.primary + '15',
        border: `1px solid ${colors.primary}30`,
        borderRadius: borderRadius.full,
        fontSize: typography.fontSize.sm,
        color: colors.primary,
      }}
    >
      <span
        style={{
          fontWeight: typography.fontWeight.medium,
          textTransform: 'capitalize',
          opacity: 0.7,
          fontSize: '10px',
        }}
      >
        {type.replace('_', ' ')}
      </span>
      <span>{label}</span>
      <button
        onClick={onRemove}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '16px',
          height: '16px',
          padding: 0,
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '50%',
          cursor: 'pointer',
          color: colors.primary,
          transition: 'background-color 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = colors.primary + '30'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </span>
  )
}

export default ActiveFilters

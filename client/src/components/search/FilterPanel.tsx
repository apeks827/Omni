import React from 'react'
import { useSearchStore } from '../../stores/searchStore'
import { colors, spacing, typography, borderRadius } from '../../design-system'

interface FilterOption {
  label: string
  value: string
}

interface FilterPanelProps {
  statusOptions: FilterOption[]
  priorityOptions: FilterOption[]
  projectOptions: FilterOption[]
  labelOptions: FilterOption[]
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  statusOptions,
  priorityOptions,
  projectOptions,
  labelOptions,
}) => {
  const { filters, addFilter, removeFilter, clearFilters } = useSearchStore()

  const handleFilterToggle = (key: string, value: string) => {
    const currentValues = filters[key as keyof typeof filters]
    const arr = currentValues as string[] | undefined
    if (arr && arr.includes(value)) {
      removeFilter(key as keyof typeof filters, value)
    } else {
      addFilter(key as keyof typeof filters, value)
    }
  }

  const isSelected = (key: string, value: string) => {
    const currentValues = filters[key as keyof typeof filters]
    const arr = currentValues as string[] | undefined
    return arr ? arr.includes(value) : false
  }

  const hasActiveFilters = Object.keys(filters).length > 0

  return (
    <div
      style={{
        padding: spacing.md,
        backgroundColor: colors.bg.subtle,
        borderRadius: borderRadius.lg,
        border: `1px solid ${colors.border.default}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.md,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: typography.fontSize.md,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
          }}
        >
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            style={{
              padding: `${spacing.xs} ${spacing.sm}`,
              fontSize: typography.fontSize.sm,
              color: colors.primary,
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Clear all
          </button>
        )}
      </div>

      <FilterSection
        title="Status"
        options={statusOptions}
        filterKey="status"
        isSelected={isSelected}
        onToggle={handleFilterToggle}
      />

      <FilterSection
        title="Priority"
        options={priorityOptions}
        filterKey="priority"
        isSelected={isSelected}
        onToggle={handleFilterToggle}
      />

      <FilterSection
        title="Project"
        options={projectOptions}
        filterKey="project_id"
        isSelected={isSelected}
        onToggle={handleFilterToggle}
      />

      <FilterSection
        title="Labels"
        options={labelOptions}
        filterKey="label_id"
        isSelected={isSelected}
        onToggle={handleFilterToggle}
      />
    </div>
  )
}

interface FilterSectionProps {
  title: string
  options: FilterOption[]
  filterKey: string
  isSelected: (key: string, value: string) => boolean
  onToggle: (key: string, value: string) => void
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  options,
  filterKey,
  isSelected,
  onToggle,
}) => {
  return (
    <div style={{ marginBottom: spacing.md }}>
      <h4
        style={{
          margin: `0 0 ${spacing.sm} 0`,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          color: colors.text.secondary,
        }}
      >
        {title}
      </h4>
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}
      >
        {options.map(option => {
          const selected = isSelected(filterKey, option.value)
          return (
            <label
              key={option.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                cursor: 'pointer',
                padding: spacing.xs,
                borderRadius: borderRadius.md,
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = colors.bg.main
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggle(filterKey, option.value)}
                style={{
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer',
                }}
              />
              <span
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.primary,
                }}
              >
                {option.label}
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}

export default FilterPanel

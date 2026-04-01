import React, { useState } from 'react'
import { Button, Stack, Text } from '../../design-system'
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from '../../design-system/tokens'
import { ImportExportFormat, ExportConfig } from './ImportExportModal'

interface ExportPanelProps {
  projects: Array<{ id: string; name: string }>
  availableTags: string[]
  onExport: (config: ExportConfig) => Promise<void>
}

interface FormatOption {
  value: ImportExportFormat
  label: string
  description: string
  icon: string
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    value: 'json',
    label: 'JSON',
    description: 'Full data preservation, best for backup',
    icon: '{ }',
  },
  {
    value: 'csv',
    label: 'CSV',
    description: 'Spreadsheet compatible',
    icon: '|||',
  },
  {
    value: 'markdown',
    label: 'Markdown',
    description: 'Documentation and Git integration',
    icon: 'M↓',
  },
  {
    value: 'ical',
    label: 'iCal',
    description: 'Calendar integration',
    icon: '📅',
  },
]

const ExportPanel: React.FC<ExportPanelProps> = ({
  projects,
  availableTags,
  onExport,
}) => {
  const [selectedFormat, setSelectedFormat] =
    useState<ImportExportFormat>('json')
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [includeAttachments, setIncludeAttachments] = useState(false)
  const [dateRange, setDateRange] = useState<{
    start: string
    end: string
  } | null>(null)

  const statuses = ['todo', 'in_progress', 'done', 'blocked']

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    )
  }

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleSelectAllProjects = () => {
    if (selectedProjects.length === projects.length) {
      setSelectedProjects([])
    } else {
      setSelectedProjects(projects.map(p => p.id))
    }
  }

  const handleExport = () => {
    onExport({
      format: selectedFormat,
      projectIds: selectedProjects,
      includeAttachments,
      filters: {
        status: selectedStatuses,
        tags: selectedTags,
        dateRange,
      },
    })
  }

  const formatCardStyles = (isSelected: boolean): React.CSSProperties => ({
    padding: spacing.md,
    border: `2px solid ${isSelected ? colors.primary : colors.gray200}`,
    borderRadius: borderRadius.lg,
    cursor: 'pointer',
    backgroundColor: isSelected ? `${colors.primary}08` : colors.white,
    transition: 'all 0.2s ease',
    flex: 1,
    minWidth: '140px',
  })

  const iconStyles: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
    fontFamily: 'monospace',
  }

  const filterSectionStyles: React.CSSProperties = {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.lg,
  }

  const filterRowStyles: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  }

  const chipStyles = (isSelected: boolean): React.CSSProperties => ({
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: borderRadius.full,
    border: `1px solid ${isSelected ? colors.primary : colors.gray300}`,
    backgroundColor: isSelected ? `${colors.primary}15` : colors.white,
    color: isSelected ? colors.primary : colors.gray700,
    cursor: 'pointer',
    fontSize: typography.fontSize.sm,
    transition: 'all 0.15s ease',
  })

  const checkboxStyles: React.CSSProperties = {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: colors.primary,
  }

  const dateInputStyles: React.CSSProperties = {
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.gray300}`,
    fontSize: typography.fontSize.sm,
  }

  return (
    <Stack spacing="lg">
      <div>
        <Text
          variant="body"
          style={{
            fontWeight: typography.fontWeight.semibold,
            marginBottom: spacing.sm,
          }}
        >
          Export Format
        </Text>
        <Stack direction="horizontal" spacing="md">
          {FORMAT_OPTIONS.map(option => (
            <div
              key={option.value}
              style={formatCardStyles(selectedFormat === option.value)}
              onClick={() => setSelectedFormat(option.value)}
            >
              <div style={iconStyles}>{option.icon}</div>
              <Text
                variant="body"
                style={{ fontWeight: typography.fontWeight.semibold }}
              >
                {option.label}
              </Text>
              <Text
                variant="body"
                style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.gray600,
                }}
              >
                {option.description}
              </Text>
            </div>
          ))}
        </Stack>
      </div>

      <div style={filterSectionStyles}>
        <Stack direction="horizontal" spacing="md" align="center">
          <Text
            variant="body"
            style={{ fontWeight: typography.fontWeight.semibold }}
          >
            Projects
          </Text>
          <Button variant="ghost" size="sm" onClick={handleSelectAllProjects}>
            {selectedProjects.length === projects.length
              ? 'Deselect All'
              : 'Select All'}
          </Button>
        </Stack>
        <div style={filterRowStyles}>
          {projects.map(project => (
            <span
              key={project.id}
              style={chipStyles(selectedProjects.includes(project.id))}
              onClick={() => handleProjectToggle(project.id)}
            >
              {project.name}
            </span>
          ))}
          {projects.length === 0 && (
            <Text
              variant="body"
              style={{ color: colors.gray500, fontStyle: 'italic' }}
            >
              No projects available
            </Text>
          )}
        </div>
      </div>

      <div style={filterSectionStyles}>
        <Text
          variant="body"
          style={{
            fontWeight: typography.fontWeight.semibold,
            marginBottom: spacing.xs,
          }}
        >
          Filter by Status
        </Text>
        <div style={filterRowStyles}>
          {statuses.map(status => (
            <span
              key={status}
              style={chipStyles(selectedStatuses.includes(status))}
              onClick={() => handleStatusToggle(status)}
            >
              {status.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>

      {availableTags.length > 0 && (
        <div style={filterSectionStyles}>
          <Text
            variant="body"
            style={{
              fontWeight: typography.fontWeight.semibold,
              marginBottom: spacing.xs,
            }}
          >
            Filter by Tags
          </Text>
          <div style={filterRowStyles}>
            {availableTags.map(tag => (
              <span
                key={tag}
                style={chipStyles(selectedTags.includes(tag))}
                onClick={() => handleTagToggle(tag)}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={filterSectionStyles}>
        <Text
          variant="body"
          style={{
            fontWeight: typography.fontWeight.semibold,
            marginBottom: spacing.xs,
          }}
        >
          Date Range (Optional)
        </Text>
        <Stack direction="horizontal" spacing="md" align="center">
          <Stack direction="horizontal" spacing="sm" align="center">
            <Text variant="body" style={{ fontSize: typography.fontSize.sm }}>
              From:
            </Text>
            <input
              type="date"
              style={dateInputStyles}
              value={dateRange?.start || ''}
              onChange={e =>
                setDateRange(prev => ({
                  start: e.target.value,
                  end: prev?.end || '',
                }))
              }
            />
          </Stack>
          <Stack direction="horizontal" spacing="sm" align="center">
            <Text variant="body" style={{ fontSize: typography.fontSize.sm }}>
              To:
            </Text>
            <input
              type="date"
              style={dateInputStyles}
              value={dateRange?.end || ''}
              onChange={e =>
                setDateRange(prev => ({
                  start: prev?.start || '',
                  end: e.target.value,
                }))
              }
            />
          </Stack>
          {dateRange && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDateRange(null)}
            >
              Clear
            </Button>
          )}
        </Stack>
      </div>

      {selectedFormat === 'json' && (
        <div style={filterSectionStyles}>
          <Stack direction="horizontal" spacing="sm" align="center">
            <input
              type="checkbox"
              id="includeAttachments"
              style={checkboxStyles}
              checked={includeAttachments}
              onChange={e => setIncludeAttachments(e.target.checked)}
            />
            <label htmlFor="includeAttachments" style={{ cursor: 'pointer' }}>
              <Text variant="body">Include attachments (metadata only)</Text>
            </label>
          </Stack>
        </div>
      )}

      <Stack direction="horizontal" spacing="md" justify="end">
        <Button variant="primary" onClick={handleExport}>
          Export
        </Button>
      </Stack>
    </Stack>
  )
}

export default ExportPanel

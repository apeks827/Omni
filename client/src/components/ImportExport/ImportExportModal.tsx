import React, { useState, useCallback } from 'react'
import { Modal, Button, Stack, Text } from '../../design-system'
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from '../../design-system/tokens'
import ExportPanel from './ExportPanel'
import ImportWizard from './ImportWizard'

export type ImportExportFormat = 'json' | 'csv' | 'markdown' | 'ical'
export type ImportSource = 'json' | 'csv' | 'todoist' | 'trello' | 'asana'

export interface ExportConfig {
  format: ImportExportFormat
  projectIds: string[]
  includeAttachments: boolean
  filters: {
    status: string[]
    tags: string[]
    dateRange: { start: string; end: string } | null
  }
}

export interface ImportConfig {
  source: ImportSource
  file: File | null
  conflictResolution: 'skip' | 'overwrite' | 'merge' | 'manual' | 'keep_both'
  targetProjectId: string
  fieldMappings: Record<string, string>
}

interface ImportExportModalProps {
  isOpen: boolean
  onClose: () => void
  onExport: (config: ExportConfig) => Promise<void>
  onImport: (config: ImportConfig) => Promise<void>
  projects: Array<{ id: string; name: string }>
  availableTags: string[]
}

type TabType = 'export' | 'import'

const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  onImport,
  projects,
  availableTags,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('export')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleExport = useCallback(
    async (config: ExportConfig) => {
      setIsProcessing(true)
      setError(null)
      setProgress(0)

      try {
        let currentProgress = 0
        const progressInterval = setInterval(() => {
          currentProgress += 10
          if (currentProgress >= 90) {
            clearInterval(progressInterval)
          }
          setProgress(currentProgress)
        }, 200)

        await onExport(config)

        clearInterval(progressInterval)
        setProgress(100)

        setTimeout(() => {
          onClose()
        }, 500)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Export failed')
      } finally {
        setIsProcessing(false)
      }
    },
    [onExport, onClose]
  )

  const handleImport = useCallback(
    async (config: ImportConfig) => {
      setIsProcessing(true)
      setError(null)
      setProgress(0)

      try {
        let currentProgress = 0
        const progressInterval = setInterval(() => {
          currentProgress += 5
          if (currentProgress >= 90) {
            clearInterval(progressInterval)
          }
          setProgress(currentProgress)
        }, 200)

        await onImport(config)

        clearInterval(progressInterval)
        setProgress(100)

        setTimeout(() => {
          onClose()
        }, 500)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Import failed')
      } finally {
        setIsProcessing(false)
      }
    },
    [onImport, onClose]
  )

  const tabStyles: React.CSSProperties = {
    display: 'flex',
    borderBottom: `1px solid ${colors.gray200}`,
    marginBottom: spacing.lg,
  }

  const tabButtonStyles = (isActive: boolean): React.CSSProperties => ({
    padding: `${spacing.md} ${spacing.lg}`,
    background: 'none',
    border: 'none',
    borderBottom: isActive
      ? `2px solid ${colors.primary}`
      : '2px solid transparent',
    color: isActive ? colors.primary : colors.gray600,
    fontWeight: isActive
      ? typography.fontWeight.semibold
      : typography.fontWeight.normal,
    cursor: 'pointer',
    fontSize: typography.fontSize.md,
    transition: 'all 0.2s ease',
  })

  const errorStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: `${colors.danger}15`,
    border: `1px solid ${colors.danger}`,
    borderRadius: borderRadius.md,
    color: colors.danger,
    marginTop: spacing.md,
  }

  const progressContainerStyles: React.CSSProperties = {
    marginTop: spacing.md,
  }

  const progressBarStyles: React.CSSProperties = {
    height: '8px',
    backgroundColor: colors.gray200,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  }

  const progressFillStyles = (percent: number): React.CSSProperties => ({
    height: '100%',
    width: `${percent}%`,
    backgroundColor: colors.primary,
    transition: 'width 0.3s ease',
  })

  const statusLabelStyles: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    marginTop: spacing.xs,
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import / Export"
      size="lg"
      footer={
        <Stack direction="horizontal" spacing="md" justify="end">
          <Button variant="secondary" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
        </Stack>
      }
    >
      <div style={tabStyles}>
        <button
          style={tabButtonStyles(activeTab === 'export')}
          onClick={() => setActiveTab('export')}
        >
          Export
        </button>
        <button
          style={tabButtonStyles(activeTab === 'import')}
          onClick={() => setActiveTab('import')}
        >
          Import
        </button>
      </div>

      {error && (
        <div style={errorStyles}>
          <Text
            variant="body"
            style={{ fontWeight: typography.fontWeight.medium }}
          >
            Error
          </Text>
          <Text variant="body">{error}</Text>
        </div>
      )}

      {isProcessing && (
        <div style={progressContainerStyles}>
          <div style={progressBarStyles}>
            <div style={progressFillStyles(progress)} />
          </div>
          <div style={statusLabelStyles}>
            {activeTab === 'export' ? 'Exporting...' : 'Importing...'}{' '}
            {progress}%
          </div>
        </div>
      )}

      {!isProcessing && (
        <>
          {activeTab === 'export' ? (
            <ExportPanel
              projects={projects}
              availableTags={availableTags}
              onExport={handleExport}
            />
          ) : (
            <ImportWizard projects={projects} onImport={handleImport} />
          )}
        </>
      )}
    </Modal>
  )
}

export default ImportExportModal

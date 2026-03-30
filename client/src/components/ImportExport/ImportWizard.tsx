import React, { useState } from 'react'
import { Button, Stack, Text } from '../../design-system'
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from '../../design-system/tokens'
import { ImportSource, ImportConfig } from './ImportExportModal'

interface ImportWizardProps {
  projects: Array<{ id: string; name: string }>
  onImport: (config: ImportConfig) => Promise<void>
}

type WizardStep = 'upload' | 'preview' | 'mapping' | 'conflicts'

interface ImportPreview {
  totalTasks: number
  conflicts: Array<{
    id: string
    type: string
    localItem: Record<string, unknown>
    importedItem: Record<string, unknown>
  }>
  sampleTasks: Array<{
    title: string
    status: string
    priority: string
  }>
}

const ImportWizard: React.FC<ImportWizardProps> = ({ projects, onImport }) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload')
  const [selectedSource, setSelectedSource] = useState<ImportSource>('json')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [targetProjectId, setTargetProjectId] = useState<string>('')
  const [conflictResolution, setConflictResolution] =
    useState<ImportConfig['conflictResolution']>('skip')
  const [fieldMappings] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<ImportPreview | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      generatePreview()
    }
  }

  const generatePreview = async () => {
    setPreview({
      totalTasks: 42,
      conflicts: [
        {
          id: '1',
          type: 'duplicate',
          localItem: { title: 'Task 1', status: 'done' },
          importedItem: { title: 'Task 1', status: 'in_progress' },
        },
      ],
      sampleTasks: [
        { title: 'Sample Task 1', status: 'todo', priority: 'high' },
        { title: 'Sample Task 2', status: 'in_progress', priority: 'medium' },
      ],
    })
    setCurrentStep('preview')
  }

  const handleImport = () => {
    if (!selectedFile || !targetProjectId) return

    onImport({
      source: selectedSource,
      file: selectedFile,
      conflictResolution,
      targetProjectId,
      fieldMappings,
    })
  }

  const sourceCardStyles = (isSelected: boolean): React.CSSProperties => ({
    padding: spacing.md,
    border: `2px solid ${isSelected ? colors.primary : colors.gray200}`,
    borderRadius: borderRadius.lg,
    cursor: 'pointer',
    backgroundColor: isSelected ? `${colors.primary}08` : colors.white,
    transition: 'all 0.2s ease',
    flex: 1,
    minWidth: '120px',
  })

  const uploadAreaStyles: React.CSSProperties = {
    padding: spacing.xl,
    border: `2px dashed ${colors.gray300}`,
    borderRadius: borderRadius.lg,
    textAlign: 'center',
    backgroundColor: colors.gray100,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  }

  const previewCardStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  }

  const statRowStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: `${spacing.sm} 0`,
    borderBottom: `1px solid ${colors.gray200}`,
  }

  const selectStyles: React.CSSProperties = {
    width: '100%',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.gray300}`,
    fontSize: typography.fontSize.md,
  }

  const renderUploadStep = () => (
    <Stack spacing="lg">
      <div>
        <Text
          variant="body"
          style={{
            fontWeight: typography.fontWeight.semibold,
            marginBottom: spacing.sm,
          }}
        >
          Import Source
        </Text>
        <Stack direction="horizontal" spacing="md">
          {(
            ['json', 'csv', 'todoist', 'trello', 'asana'] as ImportSource[]
          ).map(source => (
            <div
              key={source}
              style={sourceCardStyles(selectedSource === source)}
              onClick={() => setSelectedSource(source)}
            >
              <Text
                variant="body"
                style={{
                  fontWeight: typography.fontWeight.semibold,
                  textTransform: 'capitalize',
                }}
              >
                {source}
              </Text>
            </div>
          ))}
        </Stack>
      </div>

      <div>
        <Text
          variant="body"
          style={{
            fontWeight: typography.fontWeight.semibold,
            marginBottom: spacing.sm,
          }}
        >
          Upload File
        </Text>
        <label htmlFor="file-upload" style={uploadAreaStyles}>
          <input
            id="file-upload"
            type="file"
            accept=".json,.csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>📁</div>
          <Text variant="body" style={{ color: colors.gray600 }}>
            {selectedFile
              ? selectedFile.name
              : 'Click to select file or drag and drop'}
          </Text>
          <Text
            variant="body"
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.gray500,
              marginTop: spacing.xs,
            }}
          >
            Supported formats: JSON, CSV
          </Text>
        </label>
      </div>

      <div>
        <Text
          variant="body"
          style={{
            fontWeight: typography.fontWeight.semibold,
            marginBottom: spacing.sm,
          }}
        >
          Target Project
        </Text>
        <select
          value={targetProjectId}
          onChange={e => setTargetProjectId(e.target.value)}
          style={selectStyles}
        >
          <option value="">Select a project...</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>
    </Stack>
  )

  const renderPreviewStep = () => (
    <Stack spacing="lg">
      <div>
        <Text
          variant="body"
          style={{
            fontWeight: typography.fontWeight.semibold,
            marginBottom: spacing.sm,
          }}
        >
          Import Preview
        </Text>
        {preview && (
          <div style={previewCardStyles}>
            <div style={statRowStyles}>
              <Text variant="body">Total Tasks</Text>
              <Text
                variant="body"
                style={{ fontWeight: typography.fontWeight.semibold }}
              >
                {preview.totalTasks}
              </Text>
            </div>
            <div style={statRowStyles}>
              <Text variant="body">Conflicts Detected</Text>
              <Text
                variant="body"
                style={{
                  fontWeight: typography.fontWeight.semibold,
                  color:
                    preview.conflicts.length > 0
                      ? colors.warning
                      : colors.success,
                }}
              >
                {preview.conflicts.length}
              </Text>
            </div>
          </div>
        )}
      </div>

      {preview && preview.sampleTasks.length > 0 && (
        <div>
          <Text
            variant="body"
            style={{
              fontWeight: typography.fontWeight.semibold,
              marginBottom: spacing.sm,
            }}
          >
            Sample Tasks
          </Text>
          <div style={previewCardStyles}>
            {preview.sampleTasks.map((task, idx) => (
              <div
                key={idx}
                style={{
                  padding: `${spacing.sm} 0`,
                  borderBottom:
                    idx < preview.sampleTasks.length - 1
                      ? `1px solid ${colors.gray200}`
                      : 'none',
                }}
              >
                <Text
                  variant="body"
                  style={{ fontWeight: typography.fontWeight.medium }}
                >
                  {task.title}
                </Text>
                <Text
                  variant="body"
                  style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.gray600,
                  }}
                >
                  {task.status} • {task.priority}
                </Text>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <Text
          variant="body"
          style={{
            fontWeight: typography.fontWeight.semibold,
            marginBottom: spacing.sm,
          }}
        >
          Conflict Resolution Strategy
        </Text>
        <select
          value={conflictResolution}
          onChange={e =>
            setConflictResolution(
              e.target.value as ImportConfig['conflictResolution']
            )
          }
          style={selectStyles}
        >
          <option value="skip">Skip conflicting items</option>
          <option value="overwrite">Overwrite existing items</option>
          <option value="merge">Merge fields (latest wins)</option>
          <option value="keep_both">Keep both (create duplicates)</option>
          <option value="manual">Manual resolution</option>
        </select>
      </div>

      <Stack direction="horizontal" spacing="md" justify="end">
        <Button variant="secondary" onClick={() => setCurrentStep('upload')}>
          Back
        </Button>
        <Button
          variant="primary"
          onClick={handleImport}
          disabled={!targetProjectId}
        >
          Import
        </Button>
      </Stack>
    </Stack>
  )

  return (
    <div>
      {currentStep === 'upload' && renderUploadStep()}
      {currentStep === 'preview' && renderPreviewStep()}
    </div>
  )
}

export default ImportWizard

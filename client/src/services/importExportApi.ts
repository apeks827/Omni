const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

interface ExportConfig {
  format: 'json' | 'csv' | 'markdown' | 'ical'
  projectIds: string[]
  includeAttachments: boolean
  filters: {
    status: string[]
    tags: string[]
    dateRange: { start: string; end: string } | null
  }
}

interface ImportConfig {
  source: 'json' | 'csv' | 'todoist' | 'trello' | 'asana'
  file: File | null
  conflictResolution: 'skip' | 'overwrite' | 'merge' | 'manual' | 'keep_both'
  targetProjectId: string
  fieldMappings: Record<string, string>
}

interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: Array<{ line: number; message: string }>
}

class ImportExportApi {
  private getAuthToken(): string | null {
    return localStorage.getItem('authToken')
  }

  async exportTasks(config: ExportConfig): Promise<Blob> {
    const params = new URLSearchParams()
    params.append('format', config.format)
    params.append('projectIds', config.projectIds.join(','))
    params.append('includeAttachments', config.includeAttachments.toString())

    if (config.filters.status.length > 0) {
      params.append('status', config.filters.status.join(','))
    }

    if (config.filters.tags.length > 0) {
      params.append('tags', config.filters.tags.join(','))
    }

    if (config.filters.dateRange) {
      params.append('startDate', config.filters.dateRange.start)
      params.append('endDate', config.filters.dateRange.end)
    }

    const response = await fetch(`${API_BASE_URL}/tasks/export?${params}`, {
      headers: {
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error('Export failed')
    }

    return response.blob()
  }

  async importTasks(config: ImportConfig): Promise<ImportResult> {
    if (!config.file) {
      throw new Error('No file selected')
    }

    const formData = new FormData()
    formData.append('file', config.file)
    formData.append('source', config.source)
    formData.append('conflictResolution', config.conflictResolution)
    formData.append('targetProjectId', config.targetProjectId)
    formData.append('fieldMappings', JSON.stringify(config.fieldMappings))

    const response = await fetch(`${API_BASE_URL}/tasks/import`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: 'Import failed' }))
      throw new Error(error.message || 'Import failed')
    }

    return response.json()
  }

  async previewImport(
    file: File,
    source: string
  ): Promise<{
    totalTasks: number
    conflicts: Array<{
      id: string
      type: string
      localItem: unknown
      importedItem: unknown
    }>
    sampleTasks: Array<{ title: string; status: string; priority: string }>
  }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('source', source)

    const response = await fetch(`${API_BASE_URL}/tasks/import/preview`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.getAuthToken()}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Preview failed')
    }

    return response.json()
  }
}

export default new ImportExportApi()

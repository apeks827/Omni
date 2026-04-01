import React, { useEffect, useState } from 'react'
import { useTemplateStore } from '../../stores/templateStore'
import TemplateCard from './TemplateCard'
import TemplateForm from './TemplateForm'
import TemplateApplyModal from './TemplateApplyModal'
import { TaskTemplate } from '../../types'
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from '../../design-system/tokens'

const TemplateGallery: React.FC = () => {
  const {
    templates,
    isLoading,
    error,
    selectedTemplate,
    isModalOpen,
    fetchTemplates,
    deleteTemplate,
    selectTemplate,
    closeModal,
  } = useTemplateStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(
    null
  )

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const filteredTemplates = templates.filter(template =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleEdit = (template: TaskTemplate) => {
    setEditingTemplate(template)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingTemplate(null)
  }

  return (
    <div style={{ padding: spacing.lg }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.lg,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
          }}
        >
          Task Templates
        </h2>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: `${spacing.sm} ${spacing.md}`,
            backgroundColor: colors.primary,
            color: colors.white,
            border: 'none',
            borderRadius: borderRadius.lg,
            fontSize: typography.fontSize.md,
            fontWeight: typography.fontWeight.medium,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Template
        </button>
      </div>

      <div style={{ marginBottom: spacing.lg }}>
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: spacing.md,
            fontSize: typography.fontSize.md,
            border: `1px solid ${colors.border.default}`,
            borderRadius: borderRadius.lg,
            outline: 'none',
          }}
        />
      </div>

      {error && (
        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.danger + '15',
            color: colors.danger,
            borderRadius: borderRadius.lg,
            marginBottom: spacing.lg,
          }}
        >
          {error}
        </div>
      )}

      {isLoading ? (
        <div
          style={{
            textAlign: 'center',
            padding: spacing.xl,
            color: colors.text.secondary,
          }}
        >
          Loading templates...
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: spacing.xl,
            color: colors.text.secondary,
          }}
        >
          {searchQuery
            ? 'No templates found'
            : 'No templates yet. Create your first template!'}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: spacing.md,
          }}
        >
          {filteredTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={selectTemplate}
              onEdit={handleEdit}
              onDelete={deleteTemplate}
            />
          ))}
        </div>
      )}

      {showForm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={e => {
            if (e.target === e.currentTarget) {
              handleCloseForm()
            }
          }}
        >
          <div
            style={{
              backgroundColor: colors.white,
              borderRadius: borderRadius.xl,
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
          >
            <TemplateForm
              template={editingTemplate}
              onClose={handleCloseForm}
            />
          </div>
        </div>
      )}

      {selectedTemplate && isModalOpen && (
        <TemplateApplyModal template={selectedTemplate} onClose={closeModal} />
      )}
    </div>
  )
}

export default TemplateGallery

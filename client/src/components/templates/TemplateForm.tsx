import React, { useState, useEffect } from 'react'
import { useTemplateStore } from '../../stores/templateStore'
import { TaskTemplate } from '../../types'
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from '../../design-system/tokens'

interface TemplateFormProps {
  template?: TaskTemplate | null
  onClose: () => void
}

const TemplateForm: React.FC<TemplateFormProps> = ({ template, onClose }) => {
  const { createTemplate, updateTemplate, isLoading } = useTemplateStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<
    'low' | 'medium' | 'high' | 'critical' | ''
  >('')
  const [estimatedDuration, setEstimatedDuration] = useState('')
  const [checklistItems, setChecklistItems] = useState<string[]>([])
  const [newChecklistItem, setNewChecklistItem] = useState('')
  const [variables, setVariables] = useState<
    Array<{ key: string; defaultValue: string }>
  >([])
  const [newVarKey, setNewVarKey] = useState('')
  const [newVarDefault, setNewVarDefault] = useState('')

  useEffect(() => {
    if (template) {
      setTitle(template.title || '')
      setDescription(template.description || '')
      setPriority(template.priority || '')
      setEstimatedDuration(template.estimated_duration?.toString() || '')
      setChecklistItems(template.checklist || [])
      const vars = template.variables || {}
      setVariables(
        Object.entries(vars).map(([key, value]) => ({
          key,
          defaultValue: value,
        }))
      )
    }
  }, [template])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority: priority || undefined,
      estimated_duration: estimatedDuration
        ? parseInt(estimatedDuration)
        : undefined,
      checklist: checklistItems.length > 0 ? checklistItems : undefined,
      variables:
        variables.length > 0
          ? Object.fromEntries(variables.map(v => [v.key, v.defaultValue]))
          : undefined,
    }

    try {
      if (template?.id) {
        await updateTemplate(template.id, data)
      } else {
        await createTemplate(data)
      }
      onClose()
    } catch (error) {
      console.error('Failed to save template:', error)
    }
  }

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setChecklistItems([...checklistItems, newChecklistItem.trim()])
      setNewChecklistItem('')
    }
  }

  const removeChecklistItem = (index: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index))
  }

  const addVariable = () => {
    if (newVarKey.trim()) {
      setVariables([
        ...variables,
        { key: newVarKey.trim(), defaultValue: newVarDefault.trim() },
      ])
      setNewVarKey('')
      setNewVarDefault('')
    }
  }

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index))
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: spacing.lg }}>
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
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.bold,
          }}
        >
          {template?.id ? 'Edit Template' : 'New Template'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '24px',
            color: colors.text.secondary,
          }}
        >
          ×
        </button>
      </div>

      <div style={{ marginBottom: spacing.md }}>
        <label
          style={{
            display: 'block',
            marginBottom: spacing.xs,
            fontWeight: typography.fontWeight.medium,
          }}
        >
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g., Weekly Report - Week {week_number}"
          required
          style={{
            width: '100%',
            padding: spacing.md,
            fontSize: typography.fontSize.md,
            border: `1px solid ${colors.border.default}`,
            borderRadius: borderRadius.lg,
          }}
        />
        <p
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            marginTop: spacing.xs,
          }}
        >
          Use {'{variable_name}'} syntax for dynamic values
        </p>
      </div>

      <div style={{ marginBottom: spacing.md }}>
        <label
          style={{
            display: 'block',
            marginBottom: spacing.xs,
            fontWeight: typography.fontWeight.medium,
          }}
        >
          Description
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Optional description..."
          rows={3}
          style={{
            width: '100%',
            padding: spacing.md,
            fontSize: typography.fontSize.md,
            border: `1px solid ${colors.border.default}`,
            borderRadius: borderRadius.lg,
            resize: 'vertical',
          }}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: spacing.md,
          marginBottom: spacing.md,
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: spacing.xs,
              fontWeight: typography.fontWeight.medium,
            }}
          >
            Priority
          </label>
          <select
            value={priority}
            onChange={e =>
              setPriority(e.target.value as 'low' | 'medium' | 'high' | '')
            }
            style={{
              width: '100%',
              padding: spacing.md,
              fontSize: typography.fontSize.md,
              border: `1px solid ${colors.border.default}`,
              borderRadius: borderRadius.lg,
            }}
          >
            <option value="">Default (medium)</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              marginBottom: spacing.xs,
              fontWeight: typography.fontWeight.medium,
            }}
          >
            Estimated Duration (minutes)
          </label>
          <input
            type="number"
            value={estimatedDuration}
            onChange={e => setEstimatedDuration(e.target.value)}
            placeholder="e.g., 60"
            min="1"
            style={{
              width: '100%',
              padding: spacing.md,
              fontSize: typography.fontSize.md,
              border: `1px solid ${colors.border.default}`,
              borderRadius: borderRadius.lg,
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: spacing.md }}>
        <label
          style={{
            display: 'block',
            marginBottom: spacing.xs,
            fontWeight: typography.fontWeight.medium,
          }}
        >
          Checklist Items
        </label>
        <div
          style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.sm }}
        >
          <input
            type="text"
            value={newChecklistItem}
            onChange={e => setNewChecklistItem(e.target.value)}
            placeholder="Add checklist item..."
            style={{
              flex: 1,
              padding: spacing.sm,
              fontSize: typography.fontSize.md,
              border: `1px solid ${colors.border.default}`,
              borderRadius: borderRadius.lg,
            }}
            onKeyDown={e =>
              e.key === 'Enter' && (e.preventDefault(), addChecklistItem())
            }
          />
          <button
            type="button"
            onClick={addChecklistItem}
            style={{ padding: spacing.sm }}
          >
            Add
          </button>
        </div>
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}
        >
          {checklistItems.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: spacing.sm,
                backgroundColor: colors.bg.subtle,
                borderRadius: borderRadius.md,
              }}
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => removeChecklistItem(index)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: colors.danger,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: spacing.lg }}>
        <label
          style={{
            display: 'block',
            marginBottom: spacing.xs,
            fontWeight: typography.fontWeight.medium,
          }}
        >
          Variables
        </label>
        <div
          style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.sm }}
        >
          <input
            type="text"
            value={newVarKey}
            onChange={e => setNewVarKey(e.target.value)}
            placeholder="Variable name (e.g., week_number)"
            style={{
              flex: 1,
              padding: spacing.sm,
              fontSize: typography.fontSize.md,
              border: `1px solid ${colors.border.default}`,
              borderRadius: borderRadius.lg,
            }}
          />
          <input
            type="text"
            value={newVarDefault}
            onChange={e => setNewVarDefault(e.target.value)}
            placeholder="Default value"
            style={{
              flex: 1,
              padding: spacing.sm,
              fontSize: typography.fontSize.md,
              border: `1px solid ${colors.border.default}`,
              borderRadius: borderRadius.lg,
            }}
          />
          <button
            type="button"
            onClick={addVariable}
            style={{ padding: spacing.sm }}
          >
            Add
          </button>
        </div>
        <p
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
          }}
        >
          Built-in variables: {'{date}'}, {'{week_number}'}, {'{project_name}'}
        </p>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.xs,
            marginTop: spacing.sm,
          }}
        >
          {variables.map((v, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: spacing.sm,
                backgroundColor: colors.bg.subtle,
                borderRadius: borderRadius.md,
              }}
            >
              <span>
                <code
                  style={{
                    backgroundColor: colors.primary + '20',
                    padding: '2px 4px',
                    borderRadius: '4px',
                  }}
                >
                  {'{' + v.key + '}'}
                </code>
                {v.defaultValue && (
                  <span
                    style={{
                      marginLeft: spacing.sm,
                      color: colors.text.secondary,
                    }}
                  >
                    = {v.defaultValue}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => removeVariable(index)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: colors.danger,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end' }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: `${spacing.md} ${spacing.lg}`,
            backgroundColor: colors.bg.subtle,
            border: 'none',
            borderRadius: borderRadius.lg,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || !title.trim()}
          style={{
            padding: `${spacing.md} ${spacing.lg}`,
            backgroundColor: colors.primary,
            color: colors.white,
            border: 'none',
            borderRadius: borderRadius.lg,
            cursor: isLoading || !title.trim() ? 'not-allowed' : 'pointer',
            opacity: isLoading || !title.trim() ? 0.6 : 1,
          }}
        >
          {isLoading
            ? 'Saving...'
            : template?.id
              ? 'Update Template'
              : 'Create Template'}
        </button>
      </div>
    </form>
  )
}

export default TemplateForm

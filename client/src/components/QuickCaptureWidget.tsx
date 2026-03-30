import { useState, useEffect } from 'react'
import { Modal } from '../design-system'
import { apiClient } from '../services/api'
import { colors, spacing } from '../design-system/tokens'
import NLPTaskInput, { ParsedTask } from './NLPTaskInput'

interface QuickCaptureWidgetProps {
  onTaskCreated?: () => void
}

export default function QuickCaptureWidget({
  onTaskCreated,
}: QuickCaptureWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleSubmit = async (parsed: ParsedTask) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      await apiClient.createTask({
        title: parsed.title.trim(),
        status: 'todo',
        priority: parsed.priority || 'medium',
        description:
          parsed.location || parsed.category
            ? `${parsed.location ? `Location: ${parsed.location}\n` : ''}${parsed.category ? `Category: ${parsed.category}` : ''}`.trim()
            : undefined,
        due_date: parsed.due_date ? new Date(parsed.due_date) : undefined,
      })

      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
      handleClose()
      onTaskCreated?.()
    } catch (error) {
      console.error('Failed to create task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: spacing.xl,
          right: spacing.xl,
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: colors.primary,
          color: colors.white,
          border: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          transition: 'all 0.2s ease',
          zIndex: 1000,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
        }}
        aria-label="Quick capture task"
        title="Quick capture (Ctrl+K)"
      >
        +
      </button>

      <Modal isOpen={isOpen} onClose={handleClose} title="Quick Capture">
        <NLPTaskInput
          onSubmit={handleSubmit}
          placeholder="What needs to be done? Try: 'Meeting tomorrow at 2pm high priority'"
        />
      </Modal>

      {showToast && (
        <div
          style={{
            position: 'fixed',
            bottom: spacing.xl,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: colors.success,
            color: colors.white,
            padding: `${spacing.sm} ${spacing.lg}`,
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1001,
            animation: 'slideUp 0.3s ease',
          }}
        >
          Task created successfully!
        </div>
      )}
    </>
  )
}

import React, { useState } from 'react'
import NLPTaskInput, { ParsedTask } from './NLPTaskInput'
import TaskReviewModal from './TaskReviewModal'

interface NLPTaskInputWithModalProps {
  onSubmit: (task: {
    title: string
    priority: 'low' | 'medium' | 'high' | 'critical'
    due_date?: Date
    due_time?: string
    location?: string
    category?: string
  }) => Promise<void>
  onEditAsManual?: () => void
  placeholder?: string
}

const NLPTaskInputWithModal: React.FC<NLPTaskInputWithModalProps> = ({
  onSubmit,
  onEditAsManual,
  placeholder,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedTask | null>(null)

  const handleNLPSubmit = (parsed: ParsedTask) => {
    setParsedData(parsed)
    setIsModalOpen(true)
  }

  const handleModalSave = async (task: {
    title: string
    due_date?: Date
    due_time?: string
    priority: 'low' | 'medium' | 'high' | 'critical'
    location?: string
    category?: string
  }) => {
    await onSubmit(task)
    setIsModalOpen(false)
    setParsedData(null)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  const handleEditAsManual = () => {
    setIsModalOpen(false)
    setParsedData(null)
    if (onEditAsManual) {
      onEditAsManual()
    }
  }

  return (
    <>
      <NLPTaskInput onSubmit={handleNLPSubmit} placeholder={placeholder} />
      {parsedData && (
        <TaskReviewModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
          onEditAsManual={handleEditAsManual}
          parsedData={parsedData}
        />
      )}
    </>
  )
}

export default NLPTaskInputWithModal

import React, { useState, useRef, useEffect } from 'react'
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../design-system/tokens'

interface User {
  id: string
  name: string
  avatar?: string
  role?: string
}

interface CommentComposerProps {
  onSubmit: (content: string, attachments: File[]) => void
  onCancel?: () => void
  placeholder?: string
  initialValue?: string
  submitLabel?: string
  showCancel?: boolean
  users?: User[]
  onMentionSearch?: (query: string) => Promise<User[]>
}

const CommentComposer: React.FC<CommentComposerProps> = ({
  onSubmit,
  onCancel,
  placeholder = 'Write a comment... (Markdown supported)',
  initialValue = '',
  submitLabel = 'Comment',
  showCancel = false,
  users = [],
  onMentionSearch,
}) => {
  const [content, setContent] = useState(initialValue)
  const [attachments, setAttachments] = useState<File[]>([])
  const [isFocused, setIsFocused] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mentionSearchResults, setMentionSearchResults] = useState<User[]>([])
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0)
  const [showMentionDropdown, setShowMentionDropdown] = useState(false)
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 })

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mentionRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!content.trim() && attachments.length === 0) return

    setIsSubmitting(true)
    try {
      await onSubmit(content, attachments)
      setContent('')
      setAttachments([])
      setShowPreview(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
      return
    }

    if (showMentionDropdown && mentionSearchResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMentionSelectedIndex(prev =>
          prev < mentionSearchResults.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMentionSelectedIndex(prev => (prev > 0 ? prev - 1 : prev))
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        insertMention(mentionSearchResults[mentionSelectedIndex])
      } else if (e.key === 'Escape') {
        setShowMentionDropdown(false)
      }
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const cursorPosition = e.target.selectionStart
    const textBeforeCursor = value.substring(0, cursorPosition)

    setContent(value)

    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)
    if (mentionMatch) {
      const query = mentionMatch[1]

      const rect = textareaRef.current?.getBoundingClientRect()
      if (rect) {
        setMentionPosition({
          top: rect.height + 8,
          left: 16,
        })
      }

      if (onMentionSearch) {
        onMentionSearch(query).then(results => {
          setMentionSearchResults(results)
          setShowMentionDropdown(results.length > 0)
          setMentionSelectedIndex(0)
        })
      } else {
        const filtered = users.filter(u =>
          u.name.toLowerCase().includes(query.toLowerCase())
        )
        setMentionSearchResults(filtered)
        setShowMentionDropdown(filtered.length > 0)
        setMentionSelectedIndex(0)
      }
    } else {
      setShowMentionDropdown(false)
    }
  }

  const insertMention = (user: User) => {
    const cursorPosition = textareaRef.current?.selectionStart || 0
    const textBeforeCursor = content.substring(0, cursorPosition)
    const textAfterCursor = content.substring(cursorPosition)

    const mentionStart = textBeforeCursor.lastIndexOf('@')
    const newContent =
      textBeforeCursor.substring(0, mentionStart) +
      `@${user.name} ` +
      textAfterCursor

    setContent(newContent)
    setShowMentionDropdown(false)

    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = mentionStart + user.name.length + 2
        textareaRef.current.setSelectionRange(newPosition, newPosition)
        textareaRef.current.focus()
      }
    }, 0)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.dataTransfer.files) {
      setAttachments([...attachments, ...Array.from(e.dataTransfer.files)])
    }
  }

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)

    const newContent =
      content.substring(0, start) +
      prefix +
      selectedText +
      suffix +
      content.substring(end)

    setContent(newContent)

    setTimeout(() => {
      const newPosition =
        start + prefix.length + selectedText.length + suffix.length
      textarea.setSelectionRange(newPosition, newPosition)
      textarea.focus()
    }, 0)
  }

  const renderMarkdownPreview = (text: string) => {
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(
        /@(\w+)/g,
        '<span style="background: #e7f3ff; padding: 2px 4px; border-radius: 4px; color: #007bff;">@$1</span>'
      )
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(
        /`(.+?)`/g,
        '<code style="background: #f4f4f4; padding: 2px 4px; border-radius: 2px; font-family: monospace;">$1</code>'
      )
      .replace(/\n/g, '<br>')

    return { __html: html }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        mentionRef.current &&
        !mentionRef.current.contains(e.target as Node)
      ) {
        setShowMentionDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const containerStyles: React.CSSProperties = {
    border: `1px solid ${isFocused ? colors.primary : colors.border.subtle}`,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    backgroundColor: colors.white,
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    boxShadow: isFocused ? `0 0 0 3px ${colors.focus}` : 'none',
  }

  const toolbarStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottom: `1px solid ${colors.border.subtle}`,
    opacity: isFocused ? 1 : 0.5,
    transition: 'opacity 0.2s ease',
  }

  const toolbarGroupStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing.xs,
  }

  const toolbarButtonStyles: React.CSSProperties = {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    borderRadius: borderRadius.sm,
    cursor: 'pointer',
    color: colors.gray600,
    fontSize: '14px',
    fontWeight: typography.fontWeight.semibold,
  }

  const textareaStyles: React.CSSProperties = {
    width: '100%',
    minHeight: '80px',
    padding: spacing.sm,
    border: 'none',
    fontSize: typography.fontSize.md,
    fontFamily: 'inherit',
    resize: 'vertical',
    outline: 'none',
    lineHeight: typography.lineHeight.relaxed,
  }

  const previewStyles: React.CSSProperties = {
    minHeight: '80px',
    padding: spacing.sm,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.sm,
    fontSize: typography.fontSize.md,
    lineHeight: typography.lineHeight.relaxed,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  }

  const attachmentListStyles: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  }

  const attachmentItemStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    padding: `${spacing.xs} ${spacing.sm}`,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.sm,
    color: colors.gray700,
  }

  const mentionDropdownStyles: React.CSSProperties = {
    position: 'absolute',
    top: mentionPosition.top,
    left: mentionPosition.left,
    right: spacing.md,
    maxHeight: '240px',
    overflowY: 'auto',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    boxShadow: shadows.lg,
    zIndex: 100,
  }

  const mentionItemStyles = (isSelected: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.sm} ${spacing.md}`,
    cursor: 'pointer',
    backgroundColor: isSelected ? colors.gray100 : 'transparent',
  })

  const mentionAvatarStyles: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    color: colors.white,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  }

  const submitButtonStyles: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.lg}`,
    borderRadius: borderRadius.md,
    border: 'none',
    backgroundColor: colors.primary,
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    cursor:
      isSubmitting || (!content.trim() && attachments.length === 0)
        ? 'not-allowed'
        : 'pointer',
    opacity:
      isSubmitting || (!content.trim() && attachments.length === 0) ? 0.6 : 1,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
  }

  const cancelButtonStyles: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.lg}`,
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.border.subtle}`,
    backgroundColor: colors.white,
    color: colors.gray700,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    cursor: 'pointer',
  }

  return (
    <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
      <div
        style={containerStyles}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div style={toolbarStyles}>
          <div style={toolbarGroupStyles}>
            <button
              type="button"
              title="Bold (Ctrl+B)"
              style={toolbarButtonStyles}
              onClick={() => insertMarkdown('**', '**')}
              onMouseEnter={e =>
                (e.currentTarget.style.backgroundColor = colors.gray200)
              }
              onMouseLeave={e =>
                (e.currentTarget.style.backgroundColor = 'transparent')
              }
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              title="Italic (Ctrl+I)"
              style={toolbarButtonStyles}
              onClick={() => insertMarkdown('*', '*')}
              onMouseEnter={e =>
                (e.currentTarget.style.backgroundColor = colors.gray200)
              }
              onMouseLeave={e =>
                (e.currentTarget.style.backgroundColor = 'transparent')
              }
            >
              <em>I</em>
            </button>
            <button
              type="button"
              title="Code"
              style={toolbarButtonStyles}
              onClick={() => insertMarkdown('`', '`')}
              onMouseEnter={e =>
                (e.currentTarget.style.backgroundColor = colors.gray200)
              }
              onMouseLeave={e =>
                (e.currentTarget.style.backgroundColor = 'transparent')
              }
            >
              {'</>'}
            </button>
            <button
              type="button"
              title="Bullet list"
              style={toolbarButtonStyles}
              onClick={() => insertMarkdown('\n- ')}
              onMouseEnter={e =>
                (e.currentTarget.style.backgroundColor = colors.gray200)
              }
              onMouseLeave={e =>
                (e.currentTarget.style.backgroundColor = 'transparent')
              }
            >
              • List
            </button>
          </div>
          <button
            type="button"
            title={showPreview ? 'Edit' : 'Preview'}
            style={{
              ...toolbarButtonStyles,
              color: showPreview ? colors.primary : colors.gray600,
            }}
            onClick={() => setShowPreview(!showPreview)}
            onMouseEnter={e =>
              (e.currentTarget.style.backgroundColor = colors.gray200)
            }
            onMouseLeave={e =>
              (e.currentTarget.style.backgroundColor = 'transparent')
            }
          >
            {showPreview ? '✏️ Edit' : '👁️ Preview'}
          </button>
        </div>

        {showPreview ? (
          <div
            style={previewStyles}
            dangerouslySetInnerHTML={renderMarkdownPreview(content)}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            style={textareaStyles}
            disabled={isSubmitting}
          />
        )}

        {showMentionDropdown && mentionSearchResults.length > 0 && (
          <div ref={mentionRef} style={mentionDropdownStyles}>
            {mentionSearchResults.map((user, index) => (
              <div
                key={user.id}
                style={mentionItemStyles(index === mentionSelectedIndex)}
                onClick={() => insertMention(user)}
                onMouseEnter={() => setMentionSelectedIndex(index)}
              >
                <div style={mentionAvatarStyles}>
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                      }}
                    />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: typography.fontWeight.medium }}>
                    {user.name}
                  </div>
                  {user.role && (
                    <div
                      style={{
                        fontSize: typography.fontSize.xs,
                        color: colors.gray600,
                      }}
                    >
                      {user.role}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {attachments.length > 0 && (
          <div style={attachmentListStyles}>
            {attachments.map((file, index) => (
              <div key={index} style={attachmentItemStyles}>
                <span>📎</span>
                <span
                  style={{
                    maxWidth: '150px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {file.name}
                </span>
                <span style={{ color: colors.gray500, fontSize: '12px' }}>
                  ({(file.size / 1024).toFixed(1)}KB)
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: colors.gray600,
                    padding: '0 4px',
                    fontSize: '16px',
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            ...toolbarStyles,
            marginTop: spacing.md,
            borderTop:
              attachments.length > 0
                ? `1px solid ${colors.border.subtle}`
                : 'none',
            borderBottom: 'none',
            paddingBottom: 0,
            paddingTop: spacing.sm,
          }}
        >
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                ...cancelButtonStyles,
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
              }}
              disabled={isSubmitting}
            >
              📎 Attach
            </button>
          </div>
          <div style={{ display: 'flex', gap: spacing.sm }}>
            {showCancel && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                style={cancelButtonStyles}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={
                isSubmitting || (!content.trim() && attachments.length === 0)
              }
              style={submitButtonStyles}
            >
              {isSubmitting && <span>...</span>}
              {submitLabel}
            </button>
          </div>
        </div>

        <div
          style={{
            marginTop: spacing.sm,
            fontSize: typography.fontSize.xs,
            color: colors.gray500,
            textAlign: 'right',
          }}
        >
          Press{' '}
          <kbd
            style={{
              padding: '2px 4px',
              background: colors.gray100,
              borderRadius: '2px',
              fontSize: '11px',
            }}
          >
            ⌘
          </kbd>{' '}
          +{' '}
          <kbd
            style={{
              padding: '2px 4px',
              background: colors.gray100,
              borderRadius: '2px',
              fontSize: '11px',
            }}
          >
            Enter
          </kbd>{' '}
          to submit
        </div>
      </div>
    </form>
  )
}

export default CommentComposer

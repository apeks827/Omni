import React, { useState } from 'react'
import { Comment } from '../types'
import CommentComposer from './CommentComposer'
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../design-system/tokens'

interface CommentListProps {
  comments: Comment[]
  onEdit: (commentId: string, content: string) => void
  onDelete: (commentId: string) => void
  onReply: (
    parentCommentId: string,
    content: string,
    attachments: File[]
  ) => void
  currentUserId: string
  maxThreadDepth?: number
  users?: Array<{ id: string; name: string; avatar?: string; role?: string }>
}

const CommentList: React.FC<CommentListProps> = ({
  comments,
  onEdit,
  onDelete,
  onReply,
  currentUserId,
  maxThreadDepth = 3,
  users = [],
}) => {
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [collapsedThreads, setCollapsedThreads] = useState<Set<string>>(
    new Set()
  )
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  )

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(date).toLocaleDateString()
  }

  const formatAbsoluteDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleEditStart = (comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditingContent(comment.content)
  }

  const handleEditSave = (commentId: string) => {
    onEdit(commentId, editingContent)
    setEditingCommentId(null)
    setEditingContent('')
  }

  const handleEditCancel = () => {
    setEditingCommentId(null)
    setEditingContent('')
  }

  const handleReplySubmit = (
    parentId: string,
    content: string,
    attachments: File[]
  ) => {
    onReply(parentId, content, attachments)
    setReplyingToId(null)
  }

  const handleDeleteConfirm = (commentId: string) => {
    onDelete(commentId)
    setShowDeleteConfirm(null)
  }

  const toggleThreadCollapse = (commentId: string) => {
    const newCollapsed = new Set(collapsedThreads)
    if (newCollapsed.has(commentId)) {
      newCollapsed.delete(commentId)
    } else {
      newCollapsed.add(commentId)
    }
    setCollapsedThreads(newCollapsed)
  }

  const renderMarkdown = (text: string) => {
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(
        /@(\w+)/g,
        '<span style="background: #e7f3ff; padding: 2px 4px; border-radius: 4px; color: #007bff; font-weight: 500;">@$1</span>'
      )
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(
        /`(.+?)`/g,
        '<code style="background: #f4f4f4; padding: 2px 4px; border-radius: 2px; font-family: monospace; font-size: 0.9em;">$1</code>'
      )
      .replace(/\n/g, '<br>')

    return { __html: html }
  }

  const renderComment = (comment: Comment, depth: number = 0) => {
    const isOwner = comment.user_id === currentUserId
    const isDeleted = !!comment.deleted_at
    const isEditing = editingCommentId === comment.id
    const isReplying = replyingToId === comment.id
    const isCollapsed = collapsedThreads.has(comment.id)
    const hasReplies = comment.replies && comment.replies.length > 0
    const shouldIndent = depth > 0 && depth < maxThreadDepth

    const commentStyles: React.CSSProperties = {
      marginLeft: shouldIndent ? spacing.xl : '0',
      marginBottom: spacing.md,
      position: 'relative',
    }

    const cardStyles: React.CSSProperties = {
      padding: spacing.md,
      backgroundColor: isDeleted ? colors.gray100 : colors.white,
      border: `1px solid ${colors.border.subtle}`,
      borderRadius: borderRadius.lg,
      boxShadow: shadows.sm,
      transition: 'box-shadow 0.2s ease',
    }

    const threadLineStyles: React.CSSProperties = {
      position: 'absolute',
      left: '-16px',
      top: '48px',
      bottom: '-8px',
      width: '2px',
      backgroundColor: colors.gray300,
      display: shouldIndent && hasReplies && !isCollapsed ? 'block' : 'none',
    }

    const headerStyles: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    }

    const authorStyles: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: spacing.sm,
    }

    const avatarStyles: React.CSSProperties = {
      width: '36px',
      height: '36px',
      borderRadius: borderRadius.full,
      backgroundColor: colors.primary,
      color: colors.white,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      flexShrink: 0,
    }

    const actionsStyles: React.CSSProperties = {
      display: 'flex',
      gap: spacing.sm,
      alignItems: 'center',
    }

    const buttonStyles: React.CSSProperties = {
      background: 'none',
      border: 'none',
      color: colors.gray600,
      cursor: 'pointer',
      fontSize: typography.fontSize.sm,
      padding: `${spacing.xs} ${spacing.sm}`,
      borderRadius: borderRadius.sm,
      transition: 'background-color 0.2s ease, color 0.2s ease',
    }

    const contentStyles: React.CSSProperties = {
      fontSize: typography.fontSize.md,
      lineHeight: typography.lineHeight.relaxed,
      color: isDeleted ? colors.gray500 : colors.gray900,
      fontStyle: isDeleted ? 'italic' : 'normal',
      marginBottom: spacing.sm,
      wordBreak: 'break-word',
    }

    const footerStyles: React.CSSProperties = {
      display: 'flex',
      gap: spacing.md,
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTop: `1px solid ${colors.border.subtle}`,
    }

    const collapseButtonStyles: React.CSSProperties = {
      ...buttonStyles,
      display: 'flex',
      alignItems: 'center',
      gap: spacing.xs,
      fontSize: typography.fontSize.xs,
      color: colors.primary,
      padding: `${spacing.xs} 0`,
    }

    return (
      <div key={comment.id} style={commentStyles}>
        {shouldIndent && <div style={threadLineStyles} />}

        <div
          style={cardStyles}
          onMouseEnter={e => {
            if (!isDeleted) {
              e.currentTarget.style.boxShadow = shadows.md
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = shadows.sm
          }}
        >
          <div style={headerStyles}>
            <div style={authorStyles}>
              <div style={avatarStyles}>
                {comment.author.avatar ? (
                  <img
                    src={comment.author.avatar}
                    alt={comment.author.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: borderRadius.full,
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  comment.author.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div
                  style={{
                    fontWeight: typography.fontWeight.semibold,
                    fontSize: typography.fontSize.md,
                    color: colors.gray900,
                  }}
                >
                  {comment.author.name}
                </div>
                <div
                  style={{
                    fontSize: typography.fontSize.xs,
                    color: colors.gray600,
                  }}
                  title={formatAbsoluteDate(comment.created_at)}
                >
                  {formatDate(comment.created_at)}
                  {comment.updated_at &&
                    comment.updated_at !== comment.created_at && (
                      <span
                        style={{ marginLeft: spacing.xs, fontStyle: 'italic' }}
                      >
                        (edited)
                      </span>
                    )}
                </div>
              </div>
            </div>
            {isOwner && !isDeleted && !isEditing && (
              <div style={actionsStyles}>
                <button
                  style={buttonStyles}
                  onClick={() => handleEditStart(comment)}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = colors.gray100
                    e.currentTarget.style.color = colors.primary
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = colors.gray600
                  }}
                >
                  ✏️ Edit
                </button>
                <button
                  style={buttonStyles}
                  onClick={() => setShowDeleteConfirm(comment.id)}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = colors.danger + '10'
                    e.currentTarget.style.color = colors.danger
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = colors.gray600
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div style={{ marginTop: spacing.sm }}>
              <textarea
                value={editingContent}
                onChange={e => setEditingContent(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: spacing.sm,
                  border: `1px solid ${colors.border.subtle}`,
                  borderRadius: borderRadius.md,
                  fontSize: typography.fontSize.md,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  gap: spacing.sm,
                  marginTop: spacing.sm,
                }}
              >
                <button
                  onClick={() => handleEditSave(comment.id)}
                  style={{
                    padding: `${spacing.sm} ${spacing.md}`,
                    backgroundColor: colors.primary,
                    color: colors.white,
                    border: 'none',
                    borderRadius: borderRadius.md,
                    cursor: 'pointer',
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                  }}
                >
                  Save
                </button>
                <button
                  onClick={handleEditCancel}
                  style={{
                    padding: `${spacing.sm} ${spacing.md}`,
                    backgroundColor: colors.white,
                    color: colors.gray700,
                    border: `1px solid ${colors.border.subtle}`,
                    borderRadius: borderRadius.md,
                    cursor: 'pointer',
                    fontSize: typography.fontSize.sm,
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div
                style={contentStyles}
                dangerouslySetInnerHTML={
                  isDeleted
                    ? { __html: '[Comment deleted]' }
                    : renderMarkdown(comment.content)
                }
              />

              {comment.attachments &&
                comment.attachments.length > 0 &&
                !isDeleted && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: spacing.sm,
                      marginTop: spacing.sm,
                    }}
                  >
                    {comment.attachments.map(attachment => (
                      <a
                        key={attachment.id}
                        href={attachment.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.xs,
                          padding: `${spacing.xs} ${spacing.sm}`,
                          backgroundColor: colors.gray100,
                          borderRadius: borderRadius.md,
                          fontSize: typography.fontSize.sm,
                          color: colors.primary,
                          textDecoration: 'none',
                          transition: 'background-color 0.2s ease',
                        }}
                        onMouseEnter={e =>
                          (e.currentTarget.style.backgroundColor =
                            colors.gray200)
                        }
                        onMouseLeave={e =>
                          (e.currentTarget.style.backgroundColor =
                            colors.gray100)
                        }
                      >
                        <span>📎</span>
                        <span>{attachment.filename}</span>
                        <span
                          style={{ color: colors.gray500, fontSize: '11px' }}
                        >
                          ({(attachment.file_size / 1024).toFixed(1)}KB)
                        </span>
                      </a>
                    ))}
                  </div>
                )}

              {!isDeleted && (
                <div style={footerStyles}>
                  <button
                    style={buttonStyles}
                    onClick={() => setReplyingToId(comment.id)}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = colors.gray100
                      e.currentTarget.style.color = colors.primary
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = colors.gray600
                    }}
                  >
                    💬 Reply
                  </button>

                  {hasReplies && (
                    <button
                      style={collapseButtonStyles}
                      onClick={() => toggleThreadCollapse(comment.id)}
                    >
                      {isCollapsed ? '▶' : '▼'}
                      <span>
                        {isCollapsed ? 'Show' : 'Hide'}{' '}
                        {comment.replies!.length}{' '}
                        {comment.replies!.length === 1 ? 'reply' : 'replies'}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {showDeleteConfirm === comment.id && (
            <div
              style={{
                marginTop: spacing.sm,
                padding: spacing.md,
                backgroundColor: colors.danger + '10',
                borderRadius: borderRadius.md,
                border: `1px solid ${colors.danger}`,
              }}
            >
              <div style={{ marginBottom: spacing.sm, color: colors.gray900 }}>
                Are you sure you want to delete this comment?
              </div>
              <div style={{ display: 'flex', gap: spacing.sm }}>
                <button
                  onClick={() => handleDeleteConfirm(comment.id)}
                  style={{
                    padding: `${spacing.sm} ${spacing.md}`,
                    backgroundColor: colors.danger,
                    color: colors.white,
                    border: 'none',
                    borderRadius: borderRadius.md,
                    cursor: 'pointer',
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                  }}
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  style={{
                    padding: `${spacing.sm} ${spacing.md}`,
                    backgroundColor: colors.white,
                    color: colors.gray700,
                    border: `1px solid ${colors.border.subtle}`,
                    borderRadius: borderRadius.md,
                    cursor: 'pointer',
                    fontSize: typography.fontSize.sm,
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {isReplying && (
          <div
            style={{
              marginTop: spacing.md,
              marginLeft: shouldIndent ? spacing.xl : '0',
            }}
          >
            <CommentComposer
              onSubmit={(content, attachments) =>
                handleReplySubmit(comment.id, content, attachments)
              }
              onCancel={() => setReplyingToId(null)}
              placeholder={`Reply to ${comment.author.name}...`}
              submitLabel="Reply"
              showCancel={true}
              users={users}
            />
          </div>
        )}

        {hasReplies && !isCollapsed && (
          <div style={{ marginTop: spacing.md }}>
            {comment.replies!.map(reply => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {comments.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: spacing.xxl,
            color: colors.gray500,
            backgroundColor: colors.gray100,
            borderRadius: borderRadius.lg,
            border: `2px dashed ${colors.border.subtle}`,
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: spacing.md }}>💬</div>
          <div
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.medium,
            }}
          >
            No comments yet
          </div>
          <div
            style={{ fontSize: typography.fontSize.sm, marginTop: spacing.xs }}
          >
            Be the first to comment!
          </div>
        </div>
      ) : (
        comments.map(comment => renderComment(comment))
      )}
    </div>
  )
}

export default CommentList

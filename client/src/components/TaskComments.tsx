import React, { useState, useEffect } from 'react'
import { Comment } from '../types'
import CommentList from './CommentList'
import CommentComposer from './CommentComposer'
import Modal from '../design-system/components/Modal/Modal'
import { colors, spacing, typography } from '../design-system/tokens'

declare const confirm: (message: string) => boolean

interface TaskCommentsProps {
  taskId: string
  currentUserId: string
}

const TaskComments: React.FC<TaskCommentsProps> = ({
  taskId,
  currentUserId,
}) => {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [editingComment, setEditingComment] = useState<{
    id: string
    content: string
  } | null>(null)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  useEffect(() => {
    fetchComments()
  }, [taskId])

  const fetchComments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tasks/${taskId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateComment = async (
    content: string,
    attachments: File[],
    parentCommentId?: string
  ) => {
    try {
      const formData = new FormData()
      formData.append('task_id', taskId)
      formData.append('content', content)
      if (parentCommentId) {
        formData.append('parent_comment_id', parentCommentId)
      }
      attachments.forEach(file => {
        formData.append('attachments', file)
      })

      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        await fetchComments()
        setReplyingTo(null)
      }
    } catch (error) {
      console.error('Failed to create comment:', error)
    }
  }

  const handleUpdateComment = async (commentId: string, content: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (response.ok) {
        await fetchComments()
        setEditingComment(null)
      }
    } catch (error) {
      console.error('Failed to update comment:', error)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchComments()
      }
    } catch (error) {
      console.error('Failed to delete comment:', error)
    }
  }

  const handleEdit = (commentId: string, content: string) => {
    setEditingComment({ id: commentId, content })
  }

  const handleReply = (parentCommentId: string) => {
    setReplyingTo(parentCommentId)
  }

  const containerStyles: React.CSSProperties = {
    padding: spacing.lg,
  }

  const headerStyles: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.lg,
    color: colors.gray900,
  }

  if (loading) {
    return (
      <div
        style={{
          ...containerStyles,
          textAlign: 'center',
          color: colors.gray500,
        }}
      >
        Loading comments...
      </div>
    )
  }

  return (
    <div style={containerStyles}>
      <h3 style={headerStyles}>Comments ({comments.length})</h3>

      <div style={{ marginBottom: spacing.lg }}>
        <CommentComposer
          onSubmit={(content, attachments) =>
            handleCreateComment(content, attachments)
          }
          placeholder="Write a comment..."
        />
      </div>

      <CommentList
        comments={comments}
        onEdit={handleEdit}
        onDelete={handleDeleteComment}
        onReply={handleReply}
        currentUserId={currentUserId}
      />

      {editingComment && (
        <Modal
          isOpen={true}
          onClose={() => setEditingComment(null)}
          title="Edit Comment"
          size="md"
        >
          <CommentComposer
            onSubmit={content =>
              handleUpdateComment(editingComment.id, content)
            }
            onCancel={() => setEditingComment(null)}
            initialValue={editingComment.content}
            submitLabel="Save"
            showCancel={true}
          />
        </Modal>
      )}

      {replyingTo && (
        <Modal
          isOpen={true}
          onClose={() => setReplyingTo(null)}
          title="Reply to Comment"
          size="md"
        >
          <CommentComposer
            onSubmit={(content, attachments) =>
              handleCreateComment(content, attachments, replyingTo)
            }
            onCancel={() => setReplyingTo(null)}
            placeholder="Write a reply..."
            submitLabel="Reply"
            showCancel={true}
          />
        </Modal>
      )}
    </div>
  )
}

export default TaskComments

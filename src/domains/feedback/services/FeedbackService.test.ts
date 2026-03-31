import { describe, it, expect, vi, beforeEach } from 'vitest'
import feedbackService from './FeedbackService.js'
import feedbackRepository from '../repositories/FeedbackRepository.js'

vi.mock('../repositories/FeedbackRepository.js', () => ({
  default: {
    create: vi.fn(),
    findById: vi.fn(),
    list: vi.fn(),
    updateStatus: vi.fn(),
  },
}))

const mockCreate = feedbackRepository.create as ReturnType<typeof vi.fn>
const mockFindById = feedbackRepository.findById as ReturnType<typeof vi.fn>
const mockList = feedbackRepository.list as ReturnType<typeof vi.fn>
const mockUpdateStatus = feedbackRepository.updateStatus as ReturnType<
  typeof vi.fn
>

describe('FeedbackService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('submitFeedback', () => {
    it('should submit feedback successfully', async () => {
      const mockFeedback = {
        id: 'feedback-123',
        workspace_id: 'workspace-123',
        category: 'bug' as const,
        description: 'Test bug',
        severity: 'high' as const,
        created_at: new Date(),
        updated_at: new Date(),
      }
      mockCreate.mockResolvedValue(mockFeedback)

      const result = await feedbackService.submitFeedback({
        workspace_id: 'workspace-123',
        category: 'bug',
        description: 'Test bug',
        severity: 'high',
      })

      expect(result.success).toBe(true)
      expect(result.feedbackId).toBe('feedback-123')
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          workspace_id: 'workspace-123',
          category: 'bug',
          description: 'Test bug',
        })
      )
    })

    it('should throw error when description is empty', async () => {
      await expect(
        feedbackService.submitFeedback({
          workspace_id: 'workspace-123',
          category: 'bug',
          description: '',
        })
      ).rejects.toThrow('Description is required')
    })

    it('should throw error when description exceeds max length', async () => {
      const longDescription = 'a'.repeat(5001)
      await expect(
        feedbackService.submitFeedback({
          workspace_id: 'workspace-123',
          category: 'bug',
          description: longDescription,
        })
      ).rejects.toThrow('Description exceeds maximum length')
    })

    it('should throw error for invalid category', async () => {
      await expect(
        feedbackService.submitFeedback({
          workspace_id: 'workspace-123',
          category: 'invalid' as any,
          description: 'Test',
        })
      ).rejects.toThrow('Invalid category')
    })

    it('should accept valid categories', async () => {
      mockCreate.mockResolvedValue({
        id: 'feedback-123',
        workspace_id: 'workspace-123',
        category: 'bug' as const,
        description: 'Test',
        severity: 'medium' as const,
        created_at: new Date(),
        updated_at: new Date(),
      })

      for (const category of ['bug', 'confusion', 'feature_request']) {
        await feedbackService.submitFeedback({
          workspace_id: 'workspace-123',
          category: category as any,
          description: 'Test',
        })
        expect(mockCreate).toHaveBeenCalled()
      }
    })
  })

  describe('getFeedback', () => {
    it('should return feedback when found', async () => {
      const mockFeedback = {
        id: 'feedback-123',
        workspace_id: 'workspace-123',
        category: 'bug' as const,
        description: 'Test',
        severity: 'medium' as const,
        created_at: new Date(),
        updated_at: new Date(),
      }
      mockFindById.mockResolvedValue(mockFeedback)

      const result = await feedbackService.getFeedback(
        'feedback-123',
        'workspace-123'
      )
      expect(result).toEqual(mockFeedback)
    })

    it('should throw error when feedback not found', async () => {
      mockFindById.mockResolvedValue(null)

      await expect(
        feedbackService.getFeedback('non-existent', 'workspace-123')
      ).rejects.toThrow('Feedback not found')
    })
  })

  describe('listFeedback', () => {
    it('should list feedback with pagination', async () => {
      mockList.mockResolvedValue({
        data: [],
        total: 0,
      })

      const result = await feedbackService.listFeedback('workspace-123', {
        limit: 50,
        offset: 0,
      })

      expect(result.data).toEqual([])
      expect(result.total).toBe(0)
      expect(result.page).toBe(1)
    })

    it('should filter by category', async () => {
      mockList.mockResolvedValue({
        data: [],
        total: 0,
      })

      await feedbackService.listFeedback('workspace-123', {
        category: 'bug',
        limit: 50,
        offset: 0,
      })

      expect(mockList).toHaveBeenCalledWith(
        'workspace-123',
        expect.objectContaining({ category: 'bug' })
      )
    })
  })

  describe('updateFeedbackStatus', () => {
    it('should update status successfully', async () => {
      const mockFeedback = {
        id: 'feedback-123',
        workspace_id: 'workspace-123',
        category: 'bug' as const,
        description: 'Test',
        severity: 'medium' as const,
        status: 'reviewed' as const,
        created_at: new Date(),
        updated_at: new Date(),
      }
      mockUpdateStatus.mockResolvedValue(mockFeedback)

      const result = await feedbackService.updateFeedbackStatus(
        'feedback-123',
        'workspace-123',
        'user-123',
        'reviewed',
        'Looking into it'
      )

      expect(result.status).toBe('reviewed')
      expect(mockUpdateStatus).toHaveBeenCalledWith(
        'feedback-123',
        'workspace-123',
        'reviewed',
        'user-123',
        'Looking into it'
      )
    })

    it('should throw error for invalid status', async () => {
      await expect(
        feedbackService.updateFeedbackStatus(
          'feedback-123',
          'workspace-123',
          'user-123',
          'invalid_status'
        )
      ).rejects.toThrow('Invalid status')
    })

    it('should throw error when feedback not found', async () => {
      mockUpdateStatus.mockResolvedValue(null)

      await expect(
        feedbackService.updateFeedbackStatus(
          'non-existent',
          'workspace-123',
          'user-123',
          'reviewed'
        )
      ).rejects.toThrow('Feedback not found')
    })
  })
})

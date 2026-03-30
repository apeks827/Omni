import { describe, it, expect, vi, beforeEach } from 'vitest'
import reviewService, {
  ReviewService,
} from '../../services/review/review.service.js'

vi.mock('../../config/database.js', () => ({
  query: vi.fn(),
}))

const { query } = await import('../../config/database.js')

const mockResult = (rows: unknown[]) => ({
  rows,
  command: '',
  rowCount: rows.length,
  oid: 0,
  fields: [],
})

describe('ReviewService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createReviewTask', () => {
    it('should create a review task with pending status', async () => {
      const mockReviewTask = {
        id: 'review-1',
        source_task_id: 'task-1',
        reviewer_agent_id: 'agent-1',
        review_status: 'pending',
        workspace_id: 'ws-1',
      }

      vi.mocked(query).mockResolvedValueOnce(mockResult([mockReviewTask]))

      const result = await reviewService.createReviewTask({
        workspace_id: 'ws-1',
        source_task_id: 'task-1',
        reviewer_agent_id: 'agent-1',
      })

      expect(result).toEqual(mockReviewTask)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO review_tasks'),
        ['ws-1', 'task-1', 'agent-1']
      )
    })

    it('should insert with correct column order', async () => {
      vi.mocked(query).mockResolvedValueOnce(mockResult([]))

      await reviewService.createReviewTask({
        workspace_id: 'ws-1',
        source_task_id: 'task-1',
        reviewer_agent_id: 'agent-1',
      })

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining(
          'workspace_id, source_task_id, reviewer_agent_id'
        ),
        expect.any(Array)
      )
    })
  })

  describe('getReviewTask', () => {
    it('should return review task for source task', async () => {
      const mockReview = {
        id: 'review-1',
        source_task_id: 'task-1',
        review_status: 'pending',
      }

      vi.mocked(query).mockResolvedValueOnce(mockResult([mockReview]))

      const result = await reviewService.getReviewTask('task-1', 'ws-1')

      expect(result).toEqual(mockReview)
    })

    it('should return null when no review found', async () => {
      vi.mocked(query).mockResolvedValueOnce(mockResult([]))

      const result = await reviewService.getReviewTask('task-none', 'ws-1')

      expect(result).toBeNull()
    })
  })

  describe('updateReviewStatus', () => {
    it('should update review to approved', async () => {
      const mockReview = {
        id: 'review-1',
        review_status: 'approved',
        review_comment: 'Looks good',
      }

      vi.mocked(query).mockResolvedValueOnce(mockResult([mockReview]))

      const result = await reviewService.updateReviewStatus(
        'review-1',
        'ws-1',
        'approved',
        'Looks good'
      )

      expect(result.review_status).toBe('approved')
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE review_tasks'),
        ['approved', 'Looks good', 'review-1', 'ws-1']
      )
    })

    it('should update review to revise', async () => {
      const mockReview = {
        id: 'review-1',
        review_status: 'revise',
        review_comment: 'Needs changes',
      }

      vi.mocked(query).mockResolvedValueOnce(mockResult([mockReview]))

      const result = await reviewService.updateReviewStatus(
        'review-1',
        'ws-1',
        'revise',
        'Needs changes'
      )

      expect(result.review_status).toBe('revise')
    })

    it('should throw error when review not found', async () => {
      vi.mocked(query).mockResolvedValueOnce(mockResult([]))

      await expect(
        reviewService.updateReviewStatus('review-none', 'ws-1', 'approved')
      ).rejects.toThrow('Review task with id review-none not found')
    })
  })

  describe('triggerReviewForTask', () => {
    it('should return null when no template matches', async () => {
      vi.mocked(query).mockResolvedValueOnce(mockResult([]))

      const result = await reviewService.triggerReviewForTask(
        {
          id: 'task-1',
          status: 'in_progress',
          project_id: 'proj-1',
          goal_id: 'goal-1',
        },
        'ws-1'
      )

      expect(result).toBeNull()
    })

    it('should return existing pending review if one exists', async () => {
      const existingReview = {
        id: 'review-existing',
        source_task_id: 'task-1',
        review_status: 'pending',
      }

      vi.mocked(query)
        .mockResolvedValueOnce(mockResult([{ reviewer_agent_id: 'agent-1' }]))
        .mockResolvedValueOnce(mockResult([existingReview]))

      const result = await reviewService.triggerReviewForTask(
        {
          id: 'task-1',
          status: 'in_progress',
          project_id: 'proj-1',
          goal_id: 'goal-1',
        },
        'ws-1'
      )

      expect(result).toEqual(existingReview)
    })

    it('should create new review task when no existing pending review', async () => {
      vi.mocked(query)
        .mockResolvedValueOnce(mockResult([{ reviewer_agent_id: 'agent-1' }]))
        .mockResolvedValueOnce(mockResult([]))
        .mockResolvedValueOnce(
          mockResult([
            {
              id: 'review-new',
              source_task_id: 'task-1',
              review_status: 'pending',
            },
          ])
        )

      const result = await reviewService.triggerReviewForTask(
        {
          id: 'task-1',
          status: 'in_progress',
          project_id: 'proj-1',
          goal_id: 'goal-1',
        },
        'ws-1'
      )

      expect(result?.id).toBe('review-new')
    })
  })

  describe('handleReviewDecision', () => {
    it('should approve task and update source task status', async () => {
      const reviewTask = {
        id: 'review-1',
        source_task_id: 'task-1',
        review_status: 'approved',
      }

      const template = {
        approved_status: 'completed',
        revise_status: 'in_progress',
      }

      const updatedTask = {
        id: 'task-1',
        status: 'completed',
      }

      vi.mocked(query)
        .mockResolvedValueOnce(mockResult([reviewTask]))
        .mockResolvedValueOnce(mockResult([template]))
        .mockResolvedValueOnce(mockResult([updatedTask]))

      const result = await reviewService.handleReviewDecision(
        'review-1',
        'ws-1',
        'approved'
      )

      expect(result.reviewTask.review_status).toBe('approved')
      expect(result.updatedSourceTask.status).toBe('completed')
    })

    it('should revise task and set status to revise_status', async () => {
      const reviewTask = {
        id: 'review-1',
        source_task_id: 'task-1',
        review_status: 'revise',
      }

      const template = {
        approved_status: 'completed',
        revise_status: 'in_progress',
      }

      const updatedTask = {
        id: 'task-1',
        status: 'in_progress',
      }

      vi.mocked(query)
        .mockResolvedValueOnce(mockResult([reviewTask]))
        .mockResolvedValueOnce(mockResult([template]))
        .mockResolvedValueOnce(mockResult([updatedTask]))

      const result = await reviewService.handleReviewDecision(
        'review-1',
        'ws-1',
        'revise',
        'Please fix the edge cases'
      )

      expect(result.reviewTask.review_status).toBe('revise')
      expect(result.updatedSourceTask.status).toBe('in_progress')
    })
  })

  describe('getPendingReviewsForAgent', () => {
    it('should return pending reviews for agent', async () => {
      const mockReviews = [
        { id: 'review-1', task_title: 'Task 1', task_status: 'in_review' },
        { id: 'review-2', task_title: 'Task 2', task_status: 'in_review' },
      ]

      vi.mocked(query).mockResolvedValueOnce(mockResult(mockReviews))

      const result = await reviewService.getPendingReviewsForAgent(
        'agent-1',
        'ws-1'
      )

      expect(result).toHaveLength(2)
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE rt.reviewer_agent_id'),
        ['agent-1', 'ws-1']
      )
    })

    it('should return empty array when no pending reviews', async () => {
      vi.mocked(query).mockResolvedValueOnce(mockResult([]))

      const result = await reviewService.getPendingReviewsForAgent(
        'agent-new',
        'ws-1'
      )

      expect(result).toHaveLength(0)
    })
  })
})

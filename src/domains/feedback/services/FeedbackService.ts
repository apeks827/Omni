import feedbackRepository, {
  UserFeedback,
  CreateFeedbackData,
  FeedbackFilters,
} from '../repositories/FeedbackRepository.js'
import { AppError, ErrorCodes } from '../../../utils/errors.js'

class FeedbackService {
  async submitFeedback(
    data: CreateFeedbackData
  ): Promise<{ success: boolean; feedbackId: string; message: string }> {
    if (!data.description || data.description.trim().length === 0) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Description is required',
        {},
        400
      )
    }

    if (data.description.length > 5000) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Description exceeds maximum length of 5000 characters',
        {},
        400
      )
    }

    const validCategories = ['bug', 'confusion', 'feature_request']
    if (!validCategories.includes(data.category)) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid category. Must be one of: bug, confusion, feature_request',
        {},
        400
      )
    }

    const feedback = await feedbackRepository.create({
      ...data,
      description: data.description.trim(),
    })

    return {
      success: true,
      feedbackId: feedback.id,
      message: 'Feedback submitted successfully',
    }
  }

  async getFeedback(id: string, workspaceId: string): Promise<UserFeedback> {
    const feedback = await feedbackRepository.findById(id, workspaceId)
    if (!feedback) {
      throw new AppError(
        ErrorCodes.NOT_FOUND,
        'Feedback not found',
        { feedback_id: id },
        404
      )
    }
    return feedback
  }

  async listFeedback(
    workspaceId: string,
    filters: FeedbackFilters
  ): Promise<{
    data: UserFeedback[]
    total: number
    page: number
    limit: number
  }> {
    const page = Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1
    const result = await feedbackRepository.list(workspaceId, filters)
    return {
      ...result,
      page,
      limit: filters.limit || 50,
    }
  }

  async updateFeedbackStatus(
    id: string,
    workspaceId: string,
    userId: string,
    status: string,
    reviewerNotes?: string
  ): Promise<UserFeedback> {
    const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed']
    if (!validStatuses.includes(status)) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid status. Must be one of: pending, reviewed, resolved, dismissed',
        {},
        400
      )
    }

    const feedback = await feedbackRepository.updateStatus(
      id,
      workspaceId,
      status,
      userId,
      reviewerNotes
    )

    if (!feedback) {
      throw new AppError(
        ErrorCodes.NOT_FOUND,
        'Feedback not found',
        { feedback_id: id },
        404
      )
    }

    return feedback
  }
}

export default new FeedbackService()

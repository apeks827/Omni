import errorRepository from '../repositories/error.repository.js'
import { AppError, ErrorCodes } from '../../../utils/errors.js'

interface ErrorFilters {
  layer?: string
  severity?: string
  resolved?: boolean
  limit?: number
}

class ErrorService {
  async listErrors(filters: ErrorFilters): Promise<any[]> {
    return errorRepository.findAll(filters)
  }

  async resolveError(id: string): Promise<any> {
    const resolved = await errorRepository.resolve(id)

    if (!resolved) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Error event not found', {}, 404)
    }

    return resolved
  }

  async getErrorsByCorrelationId(correlationId: string): Promise<any[]> {
    return errorRepository.findByCorrelationId(correlationId)
  }
}

export default new ErrorService()

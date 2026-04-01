import labelRepository from '../repositories/label.repository.js'
import { AppError, ErrorCodes } from '../../../utils/errors.js'

class LabelService {
  async listLabels(workspaceId: string): Promise<any[]> {
    return labelRepository.findAll(workspaceId)
  }

  async getLabelById(id: string, workspaceId: string): Promise<any> {
    const label = await labelRepository.findById(id, workspaceId)

    if (!label) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Label not found', {}, 404)
    }

    return label
  }

  async createLabel(
    name: string,
    color: string | undefined,
    projectId: string | undefined,
    workspaceId: string
  ): Promise<any> {
    if (projectId) {
      const projectExists = await labelRepository.projectExists(
        projectId,
        workspaceId
      )
      if (!projectExists) {
        throw new AppError(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid project_id for workspace',
          {},
          400
        )
      }
    }

    return labelRepository.create(name, color, projectId, workspaceId)
  }

  async updateLabel(
    id: string,
    name: string,
    color: string | undefined,
    projectId: string | undefined,
    workspaceId: string
  ): Promise<any> {
    if (projectId) {
      const projectExists = await labelRepository.projectExists(
        projectId,
        workspaceId
      )
      if (!projectExists) {
        throw new AppError(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid project_id for workspace',
          {},
          400
        )
      }
    }

    const label = await labelRepository.update(
      id,
      name,
      color,
      projectId,
      workspaceId
    )

    if (!label) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Label not found', {}, 404)
    }

    return label
  }

  async deleteLabel(id: string, workspaceId: string): Promise<void> {
    const deleted = await labelRepository.delete(id, workspaceId)

    if (!deleted) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Label not found', {}, 404)
    }
  }
}

export default new LabelService()

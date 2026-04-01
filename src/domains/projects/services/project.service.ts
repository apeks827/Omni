import projectRepository from '../repositories/project.repository.js'
import { AppError, ErrorCodes } from '../../../utils/errors.js'

class ProjectService {
  async listProjects(workspaceId: string): Promise<any[]> {
    return projectRepository.findAll(workspaceId)
  }

  async getProjectById(id: string, workspaceId: string): Promise<any> {
    const project = await projectRepository.findById(id, workspaceId)

    if (!project) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Project not found', {}, 404)
    }

    return project
  }

  async createProject(
    name: string,
    description: string | undefined,
    userId: string,
    workspaceId: string
  ): Promise<any> {
    return projectRepository.create(name, description, userId, workspaceId)
  }

  async updateProject(
    id: string,
    name: string,
    description: string | undefined,
    workspaceId: string
  ): Promise<any> {
    const project = await projectRepository.update(
      id,
      name,
      description,
      workspaceId
    )

    if (!project) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Project not found', {}, 404)
    }

    return project
  }

  async deleteProject(id: string, workspaceId: string): Promise<void> {
    const deleted = await projectRepository.delete(id, workspaceId)

    if (!deleted) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Project not found', {}, 404)
    }
  }
}

export default new ProjectService()

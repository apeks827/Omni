# Layered Architecture: Router → Service → Repository

## Overview

Implement clean separation of concerns across Router → Service → Repository layers for the Omni task manager backend.

## Current State Analysis

### Problems Identified

1. **Routes contain SQL queries** (src/routes/tasks.ts:50-74, src/routes/projects.ts:30-33)
   - Direct database access in HTTP handlers
   - Business logic mixed with HTTP concerns
   - Difficult to test and reuse logic

2. **No service layer**
   - Business rules scattered across routes
   - No coordination point for multi-repository operations
   - Handoff service exists but isolated (src/services/handoff/)

3. **No repository layer**
   - SQL queries duplicated across routes
   - No abstraction for data access patterns
   - Hard to mock for testing

## Target Architecture

### Layer Responsibilities

**Router Layer** (src/routes/)

- HTTP request/response handling
- Input validation (already using middleware)
- Authentication/authorization checks
- Call service methods
- Map service results to HTTP responses
- **NO SQL, NO business logic**

**Service Layer** (src/domains/{domain}/services/)

- Business rule enforcement
- Transaction coordination
- Multi-repository orchestration
- Domain event handling
- **NO SQL, NO HTTP concerns**

**Repository Layer** (src/domains/{domain}/repositories/)

- SQL query execution
- Result mapping to domain models
- Database-specific optimizations
- **NO business logic, NO HTTP concerns**

### Directory Structure

```
src/
├── routes/              # HTTP layer (existing)
│   ├── tasks.ts
│   ├── projects.ts
│   └── auth.ts
├── domains/             # NEW: Business domains
│   ├── tasks/
│   │   ├── services/
│   │   │   └── task.service.ts
│   │   ├── repositories/
│   │   │   └── task.repository.ts
│   │   └── types.ts
│   ├── projects/
│   │   ├── services/
│   │   │   └── project.service.ts
│   │   ├── repositories/
│   │   │   └── project.repository.ts
│   │   └── types.ts
│   └── users/
│       ├── services/
│       │   └── user.service.ts
│       ├── repositories/
│       │   └── user.repository.ts
│       └── types.ts
├── models/              # Shared type definitions
├── middleware/          # HTTP middleware
├── config/              # Configuration
└── utils/               # Shared utilities
```

## Implementation Plan

### Phase 1: Create Repository Layer (Foundation)

**1.1 Create base repository interface**

- Define common CRUD operations
- Establish query parameter patterns
- Set up connection pooling interface

**1.2 Implement TaskRepository**

- Extract all SQL from src/routes/tasks.ts
- Methods: findAll, findById, create, update, delete
- Include workspace isolation in all queries

**1.3 Implement ProjectRepository**

- Extract all SQL from src/routes/projects.ts
- Methods: findAll, findById, create, update, delete
- Include workspace isolation

**1.4 Implement UserRepository**

- Extract user-related queries
- Support workspace validation

### Phase 2: Create Service Layer (Business Logic)

**2.1 Implement TaskService**

- Business rules for task creation/updates
- Validation logic (project_id, assignee_id checks)
- Handoff coordination (integrate existing handoff.service.ts)
- Transaction management for multi-step operations

**2.2 Implement ProjectService**

- Project ownership validation
- Workspace isolation enforcement

**2.3 Implement UserService**

- User validation and lookup
- Workspace membership checks

### Phase 2.5: Dependency Injection Container

Implement a simple DI container for managing service instantiation:

```typescript
// src/di/container.ts
import { Pool } from 'pg'
import { TaskRepository } from '../domains/tasks/repositories/task.repository.js'
import { ProjectRepository } from '../domains/projects/repositories/project.repository.js'
import { UserRepository } from '../domains/users/repositories/user.repository.js'
import { TaskService } from '../domains/tasks/services/task.service.js'
import { ProjectService } from '../domains/projects/services/project.service.js'
import { UserService } from '../domains/users/services/user.service.js'

interface Container {
  pool: Pool
  taskRepository: TaskRepository
  projectRepository: ProjectRepository
  userRepository: UserRepository
  taskService: TaskService
  projectService: ProjectService
  userService: UserService
}

function createContainer(config: { connectionString: string }): Container {
  const pool = new Pool({
    connectionString: config.connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  })

  const taskRepository = new TaskRepository(pool)
  const projectRepository = new ProjectRepository(pool)
  const userRepository = new UserRepository(pool)

  const taskService = new TaskService(
    taskRepository,
    projectRepository,
    userRepository
  )
  const projectService = new ProjectService(projectRepository)
  const userService = new UserService(userRepository)

  return {
    pool,
    taskRepository,
    projectRepository,
    userRepository,
    taskService,
    projectService,
    userService,
  }
}

export const container = createContainer({
  connectionString: process.env.DATABASE_URL!,
})
```

**Usage in routes:**

```typescript
import { container } from '../di/container.js'

router.get('/', async (req: AuthRequest, res: Response) => {
  const tasks = await container.taskService.getTasks(req.workspaceId, req.query)
  res.json(tasks)
})
```

**Benefits:**

- Centralized dependency configuration
- Single pool instance shared across repositories
- Easy to mock for testing (inject test container)
- Clear dependency graph visible at container creation

### Phase 3: Refactor Routes (HTTP Layer)

**3.1 Refactor src/routes/tasks.ts**

- Remove all SQL queries
- Remove business logic
- Call TaskService methods
- Keep only HTTP concerns (status codes, response formatting)

**3.2 Refactor src/routes/projects.ts**

- Remove all SQL queries
- Call ProjectService methods
- Simplify to pure HTTP handling

**3.3 Refactor src/routes/auth.ts**

- Integrate UserService
- Remove direct database access

### Phase 4: Testing & Validation

**4.1 Unit tests**

- Repository layer: Mock database connections
- Service layer: Mock repositories
- Route layer: Mock services

**4.2 Integration tests**

- Verify end-to-end flows
- Ensure existing tests pass
- Add new test coverage

**4.3 Performance validation**

- Ensure <100ms task creation (p95)
- Ensure <50ms task retrieval (p95)
- No regression in existing metrics

## Example Implementation

### TaskRepository (src/domains/tasks/repositories/task.repository.ts)

```typescript
import { Pool } from 'pg'
import { Task } from '../../../models/Task.js'

export class TaskRepository {
  constructor(private pool: Pool) {}

  async findAll(
    workspaceId: string,
    filters?: {
      status?: string
      priority?: string
      project_id?: string
    }
  ): Promise<Task[]> {
    let queryText = 'SELECT * FROM tasks WHERE workspace_id = $1'
    const params: string[] = [workspaceId]
    let paramIndex = 2

    if (filters?.status) {
      queryText += ` AND status = $${paramIndex}`
      params.push(filters.status)
      paramIndex++
    }

    if (filters?.priority) {
      queryText += ` AND priority = $${paramIndex}`
      params.push(filters.priority)
      paramIndex++
    }

    if (filters?.project_id) {
      queryText += ` AND project_id = $${paramIndex}`
      params.push(filters.project_id)
      paramIndex++
    }

    queryText += ' ORDER BY created_at DESC'

    const result = await this.pool.query(queryText, params)
    return result.rows
  }

  async findById(id: string, workspaceId: string): Promise<Task | null> {
    const result = await this.pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND workspace_id = $2',
      [id, workspaceId]
    )
    return result.rows[0] || null
  }

  async create(
    task: Omit<Task, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Task> {
    const result = await this.pool.query(
      'INSERT INTO tasks (title, description, type, status, priority, context, project_id, assignee_id, creator_id, workspace_id, due_date, estimated_duration) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
      [
        task.title,
        task.description,
        task.type || 'task',
        task.status || 'pending',
        task.priority || 'medium',
        task.context ? JSON.stringify(task.context) : null,
        task.project_id,
        task.assignee_id,
        task.creator_id,
        task.workspace_id,
        task.due_date,
        task.estimated_duration,
      ]
    )
    return result.rows[0]
  }

  async update(
    id: string,
    workspaceId: string,
    updates: Partial<Task>
  ): Promise<Task | null> {
    const result = await this.pool.query(
      'UPDATE tasks SET title = $1, description = $2, type = $3, status = $4, priority = $5, context = $6, project_id = $7, assignee_id = $8, due_date = $9, updated_at = NOW() WHERE id = $10 AND workspace_id = $11 RETURNING *',
      [
        updates.title,
        updates.description,
        updates.type,
        updates.status,
        updates.priority,
        updates.context ? JSON.stringify(updates.context) : null,
        updates.project_id,
        updates.assignee_id,
        updates.due_date,
        id,
        workspaceId,
      ]
    )
    return result.rows[0] || null
  }

  async delete(id: string, workspaceId: string): Promise<boolean> {
    const result = await this.pool.query(
      'UPDATE tasks SET deleted_at = NOW() WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL RETURNING id',
      [id, workspaceId]
    )
    return result.rows.length > 0
  }
}
```

### TaskService (src/domains/tasks/services/task.service.ts)

```typescript
import { TaskRepository } from '../repositories/task.repository.js'
import { ProjectRepository } from '../../projects/repositories/project.repository.js'
import { UserRepository } from '../../users/repositories/user.repository.js'
import { Task } from '../../../models/Task.js'
import handoffService from '../../../services/handoff/handoff.service.js'

class TaskNotFoundError extends Error {
  constructor(message: string = 'Task not found') {
    super(message)
    this.name = 'TaskNotFoundError'
  }
}

class InvalidProjectError extends Error {
  constructor(message: string = 'Invalid project_id for workspace') {
    super(message)
    this.name = 'InvalidProjectError'
  }
}

class InvalidAssigneeError extends Error {
  constructor(message: string = 'Invalid assignee_id for workspace') {
    super(message)
    this.name = 'InvalidAssigneeError'
  }
}

export class TaskService {
  constructor(
    private taskRepo: TaskRepository,
    private projectRepo: ProjectRepository,
    private userRepo: UserRepository
  ) {}

  async getTasks(
    workspaceId: string,
    filters?: {
      status?: string
      priority?: string
      project_id?: string
    }
  ): Promise<Task[]> {
    return this.taskRepo.findAll(workspaceId, filters)
  }

  async getTaskById(id: string, workspaceId: string): Promise<Task | null> {
    return this.taskRepo.findById(id, workspaceId)
  }

  async createTask(data: {
    title: string
    description?: string
    type?: string
    status?: string
    priority?: string
    project_id?: string
    assignee_id?: string
    creator_id: string
    workspace_id: string
    due_date?: Date
  }): Promise<Task> {
    if (data.project_id) {
      const project = await this.projectRepo.findById(
        data.project_id,
        data.workspace_id
      )
      if (!project) {
        throw new InvalidProjectError()
      }
    }

    if (data.assignee_id) {
      const user = await this.userRepo.findById(
        data.assignee_id,
        data.workspace_id
      )
      if (!user) {
        throw new InvalidAssigneeError()
      }
    }

    return this.taskRepo.create(data as Task)
  }

  async updateTask(
    id: string,
    workspaceId: string,
    updates: Partial<Task>
  ): Promise<Task> {
    if (updates.project_id) {
      const project = await this.projectRepo.findById(
        updates.project_id,
        workspaceId
      )
      if (!project) {
        throw new InvalidProjectError()
      }
    }

    if (updates.assignee_id) {
      const user = await this.userRepo.findById(
        updates.assignee_id,
        workspaceId
      )
      if (!user) {
        throw new InvalidAssigneeError()
      }
    }

    const task = await this.taskRepo.update(id, workspaceId, updates)
    if (!task) {
      throw new TaskNotFoundError()
    }

    if (updates.status) {
      try {
        await handoffService.triggerHandoffsForTask(task, workspaceId)
      } catch (error) {
        console.error('Error triggering handoffs:', error)
      }
    }

    return task
  }

  async deleteTask(id: string, workspaceId: string): Promise<void> {
    const deleted = await this.taskRepo.delete(id, workspaceId)
    if (!deleted) {
      throw new TaskNotFoundError()
    }
  }
}
```

### Refactored Route (src/routes/tasks.ts)

```typescript
import { Router, Response } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { validate, validateParams } from '../middleware/validation.js'
import {
  createTaskSchema,
  updateTaskSchema,
  uuidParamSchema,
} from '../validation/schemas.js'
import { container } from '../di/container.js'
import {
  TaskNotFoundError,
  InvalidProjectError,
  InvalidAssigneeError,
} from '../domains/tasks/services/task.service.js'

const router = Router()
router.use(authenticateToken)

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = req.workspaceId as string
    const { status, priority, project_id } = req.query

    const tasks = await container.taskService.getTasks(workspaceId, {
      status: status as string,
      priority: priority as string,
      project_id: project_id as string,
    })

    res.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get(
  '/:id',
  validateParams(uuidParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const workspaceId = req.workspaceId as string

      const task = await container.taskService.getTaskById(id, workspaceId)
      if (!task) {
        return res.status(404).json({ error: 'Task not found' })
      }

      res.json(task)
    } catch (error) {
      console.error('Error fetching task:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

router.post(
  '/',
  validate(createTaskSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const task = await container.taskService.createTask({
        ...req.body,
        creator_id: req.userId,
        workspace_id: req.workspaceId,
      })

      res.status(201).json(task)
    } catch (error) {
      if (
        error instanceof InvalidProjectError ||
        error instanceof InvalidAssigneeError
      ) {
        return res.status(400).json({ error: error.message })
      }
      console.error('Error creating task:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

router.put(
  '/:id',
  validateParams(uuidParamSchema),
  validate(updateTaskSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const workspaceId = req.workspaceId as string

      const task = await container.taskService.updateTask(
        id,
        workspaceId,
        req.body
      )
      res.json(task)
    } catch (error) {
      if (error instanceof TaskNotFoundError) {
        return res.status(404).json({ error: error.message })
      }
      if (
        error instanceof InvalidProjectError ||
        error instanceof InvalidAssigneeError
      ) {
        return res.status(400).json({ error: error.message })
      }
      console.error('Error updating task:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

router.delete(
  '/:id',
  validateParams(uuidParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const workspaceId = req.workspaceId as string

      await container.taskService.deleteTask(id, workspaceId)
      res.status(204).send()
    } catch (error) {
      if (error instanceof TaskNotFoundError) {
        return res.status(404).json({ error: error.message })
      }
      console.error('Error deleting task:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
```

## Success Criteria

1. **Zero SQL in routes** - All database queries moved to repositories
2. **Zero business logic in repositories** - Only data access code
3. **Service layer coordinates** - All business rules in services
4. **Tests pass** - Existing integration tests continue to work
5. **Performance maintained** - No regression in latency metrics
6. **Code reusability** - Services can be called from multiple routes or background jobs

## Risks & Mitigations

**Risk**: Performance overhead from additional layers
**Mitigation**: Layers are thin abstractions with minimal overhead; validate with benchmarks

**Risk**: Breaking existing functionality during refactor
**Mitigation**: Incremental migration; keep tests running; feature flags if needed

**Risk**: Increased complexity for simple CRUD
**Mitigation**: Complexity is justified by testability, maintainability, and scalability

## Next Steps

1. Review and approve this plan with @FoundingEngineer
2. Create subtasks for each phase
3. Assign implementation to @Backend-Engineer
4. Schedule architecture review after Phase 1 completion

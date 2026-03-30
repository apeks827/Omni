import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character'
    ),
  name: z.string().min(1).max(255),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(1),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character'
    ),
})

export const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
})

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
})

export const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  project_id: z.string().uuid().optional(),
  assignee_id: z.string().uuid().optional(),
  due_date: z.string().datetime().optional(),
  label_ids: z.array(z.string().uuid()).optional(),
})

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  project_id: z.string().uuid().optional().nullable(),
  assignee_id: z.string().uuid().optional().nullable(),
  due_date: z.string().datetime().optional().nullable(),
  label_ids: z.array(z.string().uuid()).optional(),
})

export const createLabelSchema = z.object({
  name: z.string().min(1).max(100),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .optional(),
  project_id: z.string().uuid().optional(),
})

export const updateLabelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .optional(),
  project_id: z.string().uuid().optional().nullable(),
})

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
})

export const quickTaskSchema = z.object({
  input: z.string().min(1).max(5000),
})

export const extractResponseSchema = z.object({
  title: z.string().min(1),
  due_date: z.string().datetime().optional(),
  due_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  location: z.string().max(255).optional(),
  category: z.string().max(100).optional(),
  confidence: z.number().min(0).max(1).optional(),
})

export const extractRequestSchema = z.object({
  input: z.string().min(1).max(5000),
})

export const bulkUpdateTaskSchema = z
  .object({
    task_ids: z.array(z.string()).min(1).max(100),
    updates: z
      .object({
        status: z.enum(['todo', 'in_progress', 'done']).optional(),
        priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        project_id: z.string().optional().nullable(),
        label_ids: z.array(z.string()).optional(),
      })
      .optional(),
  })
  .refine(data => data.updates && Object.keys(data.updates).length > 0, {
    message: 'At least one update field is required',
  })

export const bulkDeleteTaskSchema = z.object({
  task_ids: z.array(z.string()).min(1).max(100),
})

export const bulkMoveTaskSchema = z.object({
  task_ids: z.array(z.string()).min(1).max(100),
  project_id: z.string(),
})

export const searchTasksSchema = z.object({
  query: z.string().min(1).max(500),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  project_id: z.string().uuid().optional(),
  label_id: z.string().uuid().optional(),
})

export const searchSuggestionsSchema = z.object({
  prefix: z.string().min(1).max(100),
  limit: z.number().int().min(1).max(20).optional(),
})

export const searchTitlesSchema = z.object({
  prefix: z.string().min(1).max(100),
  limit: z.number().int().min(1).max(50).optional(),
})

export const exportTasksSchema = z.object({
  format: z.enum(['json', 'csv', 'markdown', 'ical']),
  filters: z
    .object({
      status: z.enum(['todo', 'in_progress', 'done']).optional(),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      project_id: z.string().uuid().optional(),
      label_id: z.string().uuid().optional(),
      date_from: z.string().datetime().optional(),
      date_to: z.string().datetime().optional(),
    })
    .optional(),
})

export const importPreviewSchema = z.object({
  data: z.string().min(1),
  format: z.enum(['json', 'csv', 'markdown', 'ical']),
  mapping: z.record(z.string(), z.string()).optional(),
})

export const importTasksSchema = z.object({
  data: z.string().min(1),
  format: z.enum(['json', 'csv', 'markdown', 'ical']),
  mapping: z.record(z.string(), z.string()).optional(),
  options: z
    .object({
      skip_duplicates: z.boolean().optional(),
      update_existing: z.boolean().optional(),
      preserve_ids: z.boolean().optional(),
    })
    .optional(),
})

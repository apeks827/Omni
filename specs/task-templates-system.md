# Task Templates System - Technical Specification

## Overview

Task templates enable users to create reusable task patterns for recurring workflows. Templates support variable substitution, default values, and can include checklists, priority settings, and duration estimates.

## Data Model

### TaskTemplate (new table)

```typescript
interface TaskTemplate {
  id: string // UUID
  workspace_id: string // FK to workspaces.id
  creator_id: string // FK to users.id

  // Template metadata
  name: string // Template name (e.g., "Weekly Report")
  description?: string // Template description
  category?: string // Category (work, personal, projects, etc.)

  // Template content
  title_pattern: string // Title with variables: "Weekly Report - {week_number}"
  description_template?: string // Description with variables

  // Default values
  default_priority: 'low' | 'medium' | 'high' | 'critical'
  default_status:
    | 'pending'
    | 'scheduled'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
  estimated_duration?: number // seconds

  // Template structure
  checklist_items?: string[] // Array of checklist item templates
  variables: TemplateVariable[] // Variable definitions

  // Sharing
  is_public: boolean // Public templates visible to all workspace users
  shared_with_user_ids?: string[] // Specific users with access

  // Usage tracking
  usage_count: number // Times template was used
  last_used_at?: Date

  // Timestamps
  created_at: Date
  updated_at: Date
}
```

### TemplateVariable

```typescript
interface TemplateVariable {
  key: string // Variable name (e.g., "week_number", "project_name")
  type: 'text' | 'date' | 'number' | 'select'
  label: string // Display label for UI
  default_value?: string | number | Date
  required: boolean
  options?: string[] // For select type
  format?: string // For date type (e.g., "YYYY-MM-DD")
}
```

### Updates to Task Model

No changes required to Task model. Templates generate standard tasks.

## Variable Syntax

Templates use `{variable_name}` syntax for substitution:

```
Title: "Weekly Report - {week_number}"
Description: "Report for week {week_number} of {year}\n\nProject: {project_name}"
```

### Built-in Variables

System provides automatic variables:

- `{date}` - Current date (YYYY-MM-DD)
- `{time}` - Current time (HH:MM)
- `{datetime}` - Current datetime (ISO 8601)
- `{week_number}` - Current week number (1-52)
- `{month}` - Current month name
- `{month_number}` - Current month (1-12)
- `{year}` - Current year (YYYY)
- `{day_of_week}` - Day name (Monday, Tuesday, etc.)

### Custom Variables

Users define custom variables in template:

```json
{
  "variables": [
    {
      "key": "project_name",
      "type": "text",
      "label": "Project Name",
      "required": true
    },
    {
      "key": "sprint_number",
      "type": "number",
      "label": "Sprint Number",
      "default_value": 1,
      "required": false
    },
    {
      "key": "priority_level",
      "type": "select",
      "label": "Priority",
      "options": ["low", "medium", "high"],
      "default_value": "medium",
      "required": true
    }
  ]
}
```

## API Contracts

### Templates CRUD

```
POST   /api/templates              Create template
GET    /api/templates              List templates
GET    /api/templates/:id          Get single template
PATCH  /api/templates/:id          Update template
DELETE /api/templates/:id          Delete template
```

#### POST /api/templates

Request:

```json
{
  "name": "Weekly Report",
  "description": "Template for weekly status reports",
  "category": "work",
  "title_pattern": "Weekly Report - Week {week_number}",
  "description_template": "Status report for week {week_number} of {year}",
  "default_priority": "medium",
  "default_status": "pending",
  "estimated_duration": 3600,
  "checklist_items": [
    "Review completed tasks",
    "Document blockers",
    "Plan next week"
  ],
  "variables": [
    {
      "key": "project_name",
      "type": "text",
      "label": "Project Name",
      "required": false
    }
  ],
  "is_public": false
}
```

Response (201):

```json
{
  "id": "uuid",
  "workspace_id": "uuid",
  "creator_id": "uuid",
  "name": "Weekly Report",
  "title_pattern": "Weekly Report - Week {week_number}",
  "variables": [...],
  "usage_count": 0,
  "created_at": "2026-03-30T10:00:00Z"
}
```

#### GET /api/templates

Query params: `category`, `is_public`, `creator_id`, `search`

Response (200):

```json
{
  "templates": [
    {
      "id": "uuid",
      "name": "Weekly Report",
      "category": "work",
      "usage_count": 15,
      "last_used_at": "2026-03-29T14:00:00Z"
    }
  ],
  "total": 10
}
```

### Template Usage

```
POST   /api/templates/:id/instantiate    Create task from template
POST   /api/templates/:id/preview         Preview with variables
POST   /api/tasks/:id/save-as-template    Save task as template
```

#### POST /api/templates/:id/instantiate

Request:

```json
{
  "variables": {
    "project_name": "Omni",
    "week_number": "13"
  },
  "overrides": {
    "priority": "high",
    "due_date": "2026-04-05T17:00:00Z",
    "project_id": "uuid"
  }
}
```

Response (201):

```json
{
  "task": {
    "id": "uuid",
    "title": "Weekly Report - Week 13",
    "description": "Status report for week 13 of 2026\n\nProject: Omni",
    "priority": "high",
    "status": "pending",
    "estimated_duration": 3600,
    "created_at": "2026-03-30T10:00:00Z"
  },
  "template_id": "uuid"
}
```

#### POST /api/templates/:id/preview

Request:

```json
{
  "variables": {
    "project_name": "Omni",
    "week_number": "13"
  }
}
```

Response (200):

```json
{
  "title": "Weekly Report - Week 13",
  "description": "Status report for week 13 of 2026\n\nProject: Omni",
  "checklist_items": [
    "Review completed tasks",
    "Document blockers",
    "Plan next week"
  ]
}
```

#### POST /api/tasks/:id/save-as-template

Request:

```json
{
  "name": "Bug Fix Template",
  "category": "work",
  "extract_variables": true
}
```

Response (201):

```json
{
  "template_id": "uuid",
  "name": "Bug Fix Template",
  "variables": []
}
```

### Template Sharing

```
POST   /api/templates/:id/share          Share with users
DELETE /api/templates/:id/share/:userId  Revoke access
GET    /api/templates/shared              List shared templates
```

#### POST /api/templates/:id/share

Request:

```json
{
  "user_ids": ["uuid1", "uuid2"],
  "make_public": false
}
```

Response (200):

```json
{
  "template_id": "uuid",
  "shared_with": ["uuid1", "uuid2"],
  "is_public": false
}
```

## Variable Substitution Engine

### Substitution Algorithm

```typescript
function substituteVariables(
  template: string,
  variables: Record<string, any>,
  builtInVars: Record<string, any>
): string {
  const allVars = { ...builtInVars, ...variables }

  return template.replace(/\{([^}]+)\}/g, (match, key) => {
    if (key in allVars) {
      return String(allVars[key])
    }
    return match // Keep unresolved variables as-is
  })
}
```

### Built-in Variable Generation

```typescript
function generateBuiltInVariables(): Record<string, string> {
  const now = new Date()

  return {
    date: now.toISOString().split('T')[0],
    time: now.toTimeString().slice(0, 5),
    datetime: now.toISOString(),
    week_number: getWeekNumber(now).toString(),
    month: now.toLocaleString('en-US', { month: 'long' }),
    month_number: (now.getMonth() + 1).toString(),
    year: now.getFullYear().toString(),
    day_of_week: now.toLocaleString('en-US', { weekday: 'long' }),
  }
}
```

### Validation

```typescript
function validateVariables(
  template: TaskTemplate,
  providedVars: Record<string, any>
): ValidationResult {
  const errors: string[] = []

  // Check required variables
  for (const varDef of template.variables) {
    if (varDef.required && !(varDef.key in providedVars)) {
      errors.push(`Missing required variable: ${varDef.key}`)
    }
  }

  // Type validation
  for (const [key, value] of Object.entries(providedVars)) {
    const varDef = template.variables.find(v => v.key === key)
    if (varDef && !validateType(value, varDef.type)) {
      errors.push(`Invalid type for ${key}: expected ${varDef.type}`)
    }
  }

  return { valid: errors.length === 0, errors }
}
```

## Default Templates Library

System provides default templates on workspace creation:

```typescript
const DEFAULT_TEMPLATES = [
  {
    name: 'Weekly Review',
    category: 'personal',
    title_pattern: 'Weekly Review - Week {week_number}',
    description_template: 'Review week {week_number} of {year}',
    default_priority: 'medium',
    checklist_items: [
      'Review completed tasks',
      'Identify wins and challenges',
      'Plan next week priorities',
    ],
  },
  {
    name: 'Bug Fix',
    category: 'work',
    title_pattern: 'Fix: {bug_description}',
    description_template:
      'Bug: {bug_description}\n\nSteps to reproduce:\n1. \n\nExpected behavior:\n\nActual behavior:',
    default_priority: 'high',
    variables: [
      {
        key: 'bug_description',
        type: 'text',
        label: 'Bug Description',
        required: true,
      },
    ],
  },
  {
    name: 'Meeting Notes',
    category: 'work',
    title_pattern: '{meeting_type} - {date}',
    description_template: 'Attendees:\n\nAgenda:\n\nNotes:\n\nAction Items:',
    default_priority: 'medium',
    variables: [
      {
        key: 'meeting_type',
        type: 'select',
        label: 'Meeting Type',
        options: ['Standup', 'Planning', 'Retrospective', '1-on-1'],
        required: true,
      },
    ],
  },
]
```

## File Structure

```
src/
  domains/
    templates/
      routes/
        templates.ts         # Template CRUD
        instantiate.ts       # Template usage
      services/
        TemplateService.ts
        SubstitutionEngine.ts
        DefaultTemplates.ts
      repositories/
        TemplateRepository.ts
      models/
        TaskTemplate.ts
        TemplateVariable.ts
shared/
  types/
    templates.ts            # Shared type definitions
migrations/
  YYYYMMDDHHMMSS_create_task_templates.sql
```

## Database Schema

```sql
CREATE TABLE task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),

  title_pattern TEXT NOT NULL,
  description_template TEXT,

  default_priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  default_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  estimated_duration INTEGER,

  checklist_items TEXT[], -- Array of strings
  variables JSONB NOT NULL DEFAULT '[]',

  is_public BOOLEAN NOT NULL DEFAULT false,
  shared_with_user_ids UUID[],

  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMP,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_priority CHECK (default_priority IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_status CHECK (default_status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled'))
);

CREATE INDEX idx_task_templates_workspace ON task_templates(workspace_id);
CREATE INDEX idx_task_templates_creator ON task_templates(creator_id);
CREATE INDEX idx_task_templates_category ON task_templates(category);
CREATE INDEX idx_task_templates_public ON task_templates(is_public) WHERE is_public = true;
CREATE INDEX idx_task_templates_usage ON task_templates(usage_count DESC);
```

## Validation Schemas

```typescript
export const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  category: z.string().max(100).optional(),
  title_pattern: z.string().min(1).max(500),
  description_template: z.string().max(5000).optional(),
  default_priority: z.enum(['low', 'medium', 'high', 'critical']),
  default_status: z.enum([
    'pending',
    'scheduled',
    'in_progress',
    'completed',
    'cancelled',
  ]),
  estimated_duration: z.number().int().positive().optional(),
  checklist_items: z.array(z.string().max(500)).optional(),
  variables: z.array(
    z.object({
      key: z.string().regex(/^[a-z_][a-z0-9_]*$/),
      type: z.enum(['text', 'date', 'number', 'select']),
      label: z.string().min(1).max(100),
      default_value: z.union([z.string(), z.number(), z.date()]).optional(),
      required: z.boolean(),
      options: z.array(z.string()).optional(),
      format: z.string().optional(),
    })
  ),
  is_public: z.boolean().optional(),
})

export const instantiateTemplateSchema = z.object({
  variables: z.record(z.string(), z.any()),
  overrides: z
    .object({
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      status: z
        .enum(['pending', 'scheduled', 'in_progress', 'completed', 'cancelled'])
        .optional(),
      due_date: z.string().datetime().optional(),
      project_id: z.string().uuid().optional(),
      assignee_id: z.string().uuid().optional(),
    })
    .optional(),
})
```

## Dependencies

- **PostgreSQL**: Template storage (existing)
- **Zod**: Validation (existing)
- No new external dependencies required

## Performance Targets

- Template instantiation: < 100ms
- Template list query: < 200ms
- Variable substitution: < 10ms per template
- Default template seeding: < 500ms on workspace creation

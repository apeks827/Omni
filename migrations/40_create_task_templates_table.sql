CREATE TABLE task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    estimated_duration INTEGER,
    checklist JSONB DEFAULT '[]',
    variables JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_task_templates_user_workspace ON task_templates(user_id, workspace_id);
CREATE INDEX idx_task_templates_created_at ON task_templates(created_at DESC);

COMMENT ON TABLE task_templates IS 'Reusable task templates with variable substitution support';
COMMENT ON COLUMN task_templates.checklist IS 'Array of checklist items as JSON';
COMMENT ON COLUMN task_templates.variables IS 'Template variables like {date}, {week_number}, {project_name}';

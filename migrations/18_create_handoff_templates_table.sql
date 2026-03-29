-- Create handoff_templates table for automated task handoffs
CREATE TABLE IF NOT EXISTS handoff_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    goal_id UUID,
    from_status VARCHAR(50) NOT NULL,
    next_title VARCHAR(255) NOT NULL,
    next_description TEXT,
    assignee_role VARCHAR(100),
    assignee_agent_id UUID,
    auto_mention BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_handoff_templates_workspace_id ON handoff_templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_handoff_templates_project_id ON handoff_templates(project_id);
CREATE INDEX IF NOT EXISTS idx_handoff_templates_from_status ON handoff_templates(from_status);

COMMENT ON TABLE handoff_templates IS 'Templates for automated task handoffs when status changes';

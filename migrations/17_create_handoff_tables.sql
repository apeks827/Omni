CREATE TABLE IF NOT EXISTS handoff_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  goal_id UUID,
  from_status VARCHAR(50) NOT NULL,
  next_title VARCHAR(500) NOT NULL,
  next_description TEXT,
  assignee_role VARCHAR(100),
  assignee_agent_id UUID,
  auto_mention BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  source_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES handoff_templates(id) ON DELETE CASCADE,
  target_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dedupe_key VARCHAR(200) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, dedupe_key)
);

CREATE INDEX idx_handoff_templates_workspace ON handoff_templates(workspace_id);
CREATE INDEX idx_handoff_templates_project ON handoff_templates(project_id);
CREATE INDEX idx_handoff_templates_status ON handoff_templates(from_status);
CREATE INDEX idx_handoffs_workspace ON handoffs(workspace_id);
CREATE INDEX idx_handoffs_source_task ON handoffs(source_task_id);
CREATE INDEX idx_handoffs_target_task ON handoffs(target_task_id);
CREATE INDEX idx_handoffs_dedupe ON handoffs(dedupe_key);

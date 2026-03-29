-- Create handoffs table to track triggered handoffs
CREATE TABLE IF NOT EXISTS handoffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    source_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES handoff_templates(id) ON DELETE CASCADE,
    target_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dedupe_key VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(dedupe_key, workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_handoffs_workspace_id ON handoffs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_handoffs_source_task_id ON handoffs(source_task_id);
CREATE INDEX IF NOT EXISTS idx_handoffs_target_task_id ON handoffs(target_task_id);
CREATE INDEX IF NOT EXISTS idx_handoffs_template_id ON handoffs(template_id);
CREATE INDEX IF NOT EXISTS idx_handoffs_dedupe_key ON handoffs(dedupe_key);

COMMENT ON TABLE handoffs IS 'Track triggered handoffs to prevent duplicate task creation';

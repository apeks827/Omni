-- Extend handoff_templates for review automation
ALTER TABLE handoff_templates ADD COLUMN IF NOT EXISTS review_template BOOLEAN DEFAULT false;
ALTER TABLE handoff_templates ADD COLUMN IF NOT EXISTS reviewer_agent_id UUID;
ALTER TABLE handoff_templates ADD COLUMN IF NOT EXISTS approved_status VARCHAR(50);
ALTER TABLE handoff_templates ADD COLUMN IF NOT EXISTS revise_status VARCHAR(50);

-- Create review_tasks table for tracking review state
CREATE TABLE IF NOT EXISTS review_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    source_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    reviewer_agent_id UUID NOT NULL,
    review_status VARCHAR(20) DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'revise')),
    review_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_review_tasks_workspace_id ON review_tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_review_tasks_source_task_id ON review_tasks(source_task_id);
CREATE INDEX IF NOT EXISTS idx_review_tasks_reviewer_agent_id ON review_tasks(reviewer_agent_id);
CREATE INDEX IF NOT EXISTS idx_review_tasks_status ON review_tasks(review_status);

COMMENT ON TABLE review_tasks IS 'Tracks review state for tasks requiring Technical Critic approval';

CREATE TABLE IF NOT EXISTS task_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  changes JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_task_activities_task ON task_activities(task_id, created_at DESC);
CREATE INDEX idx_task_activities_workspace ON task_activities(workspace_id, created_at DESC);
CREATE INDEX idx_task_activities_user ON task_activities(user_id, created_at DESC);
CREATE INDEX idx_task_activities_action_type ON task_activities(action_type);

COMMENT ON TABLE task_activities IS 'Activity log for task changes and events';
COMMENT ON COLUMN task_activities.action_type IS 'Action types: task_created, task_updated, task_completed, task_assigned, task_commented, status_changed, priority_changed, etc.';
COMMENT ON COLUMN task_activities.changes IS 'Stores field-level diffs: [{"field": "status", "old": "pending", "new": "in_progress"}]';

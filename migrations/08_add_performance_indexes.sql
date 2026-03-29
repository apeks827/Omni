CREATE INDEX IF NOT EXISTS idx_tasks_workspace_status ON tasks(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_priority ON tasks(workspace_id, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_created ON tasks(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status ON tasks(assignee_id, status) WHERE assignee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status) WHERE project_id IS NOT NULL;

COMMENT ON INDEX idx_tasks_workspace_status IS 'Optimized for filtering tasks by workspace and status (<50ms target)';
COMMENT ON INDEX idx_tasks_workspace_priority IS 'Optimized for filtering tasks by workspace and priority';
COMMENT ON INDEX idx_tasks_workspace_created IS 'Optimized for listing recent tasks by workspace';

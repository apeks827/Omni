ALTER TABLE tasks ADD COLUMN IF NOT EXISTS shared_with_teams JSONB DEFAULT '[]';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_tasks_shared_teams ON tasks USING GIN(shared_with_teams);
CREATE INDEX IF NOT EXISTS idx_tasks_public ON tasks(workspace_id, is_public) WHERE is_public = TRUE;

COMMENT ON COLUMN tasks.shared_with_teams IS 'Array of team IDs this task is shared with';
COMMENT ON COLUMN tasks.share_count IS 'Denormalized count of team shares for quick filtering';

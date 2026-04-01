CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  query TEXT NOT NULL,
  filters JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_saved_searches_user_workspace ON saved_searches(user_id, workspace_id);
CREATE INDEX idx_saved_searches_created_at ON saved_searches(created_at DESC);

COMMENT ON TABLE saved_searches IS 'User-saved search queries with filters';
COMMENT ON COLUMN saved_searches.filters IS 'JSON object containing status, priority, project_id, label_id filters';

CREATE TABLE search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  filters JSONB DEFAULT '{}',
  result_count INTEGER NOT NULL DEFAULT 0,
  searched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_search_history_user_workspace ON search_history(user_id, workspace_id);
CREATE INDEX idx_search_history_searched_at ON search_history(searched_at DESC);

COMMENT ON TABLE search_history IS 'Search query history with result counts, limited to last 20 per user';
COMMENT ON COLUMN search_history.result_count IS 'Number of results returned for this search';

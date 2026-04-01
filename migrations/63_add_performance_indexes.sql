-- Add performance indexes to task_activities and search_history tables
CREATE INDEX IF NOT EXISTS idx_task_activities_action_time ON task_activities(action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_user_time ON search_history(user_id, searched_at DESC);

COMMENT ON INDEX idx_task_activities_action_time IS 'Optimized for activity feed queries by action type and time range';
COMMENT ON INDEX idx_search_history_user_time IS 'Optimized for user search history retrieval';

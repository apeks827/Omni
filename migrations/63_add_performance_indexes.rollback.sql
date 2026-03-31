-- Rollback performance indexes
DROP INDEX IF EXISTS idx_task_activities_action_time;
DROP INDEX IF EXISTS idx_search_history_user_time;

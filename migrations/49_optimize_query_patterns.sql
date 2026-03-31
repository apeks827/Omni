-- Migration: 49_optimize_query_patterns
-- Description: Add indexes to optimize N+1 query patterns and common filter combinations
-- Created: 2026-03-30

-- Index for task_labels table to speed up label lookups (fixes N+1 for findByWorkspace)
CREATE INDEX IF NOT EXISTS idx_task_labels_task_id ON task_labels(task_id);

-- Composite index for task_labels on (task_id, label_id) for faster label attachments
CREATE INDEX IF NOT EXISTS idx_task_labels_composite ON task_labels(task_id, label_id);

-- Index for filtering tasks by due_date (common calendar/scheduling queries)
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;

-- Index for search_vector GIN index (speeds up full-text search)
CREATE INDEX IF NOT EXISTS idx_tasks_search_vector ON tasks USING GIN(search_vector);

-- Index for task activity lookups
CREATE INDEX IF NOT EXISTS idx_task_activities_task_id ON task_activities(task_id);

-- Index for schedule_slots lookups
CREATE INDEX IF NOT EXISTS idx_schedule_slots_task_id ON schedule_slots(task_id);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_user_date ON schedule_slots(user_id, start_time, end_time);

COMMENT ON INDEX idx_task_labels_task_id IS 'Optimizes batch label fetching for N+1 fix in TaskRepository.findByWorkspace';
COMMENT ON INDEX idx_tasks_due_date IS 'Optimizes calendar view and due date filtering';
COMMENT ON INDEX idx_tasks_search_vector IS 'Optimizes full-text search in SearchService';

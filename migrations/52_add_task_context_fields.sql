-- Add context preference fields to tasks table for context-aware task management
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS preferred_device TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS preferred_time_of_day TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS context_tags TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS idx_tasks_preferred_device ON tasks USING GIN (preferred_device);
CREATE INDEX IF NOT EXISTS idx_tasks_preferred_time_of_day ON tasks USING GIN (preferred_time_of_day);
CREATE INDEX IF NOT EXISTS idx_tasks_context_tags ON tasks USING GIN (context_tags);

COMMENT ON COLUMN tasks.preferred_device IS 'Preferred device types for this task: desktop, mobile, tablet';
COMMENT ON COLUMN tasks.preferred_time_of_day IS 'Preferred time of day for this task: morning, afternoon, evening, night';
COMMENT ON COLUMN tasks.context_tags IS 'Custom context tags like computer work, mobile-friendly, evening routine';

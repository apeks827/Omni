-- Add architecture-aligned fields to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'task';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS context JSONB;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_duration INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_duration INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tasks_type_check'
  ) THEN
    ALTER TABLE tasks ADD CONSTRAINT tasks_type_check CHECK (type IN ('task', 'habit', 'routine'));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tasks_status_check'
  ) THEN
    ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled'));
  END IF;
END
$$;

-- Add architecture-aligned fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50),
ADD COLUMN IF NOT EXISTS preferences JSONB;

-- Update comments to reflect new purpose
COMMENT ON TABLE tasks IS 'Task management system - stores all user tasks with type, scheduling context, and architectural fields for AI-first Personal COO';
COMMENT ON TABLE users IS 'User accounts with timezone and preferences for contextual Personal COO experience';
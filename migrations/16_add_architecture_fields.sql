-- Add architecture-aligned fields to tasks table
ALTER TABLE tasks 
ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'task' CHECK (type IN ('task', 'habit', 'routine')),
ADD COLUMN context JSONB,
ADD COLUMN estimated_duration INTEGER,
ADD COLUMN actual_duration INTEGER,
ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE,
ALTER COLUMN status TYPE VARCHAR(20) USING status::VARCHAR(20),
ALTER COLUMN status SET DEFAULT 'pending',
ALTER COLUMN status SET CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled'));

-- Add architecture-aligned fields to users table
ALTER TABLE users
ADD COLUMN timezone VARCHAR(50),
ADD COLUMN preferences JSONB;

-- Update comments to reflect new purpose
COMMENT ON TABLE tasks IS 'Task management system - stores all user tasks with type, scheduling context, and architectural fields for AI-first Personal COO';
COMMENT ON TABLE users IS 'User accounts with timezone and preferences for contextual Personal COO experience';
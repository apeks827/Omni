ALTER TABLE tasks ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'task' CHECK (type IN ('task', 'habit', 'routine'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_duration INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_duration INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS context JSONB;

CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);

CREATE TABLE IF NOT EXISTS priority_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    accepted BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_priority_feedback_task_id ON priority_feedback(task_id);
CREATE INDEX IF NOT EXISTS idx_priority_feedback_user_id ON priority_feedback(user_id);

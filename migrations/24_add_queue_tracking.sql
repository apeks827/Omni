-- Migration: Add agent queue tracking
-- Description: Adds metadata column to tasks for queue routing and agent competency matching

-- Add metadata column to tasks if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE tasks ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add index for queue queries
CREATE INDEX IF NOT EXISTS idx_tasks_queue_lookup 
ON tasks(workspace_id, assignee_id, status) 
WHERE assignee_id IS NULL AND status IN ('todo', 'pending');

-- Add index for metadata-based routing
CREATE INDEX IF NOT EXISTS idx_tasks_metadata_role 
ON tasks USING gin(metadata) 
WHERE assignee_id IS NULL;

-- Add index for priority-based queue ordering
CREATE INDEX IF NOT EXISTS idx_tasks_priority_queue 
ON tasks(workspace_id, priority, created_at) 
WHERE assignee_id IS NULL AND status IN ('todo', 'pending');

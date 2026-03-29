ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS workspace_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS action VARCHAR(50);
ALTER TABLE audit_logs ALTER COLUMN event_type DROP NOT NULL;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES tasks(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(10,2);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(10,2);

COMMENT ON COLUMN audit_logs.workspace_id IS 'Associated workspace for the audit log entry';
COMMENT ON COLUMN audit_logs.entity_type IS 'Type of entity being audited (e.g., task, project, user)';
COMMENT ON COLUMN audit_logs.entity_id IS 'ID of the entity being audited';
COMMENT ON COLUMN audit_logs.action IS 'Action performed (create, update, delete, etc.)';
COMMENT ON COLUMN tasks.parent_id IS 'Supports task hierarchies and subtasks';
COMMENT ON COLUMN tasks.completed_at IS 'Timestamp when task was marked as done';
COMMENT ON COLUMN tasks.estimated_hours IS 'Estimated time to complete task';
COMMENT ON COLUMN tasks.actual_hours IS 'Actual time spent on task';

ALTER TABLE tasks ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

CREATE INDEX idx_tasks_deleted_at ON tasks(deleted_at) WHERE deleted_at IS NULL;

COMMENT ON COLUMN tasks.deleted_at IS 'Soft delete timestamp - NULL means active, non-NULL means deleted';

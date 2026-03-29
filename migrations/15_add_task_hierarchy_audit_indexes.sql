CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type_entity_id ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id_created_at ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace_id_created_at ON audit_logs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at) WHERE completed_at IS NOT NULL;

COMMENT ON INDEX idx_audit_logs_entity_type_entity_id IS 'Optimized for fetching audit history for specific entities';
COMMENT ON INDEX idx_audit_logs_user_id_created_at IS 'Optimized for user activity timeline queries';
COMMENT ON INDEX idx_audit_logs_workspace_id_created_at IS 'Optimized for workspace-wide audit log queries';

-- Rollback migration 67: Remove added foreign key constraints

-- Remove foreign key constraints
ALTER TABLE projects 
DROP CONSTRAINT IF EXISTS projects_workspace_id_fkey;

ALTER TABLE labels 
DROP CONSTRAINT IF EXISTS labels_workspace_id_fkey;

COMMENT ON MIGRATION 67_rollback IS 'Rollback of migration 67: Removed added foreign key constraints';
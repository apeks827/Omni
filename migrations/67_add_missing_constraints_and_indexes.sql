-- Add missing foreign key constraints for data integrity

-- Fix missing foreign key for projects.workspace_id
-- Note: workspace_id column exists but has no FK constraint
ALTER TABLE projects 
DROP CONSTRAINT IF EXISTS projects_workspace_id_fkey,
ADD CONSTRAINT projects_workspace_id_fkey 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- Fix missing foreign key for labels.workspace_id
-- Note: workspace_id column exists but has no FK constraint  
ALTER TABLE labels 
DROP CONSTRAINT IF EXISTS labels_workspace_id_fkey,
ADD CONSTRAINT labels_workspace_id_fkey 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

COMMENT ON MIGRATION 67 IS 'Added missing foreign key constraints for data integrity';
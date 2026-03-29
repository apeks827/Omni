-- Add workspace_id to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS workspace_id UUID;
-- Create index for workspace_id
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON projects(workspace_id);

-- Add workspace_id to labels table  
ALTER TABLE labels ADD COLUMN IF NOT EXISTS workspace_id UUID;
-- Create index for workspace_id
CREATE INDEX IF NOT EXISTS idx_labels_workspace_id ON labels(workspace_id);

-- Update existing records to have workspace_id based on owner_id relationship to users
-- This assumes we have a way to link existing projects/labels to users and then to workspaces
-- In a real scenario, you might need to populate these based on existing relationships
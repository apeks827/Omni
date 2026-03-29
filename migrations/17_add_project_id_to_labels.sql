-- Add project_id to labels table for project-scoped labels
ALTER TABLE labels ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_labels_project_id ON labels(project_id);

COMMENT ON COLUMN labels.project_id IS 'Optional project association for labels';

CREATE TABLE IF NOT EXISTS labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7),
    workspace_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_labels_workspace_id ON labels(workspace_id);
CREATE INDEX IF NOT EXISTS idx_labels_name ON labels(name);

COMMENT ON TABLE labels IS 'Labels for categorizing tasks within workspaces';

CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}',
    is_archived BOOLEAN DEFAULT FALSE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_workspace ON teams(workspace_id);
CREATE INDEX IF NOT EXISTS idx_teams_owner ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);
CREATE INDEX IF NOT EXISTS idx_teams_archived ON teams(workspace_id, is_archived) WHERE is_archived = FALSE;

COMMENT ON TABLE teams IS 'Teams for grouping users within a workspace for collaboration and permission management';
COMMENT ON COLUMN teams.settings IS 'Team configuration: { default_role, allow_guest_access, require_approval, etc. }';

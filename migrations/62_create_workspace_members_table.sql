CREATE TYPE workspace_member_role AS ENUM ('owner', 'admin', 'member', 'guest');

CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role workspace_member_role NOT NULL DEFAULT 'member',
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_role ON workspace_members(workspace_id, role);

COMMENT ON TABLE workspace_members IS 'Workspace-level membership with roles for cross-team access control';

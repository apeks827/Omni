CREATE TYPE task_access_role AS ENUM ('owner', 'editor', 'commenter', 'viewer');

CREATE TABLE IF NOT EXISTS task_access_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role task_access_role NOT NULL DEFAULT 'viewer',
    granted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(task_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_task_access_roles_task ON task_access_roles(task_id);
CREATE INDEX IF NOT EXISTS idx_task_access_roles_user ON task_access_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_task_access_roles_role ON task_access_roles(task_id, role);

COMMENT ON TABLE task_access_roles IS 'Per-user granular permissions on tasks beyond workspace/project membership';
COMMENT ON COLUMN task_access_roles.role IS 'Role determines task actions: owner (full control + delete), editor (modify), commenter (add comments), viewer (read-only)';

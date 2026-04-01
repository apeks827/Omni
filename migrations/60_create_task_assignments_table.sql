CREATE TYPE assignment_response AS ENUM ('pending', 'accepted', 'declined');

CREATE TABLE IF NOT EXISTS task_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    response assignment_response NOT NULL DEFAULT 'pending',
    delegation_note TEXT,
    delegated_from UUID REFERENCES users(id) ON DELETE SET NULL,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(task_id)
);

CREATE INDEX IF NOT EXISTS idx_task_assignments_task ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_assigned_by ON task_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_task_assignments_response ON task_assignments(response);

COMMENT ON TABLE task_assignments IS 'Assignment response tracking for tasks with accept/decline workflow';

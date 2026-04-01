CREATE TABLE IF NOT EXISTS task_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    share_mode VARCHAR(20) NOT NULL DEFAULT 'team' CHECK (share_mode IN ('team', 'individual')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(task_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_task_shares_task ON task_shares(task_id);
CREATE INDEX IF NOT EXISTS idx_task_shares_team ON task_shares(team_id);
CREATE INDEX IF NOT EXISTS idx_task_shares_shared_by ON task_shares(shared_by);

COMMENT ON TABLE task_shares IS 'Shared tasks with teams for collaborative access';
COMMENT ON COLUMN task_shares.share_mode IS 'team: share with entire team, individual: personal share (tracked separately)';

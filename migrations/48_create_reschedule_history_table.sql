CREATE TABLE reschedule_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    original_time TIMESTAMP WITH TIME ZONE NOT NULL,
    rescheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT NOT NULL,
    user_response VARCHAR(20) CHECK (user_response IN ('accepted', 'rejected', 'manual', 'pending')),
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reschedule_history_task_id ON reschedule_history(task_id);
CREATE INDEX idx_reschedule_history_user_id ON reschedule_history(user_id);
CREATE INDEX idx_reschedule_history_workspace_id ON reschedule_history(workspace_id);
CREATE INDEX idx_reschedule_history_created_at ON reschedule_history(created_at);
CREATE INDEX idx_reschedule_history_user_response ON reschedule_history(user_response);

COMMENT ON TABLE reschedule_history IS 'Tracks automatic task rescheduling events and user responses for pattern learning';

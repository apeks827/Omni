CREATE TABLE schedule_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'skipped')),
    context_snapshot JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE INDEX idx_schedule_slots_user_id ON schedule_slots(user_id);
CREATE INDEX idx_schedule_slots_task_id ON schedule_slots(task_id);
CREATE INDEX idx_schedule_slots_start_time ON schedule_slots(start_time);
CREATE INDEX idx_schedule_slots_end_time ON schedule_slots(end_time);
CREATE INDEX idx_schedule_slots_status ON schedule_slots(status);
CREATE INDEX idx_schedule_slots_user_time ON schedule_slots(user_id, start_time, end_time);

COMMENT ON TABLE schedule_slots IS 'Scheduled time slots for tasks - supports dynamic scheduling and real-time adaptivity';

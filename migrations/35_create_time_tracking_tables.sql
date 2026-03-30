-- Migration 35: Time Tracking Tables
-- Creates time_entries and timer_states tables for time tracking system

-- ============================================
-- Time Entries Table
-- Stores completed time entries (both manual and from timer sessions)
-- ============================================

CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core relationships
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Timing
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    
    -- Classification
    type VARCHAR(20) NOT NULL DEFAULT 'timer' CHECK (type IN ('manual', 'timer', 'pomodoro')),
    pomodoro_type VARCHAR(20) CHECK (pomodoro_type IN ('work', 'break', 'long_break')),
    
    -- Metadata
    description TEXT,
    source VARCHAR(20) NOT NULL DEFAULT 'client' CHECK (source IN ('client', 'api', 'import')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Timer States Table
-- Persists active timer state for crash recovery and cross-device sync
-- ============================================

CREATE TABLE timer_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core relationships
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL,
    
    -- Timer state
    status VARCHAR(20) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'paused', 'stopped')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    elapsed_seconds INTEGER NOT NULL DEFAULT 0,
    last_tick_at TIMESTAMP WITH TIME ZONE,
    
    -- Pomodoro state
    pomodoro_type VARCHAR(20) DEFAULT 'work' CHECK (pomodoro_type IN ('work', 'break', 'long_break')),
    pomodoro_work_count INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- One active timer per user per workspace at a time
    CONSTRAINT unique_user_workspace_active_timer UNIQUE (user_id, workspace_id)
);

-- ============================================
-- Indexes for time_entries
-- ============================================

-- Primary lookups
CREATE INDEX idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_workspace_id ON time_entries(workspace_id);

-- Date range queries (analytics)
CREATE INDEX idx_time_entries_start_time ON time_entries(start_time);
CREATE INDEX idx_time_entries_end_time ON time_entries(end_time);
CREATE INDEX idx_time_entries_workspace_start ON time_entries(workspace_id, start_time);

-- Type filtering
CREATE INDEX idx_time_entries_type ON time_entries(type);
CREATE INDEX idx_time_entries_pomodoro_type ON time_entries(pomodoro_type);

-- Composite for common analytics queries
CREATE INDEX idx_time_entries_workspace_date ON time_entries(workspace_id, start_time DESC);
CREATE INDEX idx_time_entries_task_date ON time_entries(task_id, start_time DESC);

-- ============================================
-- Indexes for timer_states
-- ============================================

-- Active timer lookup by user
CREATE INDEX idx_timer_states_user_id ON timer_states(user_id);
CREATE INDEX idx_timer_states_workspace_id ON timer_states(workspace_id);
CREATE INDEX idx_timer_states_status ON timer_states(status);

-- Find active timers (non-stopped) per user/workspace
CREATE INDEX idx_timer_states_user_active ON timer_states(user_id, workspace_id) 
    WHERE status != 'stopped';

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE time_entries IS 'Completed time entries for tasks - supports manual, timer, and pomodoro types';
COMMENT ON TABLE timer_states IS 'Active timer state persistence for crash recovery and cross-device sync';

COMMENT ON COLUMN time_entries.duration_seconds IS 'Total duration in seconds';
COMMENT ON COLUMN time_entries.type IS 'Entry type: manual (user-entered), timer (stopped timer), pomodoro (pomodoro session)';
COMMENT ON COLUMN time_entries.pomodoro_type IS 'Pomodoro phase: work, break, or long_break';
COMMENT ON COLUMN time_entries.source IS 'Entry source: client, api, or import';

COMMENT ON COLUMN timer_states.elapsed_seconds IS 'Accumulated time before current pause/resume';
COMMENT ON COLUMN timer_states.last_tick_at IS 'Last server tick timestamp for drift correction';

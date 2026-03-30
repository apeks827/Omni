-- Create goals table
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived', 'cancelled')),
    timeframe_type VARCHAR(20) DEFAULT 'quarter' CHECK (timeframe_type IN ('quarter', 'year', 'custom')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    progress_percentage DECIMAL(5,2) DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_date_range CHECK (start_date < end_date)
);

-- Create key_results table
CREATE TABLE key_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    target_value DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(10,2) DEFAULT 0,
    measurement_type VARCHAR(20) DEFAULT 'numeric' CHECK (measurement_type IN ('numeric', 'percentage', 'boolean')),
    unit VARCHAR(50),
    progress_percentage DECIMAL(5,2) DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_goal_links table
CREATE TABLE task_goal_links (
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    key_result_id UUID REFERENCES key_results(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (task_id, goal_id)
);

-- Create indexes for efficient queries
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goals_timeframe ON goals(timeframe_type);
CREATE INDEX idx_goals_dates ON goals(start_date, end_date);
CREATE INDEX idx_key_results_goal ON key_results(goal_id);
CREATE INDEX idx_task_goal_links_goal ON task_goal_links(goal_id);
CREATE INDEX idx_task_goal_links_task ON task_goal_links(task_id);
CREATE INDEX idx_task_goal_links_kr ON task_goal_links(key_result_id);

-- Add comments
COMMENT ON TABLE goals IS 'Goal/OKR tracking - stores goals with timeframes and progress tracking';
COMMENT ON TABLE key_results IS 'Key Results for goals - measurable targets with progress tracking';
COMMENT ON TABLE task_goal_links IS 'Links tasks to goals and optional key results';

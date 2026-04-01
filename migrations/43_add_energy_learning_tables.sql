CREATE TABLE energy_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pattern_data JSONB NOT NULL,
    confidence_score FLOAT NOT NULL DEFAULT 0.0,
    data_points INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE task_cognitive_loads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    cognitive_load VARCHAR(20) NOT NULL CHECK (cognitive_load IN ('deep_work', 'medium', 'light', 'admin')),
    confidence FLOAT NOT NULL DEFAULT 0.0,
    classified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_energy_patterns_user_id ON energy_patterns(user_id);
CREATE INDEX idx_energy_patterns_confidence ON energy_patterns(confidence_score);
CREATE INDEX idx_task_cognitive_loads_task_id ON task_cognitive_loads(task_id);
CREATE INDEX idx_task_cognitive_loads_load ON task_cognitive_loads(cognitive_load);

COMMENT ON TABLE energy_patterns IS 'Learned user energy patterns for intelligent scheduling';
COMMENT ON TABLE task_cognitive_loads IS 'Cognitive load classification for tasks (deep_work/medium/light/admin)';
COMMENT ON COLUMN energy_patterns.pattern_data IS 'JSONB containing hourly completion rates, peak hours, low energy periods';
COMMENT ON COLUMN energy_patterns.confidence_score IS 'Pattern reliability score (0.0-1.0), must be >0.7 for activation';
COMMENT ON COLUMN energy_patterns.data_points IS 'Number of completed tasks used to build this pattern';

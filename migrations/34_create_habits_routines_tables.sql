CREATE TABLE habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    frequency_type VARCHAR(20) NOT NULL CHECK (frequency_type IN ('daily', 'weekly', 'custom')),
    frequency_value VARCHAR(100),
    preferred_time_start TIME,
    preferred_time_end TIME,
    duration_minutes INTEGER NOT NULL,
    energy_level VARCHAR(20) CHECK (energy_level IN ('low', 'medium', 'high')),
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    time_window VARCHAR(20) CHECK (time_window IN ('morning', 'afternoon', 'evening')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE routine_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE habit_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    skipped BOOLEAN DEFAULT false,
    note TEXT
);

CREATE TABLE routine_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    completed_steps INTEGER DEFAULT 0,
    total_steps INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habits_frequency_type ON habits(frequency_type);
CREATE INDEX idx_routines_user_id ON routines(user_id);
CREATE INDEX idx_routines_time_window ON routines(time_window);
CREATE INDEX idx_routine_steps_routine_id ON routine_steps(routine_id);
CREATE INDEX idx_routine_steps_order ON routine_steps(routine_id, order_index);
CREATE INDEX idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX idx_habit_completions_completed_at ON habit_completions(completed_at);
CREATE INDEX idx_routine_completions_routine_id ON routine_completions(routine_id);
CREATE INDEX idx_routine_completions_scheduled_date ON routine_completions(scheduled_date);

COMMENT ON TABLE habits IS 'User habits with frequency, time preferences, and streak tracking';
COMMENT ON TABLE routines IS 'User routines with time windows and ordered steps';
COMMENT ON TABLE routine_steps IS 'Individual steps within a routine';
COMMENT ON TABLE habit_completions IS 'Habit completion history with skip tracking';
COMMENT ON TABLE routine_completions IS 'Routine completion tracking with step progress';

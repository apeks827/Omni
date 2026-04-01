CREATE TABLE IF NOT EXISTS daily_energy_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  energy_level VARCHAR(10) NOT NULL CHECK (energy_level IN ('low', 'normal', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_energy_levels_user_date ON daily_energy_levels(user_id, date);
CREATE INDEX idx_daily_energy_levels_date ON daily_energy_levels(date);

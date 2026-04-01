ALTER TABLE users ADD COLUMN IF NOT EXISTS energy_pattern JSONB DEFAULT '{"peak_hours": [9, 10, 11, 14, 15, 16], "low_hours": [13, 22, 23, 0]}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS low_energy_mode BOOLEAN DEFAULT false;

COMMENT ON COLUMN users.energy_pattern IS 'User energy patterns: peak_hours (array of hours 0-23), low_hours (array of hours 0-23)';
COMMENT ON COLUMN users.low_energy_mode IS 'When true, prioritize low-effort tasks during peak hours';

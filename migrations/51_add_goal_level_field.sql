-- Add level field to goals table for hierarchy support (company/team/personal)
ALTER TABLE goals ADD COLUMN level VARCHAR(20) DEFAULT 'personal' 
  CHECK (level IN ('company', 'team', 'personal'));

CREATE INDEX idx_goals_level ON goals(level);

COMMENT ON COLUMN goals.level IS 'Goal hierarchy level: company, team, or personal';

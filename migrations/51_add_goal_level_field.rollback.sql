-- Rollback: Remove level field from goals table
DROP INDEX IF EXISTS idx_goals_level;
ALTER TABLE goals DROP COLUMN IF EXISTS level;

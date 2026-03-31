ALTER TABLE tasks DROP COLUMN IF EXISTS shared_with_teams;
ALTER TABLE tasks DROP COLUMN IF EXISTS is_public;
ALTER TABLE tasks DROP COLUMN IF EXISTS share_count;
DROP INDEX IF EXISTS idx_tasks_shared_teams;
DROP INDEX IF EXISTS idx_tasks_public;

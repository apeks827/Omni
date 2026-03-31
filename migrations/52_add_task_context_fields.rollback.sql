ALTER TABLE tasks
DROP COLUMN IF EXISTS preferred_device,
DROP COLUMN IF EXISTS preferred_time_of_day,
DROP COLUMN IF EXISTS context_tags;

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS snoozed_until TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_notifications_snoozed_until ON notifications(user_id, snoozed_until) WHERE snoozed_until IS NOT NULL;

ALTER TABLE users ADD COLUMN last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE INDEX idx_users_last_activity ON users(last_activity_at);

COMMENT ON COLUMN users.last_activity_at IS 'Timestamp of last user activity for session expiration tracking';

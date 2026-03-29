-- Failed login attempts tracking for account lockout
CREATE TABLE failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  attempt_count INT DEFAULT 1,
  locked_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_failed_login_email ON failed_login_attempts(email);
CREATE INDEX idx_failed_login_locked_until ON failed_login_attempts(locked_until);

COMMENT ON TABLE failed_login_attempts IS 'Tracks failed login attempts for brute force protection';
COMMENT ON COLUMN failed_login_attempts.attempt_count IS 'Number of consecutive failed attempts';
COMMENT ON COLUMN failed_login_attempts.locked_until IS 'Account locked until this timestamp (null if not locked)';

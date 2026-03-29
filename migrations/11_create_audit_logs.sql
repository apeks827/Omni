-- Audit logs table for security event tracking
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

COMMENT ON TABLE audit_logs IS 'Security audit trail for authentication and authorization events';
COMMENT ON COLUMN audit_logs.event_type IS 'Event types: login_success, login_failed, password_reset_requested, password_changed, account_locked, etc.';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional event-specific data in JSON format';

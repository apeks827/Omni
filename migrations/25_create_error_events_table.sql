-- Unified error storage for frontend, backend, and orchestration layers
CREATE TABLE error_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_id UUID NOT NULL,
  layer VARCHAR(50) NOT NULL CHECK (layer IN ('frontend', 'backend', 'orchestration')),
  error_type VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  task_id UUID,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'error', 'warning', 'info')),
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_error_events_correlation ON error_events(correlation_id);
CREATE INDEX idx_error_events_layer ON error_events(layer);
CREATE INDEX idx_error_events_type ON error_events(error_type);
CREATE INDEX idx_error_events_user ON error_events(user_id);
CREATE INDEX idx_error_events_created ON error_events(created_at DESC);
CREATE INDEX idx_error_events_severity ON error_events(severity);
CREATE INDEX idx_error_events_resolved ON error_events(resolved) WHERE resolved = FALSE;

COMMENT ON TABLE error_events IS 'Centralized error tracking across all application layers';
COMMENT ON COLUMN error_events.correlation_id IS 'Trace ID for correlating errors across layers';
COMMENT ON COLUMN error_events.layer IS 'Application layer where error occurred';
COMMENT ON COLUMN error_events.context IS 'Additional error context (request data, environment, etc.)';
COMMENT ON COLUMN error_events.severity IS 'Error severity level for prioritization';

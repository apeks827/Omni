CREATE TABLE pattern_update_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    success_count INTEGER NOT NULL DEFAULT 0,
    failure_count INTEGER NOT NULL DEFAULT 0,
    avg_confidence FLOAT NOT NULL DEFAULT 0.0,
    duration_ms INTEGER NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pattern_update_audit_executed_at ON pattern_update_audit_log(executed_at DESC);

COMMENT ON TABLE pattern_update_audit_log IS 'Audit log for daily pattern update job executions';
COMMENT ON COLUMN pattern_update_audit_log.success_count IS 'Number of users successfully updated';
COMMENT ON COLUMN pattern_update_audit_log.failure_count IS 'Number of users that failed to update';
COMMENT ON COLUMN pattern_update_audit_log.avg_confidence IS 'Average confidence score across all updated patterns';
COMMENT ON COLUMN pattern_update_audit_log.duration_ms IS 'Total job execution time in milliseconds';

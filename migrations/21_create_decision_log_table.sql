CREATE TABLE decision_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    decision_type VARCHAR(50) NOT NULL,
    input_data JSONB NOT NULL,
    output_data JSONB NOT NULL,
    explanation TEXT,
    confidence_score NUMERIC(5,4),
    model_version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_decision_log_user_id ON decision_log(user_id);
CREATE INDEX idx_decision_log_decision_type ON decision_log(decision_type);
CREATE INDEX idx_decision_log_created_at ON decision_log(created_at);
CREATE INDEX idx_decision_log_user_type_time ON decision_log(user_id, decision_type, created_at DESC);

COMMENT ON TABLE decision_log IS 'Audit trail for AI scheduling decisions - supports transparency and user explanations';

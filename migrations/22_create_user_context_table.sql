CREATE TABLE user_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    context_type VARCHAR(50) NOT NULL,
    context_data JSONB NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_context_user_id ON user_context(user_id);
CREATE INDEX idx_user_context_type ON user_context(context_type);
CREATE INDEX idx_user_context_recorded_at ON user_context(recorded_at);
CREATE INDEX idx_user_context_user_type_time ON user_context(user_id, context_type, recorded_at DESC);
CREATE INDEX idx_user_context_data ON user_context USING gin(context_data);

COMMENT ON TABLE user_context IS 'Contextual information tracking - location, device, energy levels, and productivity patterns';

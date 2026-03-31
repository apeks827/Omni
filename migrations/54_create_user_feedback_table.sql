-- Migration: Create user feedback table
-- Purpose: Capture user feedback with metadata for product improvement

CREATE TABLE IF NOT EXISTS user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    category VARCHAR(50) NOT NULL CHECK (category IN ('bug', 'confusion', 'feature_request')),
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
    repro_steps TEXT,
    page VARCHAR(255),
    app_version VARCHAR(50),
    environment JSONB,
    screenshot_url VARCHAR(500),
    contact_permission BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_feedback_workspace ON user_feedback(workspace_id);
CREATE INDEX idx_feedback_user ON user_feedback(user_id);
CREATE INDEX idx_feedback_category ON user_feedback(category);
CREATE INDEX idx_feedback_severity ON user_feedback(severity);
CREATE INDEX idx_feedback_status ON user_feedback(status);
CREATE INDEX idx_feedback_created_at ON user_feedback(created_at DESC);

COMMENT ON TABLE user_feedback IS 'User-submitted feedback for product improvement';
COMMENT ON COLUMN user_feedback.category IS 'Feedback type: bug, confusion, or feature_request';
COMMENT ON COLUMN user_feedback.severity IS 'Impact level: low, medium, high';
COMMENT ON COLUMN user_feedback.environment IS 'Device/browser/OS metadata as JSON';

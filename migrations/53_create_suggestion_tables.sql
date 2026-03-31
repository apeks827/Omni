-- Migration: 53_create_suggestion_tables.sql
-- Description: Create suggestion_rules and suggestion_feedback tables for Task Suggestions Engine

BEGIN;

CREATE TABLE IF NOT EXISTS suggestion_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    field VARCHAR(50) NOT NULL,
    pattern VARCHAR(200) NOT NULL,
    value VARCHAR(200) NOT NULL,
    confidence DECIMAL(3,2) DEFAULT 0.80,
    enabled BOOLEAN DEFAULT true,
    category VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_rule_pattern_per_workspace UNIQUE (workspace_id, pattern)
);

CREATE TABLE IF NOT EXISTS suggestion_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    user_id UUID NOT NULL,
    input_text VARCHAR(1000) NOT NULL,
    field VARCHAR(50) NOT NULL,
    suggested_value VARCHAR(200),
    actual_value VARCHAR(200),
    accepted BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suggestion_rules_workspace ON suggestion_rules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_suggestion_rules_field ON suggestion_rules(field);
CREATE INDEX IF NOT EXISTS idx_suggestion_rules_enabled ON suggestion_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_suggestion_feedback_workspace ON suggestion_feedback(workspace_id);
CREATE INDEX IF NOT EXISTS idx_suggestion_feedback_user ON suggestion_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestion_feedback_field ON suggestion_feedback(field);
CREATE INDEX IF NOT EXISTS idx_suggestion_feedback_accepted ON suggestion_feedback(accepted);

COMMIT;

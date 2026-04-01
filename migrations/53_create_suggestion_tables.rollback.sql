-- Rollback: 53_create_suggestion_tables.sql

BEGIN;

DROP INDEX IF EXISTS idx_suggestion_feedback_accepted;
DROP INDEX IF EXISTS idx_suggestion_feedback_field;
DROP INDEX IF EXISTS idx_suggestion_feedback_user;
DROP INDEX IF EXISTS idx_suggestion_feedback_workspace;
DROP INDEX IF EXISTS idx_suggestion_rules_enabled;
DROP INDEX IF EXISTS idx_suggestion_rules_field;
DROP INDEX IF EXISTS idx_suggestion_rules_workspace;
DROP TABLE IF EXISTS suggestion_feedback;
DROP TABLE IF EXISTS suggestion_rules;

COMMIT;

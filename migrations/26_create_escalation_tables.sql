CREATE TABLE IF NOT EXISTS escalation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL,
  escalated_at TIMESTAMP NOT NULL,
  escalation_type VARCHAR(50) NOT NULL,
  target_agent_id UUID,
  reason TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_escalation_log_task_id ON escalation_log(task_id);
CREATE INDEX idx_escalation_log_escalated_at ON escalation_log(escalated_at);

CREATE TABLE IF NOT EXISTS triage_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type VARCHAR(50) NOT NULL,
  tasks_affected INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL,
  executed_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_triage_audit_log_executed_at ON triage_audit_log(executed_at);

CREATE TABLE IF NOT EXISTS issue_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL,
  body TEXT NOT NULL,
  author_agent_id UUID,
  author_user_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_issue_comments_issue_id ON issue_comments(issue_id);
CREATE INDEX idx_issue_comments_created_at ON issue_comments(created_at);

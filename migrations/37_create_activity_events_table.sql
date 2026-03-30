-- Activity Events Table
CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  event_type VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  
  action VARCHAR(50) NOT NULL,
  field_changes JSONB,
  previous_value JSONB,
  new_value JSONB,
  
  metadata JSONB,
  source VARCHAR(50) NOT NULL DEFAULT 'client',
  
  parent_entity_type VARCHAR(50),
  parent_entity_id UUID,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_events_workspace_created ON activity_events(workspace_id, created_at DESC);
CREATE INDEX idx_activity_events_entity ON activity_events(entity_type, entity_id);
CREATE INDEX idx_activity_events_user ON activity_events(user_id);
CREATE INDEX idx_activity_events_event_type ON activity_events(event_type);
CREATE INDEX idx_activity_events_parent ON activity_events(parent_entity_type, parent_entity_id);

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS activity_count INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE;

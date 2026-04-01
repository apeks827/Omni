-- Migration: Add response_time_metrics table
-- Created: 2026-03-30

CREATE TABLE IF NOT EXISTS response_time_metrics (
  id SERIAL PRIMARY KEY,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  user_type VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_response_time_metrics_endpoint ON response_time_metrics(endpoint);
CREATE INDEX idx_response_time_metrics_created_at ON response_time_metrics(created_at);
CREATE INDEX idx_response_time_metrics_endpoint_created ON response_time_metrics(endpoint, created_at);

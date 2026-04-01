CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rolled_back_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

COMMENT ON TABLE schema_migrations IS 'Tracks which database migrations have been applied';

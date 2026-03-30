CREATE TABLE api_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    daily_quota INTEGER NOT NULL DEFAULT 1000,
    daily_used INTEGER NOT NULL DEFAULT 0,
    daily_reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
    weekly_quota INTEGER NOT NULL DEFAULT 5000,
    weekly_used INTEGER NOT NULL DEFAULT 0,
    weekly_reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
    monthly_quota INTEGER NOT NULL DEFAULT 20000,
    monthly_used INTEGER NOT NULL DEFAULT 0,
    monthly_reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_api_quotas_user_id ON api_quotas(user_id);
CREATE INDEX idx_api_quotas_daily_reset ON api_quotas(daily_reset_at);
CREATE INDEX idx_api_quotas_weekly_reset ON api_quotas(weekly_reset_at);
CREATE INDEX idx_api_quotas_monthly_reset ON api_quotas(monthly_reset_at);

CREATE OR REPLACE FUNCTION update_api_quotas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER api_quotas_updated_at
    BEFORE UPDATE ON api_quotas
    FOR EACH ROW
    EXECUTE FUNCTION update_api_quotas_updated_at();

COMMENT ON TABLE api_quotas IS 'API usage quotas tracking per user (daily/weekly/monthly)';
COMMENT ON COLUMN api_quotas.daily_quota IS 'Maximum API requests allowed per day';
COMMENT ON COLUMN api_quotas.daily_used IS 'Current count of API requests used today';
COMMENT ON COLUMN api_quotas.daily_reset_at IS 'Timestamp when daily quota resets';

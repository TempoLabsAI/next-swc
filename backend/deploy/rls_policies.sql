-- RLS policy examples for tenant isolation
-- Run in the target database as a privileged user (e.g., during migration)

-- Note: Ensure all tenant-scoped tables have an organization_id UUID column and indexed.

BEGIN;

-- Enable RLS and create policy for posts
ALTER TABLE IF EXISTS posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS posts_tenant_isolation ON posts
  USING (organization_id = current_setting('app.tenant')::uuid);

-- Enable RLS and create policy for campaigns
ALTER TABLE IF EXISTS campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS campaigns_tenant_isolation ON campaigns
  USING (organization_id = current_setting('app.tenant')::uuid);

-- social_accounts
ALTER TABLE IF EXISTS social_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS social_accounts_tenant_isolation ON social_accounts
  USING (organization_id = current_setting('app.tenant')::uuid);

-- ai_usage_logs
ALTER TABLE IF EXISTS ai_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS ai_usage_logs_tenant_isolation ON ai_usage_logs
  USING (organization_id = current_setting('app.tenant')::uuid);

-- organizations: normally global; do NOT enable RLS on organizations table if it prevents administrative operations

COMMIT;

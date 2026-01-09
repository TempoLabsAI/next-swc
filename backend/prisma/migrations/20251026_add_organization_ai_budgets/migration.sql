-- Add organization_ai_budgets table for AI cost control

CREATE TABLE IF NOT EXISTS organization_ai_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  monthly_budget_cents bigint DEFAULT 0,
  spent_cents bigint DEFAULT 0,
  alert_threshold_percent int DEFAULT 80,
  soft_limit boolean DEFAULT true,
  hard_limit boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_ai_budgets_org ON organization_ai_budgets (organization_id);

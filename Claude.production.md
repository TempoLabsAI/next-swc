# AI-Powered Marketing Automation Platform — Production-Grade Plan

This file is a production-grade augmentation of the original `Claude.md` prompt. It keeps the original functional spec and adds operational, security, DR, tenant-isolation, AI cost-control, CI/CD, monitoring, testing, and rollout guidance. Use this as the canonical implementation plan.

## Summary
- Purpose: turn the design into an enterprise-grade, maintainable, scalable, and secure SaaS product.
- Audience: engineering leads, SRE, security, product owners, and devs implementing the platform.

## Key production additions (top-level)
1. Secrets & configuration management
2. CI/CD and image promotion
3. Infrastructure as code (Terraform + Helm)
4. Backups & Disaster Recovery (DR)
5. Tenant isolation strategy
6. AI cost-control and quota enforcement
7. Monitoring, tracing, and alerting
8. Incident response runbooks
9. Data retention, encryption, and compliance
10. Testing strategy and release gates

---

## 1) Secrets & configuration management
- Use a secrets manager (AWS Secrets Manager / HashiCorp Vault / Google Secret Manager). No secrets in env defaults.
- Use typed, validated configuration at app bootstrap. Validation already referenced in `AppModule` — enforce required secrets and fail-fast in CI/CD when missing.
- Recommended secrets to store: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, ENCRYPTION_KEY, MAIL_API_KEY, SENTRY_DSN, REDIS_URL, CLOUD_STORAGE_CREDENTIALS.
- At runtime, mount minimal secrets via Kubernetes secrets with RBAC access to production namespaces only.

Operational checklist
- [ ] Add secrets store integration into deployment manifests and CI (fetch secrets at deploy time)
- [ ] Add rotation procedures and automation

---

## 2) CI/CD and image promotion
- GitHub Actions pipelines (or GitLab/GHA matrix) with stages:
  - PR checks: lint, build, unit tests
  - Merge to main: integration tests, security scans (SCA), SAST, dependency checks
  - Release pipeline: build multi-arch Docker image, run vulnerability scan, push to registry, promote to staging
  - Canary deployment to Kubernetes, automated smoke tests, promote to production on success
- Gate rules: require tests & SCA green before merge; require signed commits/two approvals for prod deploy.

---

## 3) Infrastructure as code
- Terraform modules for: network, VPC, DB (RDS/Aurora), object storage (S3/GCS), Redis (Elasticache/Memorystore), autoscaling groups, IAM roles.
- Helm charts for services, customizable per-environment values.

Deliverables
- Terraform root modules for each cloud provider to allow portability.
- Helm chart with configurable replicas, resource requests/limits, liveness/readiness, RBAC, and PodSecurity standards.

---

## 4) Backups & Disaster Recovery (DR) — Runbook
Goal: RPO <= 15 minutes (for critical data) and RTO <= 1 hour for major failures. Adjust to tier (enterprise vs basic).

Strategy
- Postgres: enable PITR (WAL archiving) + daily base backups + continuous WAL shipping.
- Snapshots: daily encrypted snapshots of DB and disk volumes.
- Object storage: versioned buckets + lifecycle rules + cross-region replication for enterprise tier.
- Redis: periodic RDB/AOF snapshots depending on usage; for stateful jobs use durable queues (BullMQ backed by Redis persistence + fallback store for important messages).

Backup cadence (example)
- Full base backup: daily at 02:00 UTC
- WAL archive: continuous, upload to secure object store
- Retention: 30 days (default), 90 days for enterprise
- Offsite replication: enabled for enterprise to a second region

Restore drill steps (high level)
1. Declare incident and runbook owner.
2. Provision a temporary cluster in the target region.
3. Restore latest base backup + replay WAL to the desired recovery timestamp.
4. Run application smoke tests and replay event logs as needed.
5. Promote restored cluster, rotate secrets, and update DNS/load balancer.

Testing & automation
- Weekly automated restore tests to a staging cluster.
- A documented runbook with playbook commands and escalation steps.

Deliverables (artifact list)
- `backend/deploy/backup-runbook.md` (playbook + scripts)
- Terraform for cross-region object store replication
- CronJob manifests for snapshot/backup verification

---

## 5) Tenant isolation (recommended approach)
Options considered
- Schema-per-tenant (high isolation): separate schemas per tenant, good for large enterprise customers, adds operational complexity.
- Database-per-tenant: complete isolation but expensive and operationally heavy.
- Row-Level Security (RLS) with `tenant_id` column: simpler for many tenants, better for high-density multi-tenant systems.

Recommendation
- Default: RLS for most customers (fast to implement, cost-effective).
- Offer schema-per-tenant or DB-per-tenant for enterprise customers as part of a premium offering.

Implementation plan (RLS)
1. Add `tenant_id` (UUID) on all relevant tables (if not present) and ensure FK index.
2. Add a `current_tenant()` function in DB or enforce tenant context via application-level middleware.
3. Create RLS policies for each table:
   - `CREATE POLICY tenant_isolation ON posts USING (tenant_id = current_setting('app.tenant')::uuid);`
4. In application connect logic, set `SET LOCAL app.tenant = '<tenant_uuid>';` per request.
5. Add Prisma middleware (or NestJS interceptor) to always set tenant header/pg session.

Migration approach
- Start with read-only RLS enforcement in staging to validate.
- Run smoke tests and gradually enable write policies by service.

Deliverables
- `backend/docs/tenant_isolation.md` (this includes RLS policy examples, Prisma middleware snippets, and migration plan).

---

## 6) AI cost-control and quotas
Problem
- AI provider usage can be expensive; necessary to prevent runaway bills and provide tenant-level quotas and cost attribution.

Design principles
- Track per-organization token usage & costs in real-time to the extent possible.
- Enforce soft & hard quotas with pre-flight checks.
- Circuit breakers to automatically fallback to cheaper providers or queue tasks when budgets are exceeded.
- Usage sampling and cost attribution for multi-model calls.

Data model (Prisma additions)
- `organization_ai_budgets` (organization_id, monthly_budget_cents, spent_cents, alert_thresholds, soft_limit, hard_limit)
- `ai_usage_logs` already exists — ensure it records provider, model, tokens and cost per call.

Enforcement points
1. API middleware: before generating content, check remaining budget and either allow, throttle (soft), or reject (hard). For batch jobs, queue and notify.
2. Background aggregator: a job to aggregate daily usage into `organization_ai_budgets.spent_cents` and evaluate alerts.
3. Alerts & auto-blocking: send alerts when thresholds crossed and auto-block or queue requests when hard limit reached.
4. Fallback logic: choose cheaper model/provider automatically for non-core content; allow enterprise override.

Implementation artifacts (starter)
- `backend/src/ai/cost-control.module.ts`
- `backend/src/ai/cost-control.service.ts` (check, reserve, record usage)
- `backend/src/ai/cost-control.middleware.ts` (Nest middleware for AI endpoints)
- Background job skeleton to aggregate usage (BullMQ worker)

---

## 7) Monitoring, tracing, and alerting
- Traces: OpenTelemetry with service and database instrumentation (sampled at 1-10% in prod, full traces for errors).
- Metrics: expose Prometheus metrics; dashboards in Grafana for SLA, usage, AI costs, queue depth, job failures.
- Logging: structured logs (JSON) to centralized aggregator (ELK/Cloud Logging) with correlation IDs.
- Errors: Sentry for exceptions and release tracking.

Alerting
- PagerDuty or Opsgenie integration with runbooks for high-severity incidents
- Alert thresholds for DB CPU, OOM, high latency, disk usage, job failures, AI cost spikes

---

## 8) Incident response & runbooks
- Create runbooks for: DB outage, high-cost AI spike, compromised secret, data breach, and full-region outage.
- Role matrix: owners, responders, on-call roster.
- Post-incident review template and timeline.

---

## 9) Data retention, encryption & compliance
- Encryption at rest: DB and object store encryption keys managed by KMS.
- Encryption in transit: TLS for all traffic.
- PII handling: data retention policy by organization and user opt-out/deletion.
- Data portability/export endpoints.
- Compliance checklist (PCI, SOC2, GDPR): contact legal/security for evidence collection.

---

## 10) Testing strategy
- Unit tests with Jest; integration tests with Supertest; E2E with Playwright/Cypress.
- Contract tests for provider adapters (mock provider endpoints).
- Chaos testing for background jobs and DB failover.
- Performance benchmarks for AI generation and publishing workflows.

---

## Implementation Roadmap (90-day plan, sprint-sized tasks)
Sprint 0 (prep)
- Wire secrets manager, enforce config validation in CI. (3 days)
- Add Sentry + OpenTelemetry skeleton. (2 days)

Sprint 1
- Implement AI cost-control service & middleware (stubs + unit tests). (5 days)
- Add daily usage aggregator worker (BullMQ) and DB skeleton. (3 days)

Sprint 2
- Tenant isolation: implement RLS in staging + Prisma middleware. (5 days)
- Add migration and smoke tests. (3 days)

Sprint 3
- Backups & DR automation + weekly recovery tests + runbooks. (5 days)
- CI gating and release promotion. (2 days)

Sprint 4
- Social provider adapters and webhook verification (stubs -> integrations). (10 days)
- Observability: dashboards and alerts. (5 days)

Sprint 5
- E2E test coverage for critical flows and load tests. (7 days)

This roadmap is illustrative; refine per team capacity.

---

## Backlog mapping (quick sample)
- Authentication (MFA, rotation): partial (auth controller and cookie fixes applied). Remaining: MFA TOTP setup, rotation policy, refresh rotation tests.
- CI/CD: skeleton added. Remaining: image promotion, canary deploy.
- AI providers: stubs present. Remaining: full adapters for each provider, billing integration, provider tests.
- Tenant isolation: doc and RLS plan (added). Remaining: migration execution and Prisma middleware.
- Backup/DR: doc + runbook (this file includes runbook; add automation scripts next).

---

## Next immediate actions (what I will implement now if you confirm)
1. Add production plan file (this file) and link it from `Claude.md`. (done)
2. Implement the AI cost-control starter files (service + middleware + module). (stubs added in repo)
3. Add `backend/docs/tenant_isolation.md` (detailed RLS guidance and migration steps). (added)

If you want, I can open a PR with these changes, wire the cost-control middleware into `AiController` endpoints, and run CI to iterate on type errors.

---

## Appendix: Useful SQL snippets
- Example RLS policy (Postgres):

```sql
-- set app.tenant at session start (application should set this value per-request)
SET LOCAL app.tenant = '00000000-0000-0000-0000-000000000000';

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY posts_tenant_isolation ON posts
  USING (tenant_id = current_setting('app.tenant')::uuid);
```

- Example budget check (conceptual):

```sql
-- returns remaining cents for tenant
SELECT monthly_budget_cents - COALESCE(spent_cents,0) AS remaining
FROM organization_ai_budgets
WHERE organization_id = $1;
```

---

## Final notes
This production document purposely favors explicit deliverables, runbooks, and safe defaults. It is designed to be a living document—update it as the infrastructure, regulatory or product constraints evolve.

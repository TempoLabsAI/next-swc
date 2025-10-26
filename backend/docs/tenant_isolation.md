# Tenant Isolation — RLS-first approach

This document describes a recommended tenant-isolation strategy using PostgreSQL Row-Level Security (RLS) with an option for schema-per-tenant for large customers.

Why RLS?
- Low operational overhead
- Easier to scale many tenants
- Lower cost compared to separate DB instances

High-level steps
1. Add `tenant_id` UUID FK to all tenant-scoped tables. Index these columns.
2. Provide a single place in the application to set the tenant for the DB session. For example, set `app.tenant` via `SET LOCAL app.tenant = '<uuid>';` at the start of a request/transaction.
3. Create RLS policies for the tables:

```sql
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY posts_tenant_isolation ON posts
  USING (tenant_id = current_setting('app.tenant')::uuid);
```

4. Application-level enforcement:
- Use a NestJS interceptor or Prisma middleware to set the tenant value in the DB session for each request.
- Validate tenant membership (user belongs to tenant/organization) in auth layer before setting session.

5. Migration strategy:
- Add `tenant_id` column (nullable) and backfill for historical data.
- Add an audit migration to verify correct tenant mapping.
- Enable RLS in staging in read-only mode and run tests.
- Enable write policies in a controlled rollout.

Schema-per-tenant option
- For high-value enterprise customers, create separate schema per tenant. Use separate connection strings and optionally separate DB instances.
- Pros: absolute isolation, tenant-level tuning and backups.
- Cons: complex orchestration, higher cost.

Deliverables
- Prisma middleware snippet for setting tenant session
- RLS policy SQL snippets (above)
- Migration plan

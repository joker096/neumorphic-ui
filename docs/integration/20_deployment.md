# 20. Deployment — Mess&Anger Integration Hub

> Part of the Integration Architecture implementation cycle (§91).
> Source blueprint: §66 (storage), §70 (indexes), §74 (health), §75 (metrics), §76 (monitoring), §77 (alerting), §84 (phases), §86 (prod DoD).

## 1. Infrastructure

- PostgreSQL 14+ (sub-doc 01)
- Redis + BullMQ (sub-doc 06)
- Object Storage (S3-compatible) for files (§66) — NOT in PostgreSQL
- Hub service (Node)

## 2. Migrations

Run `server/integrations/migrations/001_init.sql` (idempotent). Apply via a migrate runner.

## 3. Environment

`DATABASE_URL`, `REDIS_URL`, `OBJECT_STORAGE_*`, KMS / secret manager, JWT secret, `WEBHOOK_BASE_URL`.

## 4. Multi-tenant (§69)

`organization_id` isolation enforced; per-tenant rate limits (§43).

## 5. Observability

- Metrics (§75): jobs total/success/failed, records processed, webhooks received/failed, api requests, rate-limit hits, queue depth, sync duration.
- Monitoring (§76): queue depth, worker failures, provider errors, auth failures, sync/webhook latency, duplicate & conflict rate.
- Alerting (§77): disconnected / error-rate > threshold / queue stalled / provider unavailable / token expired / repeated webhook failures.
- Health (§74): per-integration status.

## 6. Product phases (§84)

1 Foundation → 2 Import → 3 Files → 4 CRM → 5 Sync → 6 Two-way → 7 Messenger bridge → 8 Platform.

## 7. Production DoD (§86)

Multi-tenant / encrypted creds / RBAC / audit / idempotency / rate limit / retries / DLQ / incremental sync / webhooks / polling / reconciliation / conflict resolution / field ownership / two-way / monitoring / metrics / alerting / contract + load + failure tests.

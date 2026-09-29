# Integration Hub — Action Plan (to Production)

> Status: backend core **Phases 1-8 complete** (in-memory SQLite + MemoryQueue reference implementation). Doc cycle: **20/20** sub-docs (§91) + `server/integrations/migrations/001_init.sql` (PostgreSQL DDL, 9 tables).
> Source: `docs/MessAnger_Integration_Architecture.md` (§1-§91). User directive: "создай план действий и вперед".

## Immediate (this session started)

1. **Frontend UI (sub-doc 16)** — NOT STARTED. The earlier `src/components/integrations/*` prototype panels (connect form, health, logs, mapping, conflicts, import) and `src/config/integrations.ts` were unconnected, unstyled scaffolding and were **deleted on 2026-09-28**; nothing in the app imported them. The server route `/api/v1/integrations` and `server/integrations/**` are untouched and still live. Rebuilding the UI means starting from the spec, not from the removed prototypes.
   - Spec: `docs/integration/16_frontend_integrations_ui.md`; backend contract: `server/routes/integrations.ts`; path builder must be re-created (`/api/v1/integrations` + per-id subroutes).

## Blocking gate

2. **Verification** — run `npm run lint` (eslint + `tsc --noEmit`). Caveman-ultra mode blocked Bash this session; the Hub code is manual-review only. Must pass before relying on it. Fix any type errors in `server/integrations/**`.

## Production hardening

3. **Persistence swap** — add `pg`/`ioredis`/`bullmq`; implement `PostgresStore` (swap `SqliteStore`) + `BullQueue` (swap `MemoryQueue`); run `001_init.sql` on a real Postgres. Queue is already behind `QueueProvider` interface → drop-in.
4. **Webhook enforcement (§37)** — `verifyWebhookSignature` currently *accepts* when no signature header; flip to reject missing sig per connector once secrets are configured.
5. **1C Integration Agent (§61)** — separate outbound-encrypted relay (local 1C → Agent → Hub); not in-repo yet.
6. **Tests (§78-§83)** — unit/contract/mock/failure/load under `server/integrations/tests` (MockCRM/Mock1C/MockWebhookProvider).
7. **Deployment (§20)** — Docker, env, secret manager (encrypt `integration_credentials.encrypted_value`), health/metrics endpoints wired to Prometheus.
8. **Monitoring/Alerting (§75-§77)** — `Metrics`/`HealthService` already collect; expose + alert on queue stall / provider error / token expiry.

## Out of scope (current app)

- Current app stays **local-first P2P** (WebRTC/libp2p). The Integration Hub is a **separate backend surface** (`server/`) — no client changes to the P2P core.
- Multi-tenant `organization_id` is carried in the data model; runtime tenancy enforcement at every layer (§69) is a deployment concern.

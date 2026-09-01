# 08. Sync Engine — Mess&Anger Integration Hub

> Part of the Integration Architecture implementation cycle (§91).
> Source blueprint: §34 (direction), §35 (incremental), §38 (polling), §39 (reconciliation), §51 (sync API), §87 (order).

## 1. Direction (§34)

```text
INBOUND | OUTBOUND | BIDIRECTIONAL | READ_ONLY
```

MVP = `INBOUND` first; promote to `BIDIRECTIONAL` only after the conflict engine exists (§87 #16/#19, §88).

## 2. Incremental sync (§35)

Store per integration: `last_cursor`, `last_sync_at`, `last_success_at`.

```text
load cursor → getChanges(cursor) → process page
  → save checkpoint → next page → save final cursor
```

## 3. Polling fallback (§38)

No webhook → scheduler `getChanges()` → queue → workers. Period configurable: 1m / 5m / 15m / 1h (provider/plan dependent).

## 4. Reconciliation (§39)

Periodic external count vs internal; detect missing external IDs, broken relations, orphan records, stale records.

## 5. API (§51)

```http
GET  /api/v1/integrations/:id/sync
POST /api/v1/integrations/:id/sync/start
POST /api/v1/integrations/:id/sync/pause
POST /api/v1/integrations/:id/sync/resume
POST /api/v1/integrations/:id/sync/full
```

## 6. SyncStateService

Per `integration_id` + `entity_type`: cursor + `last_success_at` + health (§74).

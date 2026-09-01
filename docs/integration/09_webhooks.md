# 09. Webhooks — Mess&Anger Integration Hub

> Part of the Integration Architecture implementation cycle (§91).
> Source blueprint: §36 (flow), §37 (security), §54 (API), §27 (idempotency), §80 (mock), §89.

## 1. Flow (§36)

```text
External Provider
  ↓ POST /api/v1/integrations/webhooks/:provider/:integrationId
Verify signature
  ↓ Validate payload
Generate event ID
  ↓ Idempotency check (§27)
Queue
  ↓ Worker (06)
Sync
```

Respond fast `{ "accepted": true, "event_id": "evt_123" }`; heavy work async (§89 — no synchronous webhook handling).

## 2. Security (§37)

Verify: signature, timestamp (replay window), provider, integration ID, payload schema, replay protection (seen `event_id`), rate limit. HTTPS alone is **not** trusted.

## 3. Idempotency (§27)

`event_id` deduped at queue entry.

## 4. API (§54)

```http
POST /api/v1/integrations/webhooks/:provider/:integrationId
```

## 5. Mock (§80)

`MockWebhookProvider` for unit / integration / failure tests (sub-doc 19/82).

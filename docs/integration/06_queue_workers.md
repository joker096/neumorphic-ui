# 06. Queue & Workers — Mess&Anger Integration Hub

> Part of the Integration Architecture implementation cycle (§91).
> Source blueprint: §25 (queues), §26 (worker), §41 (retry errors), §42 (backoff), §43 (rate limit), §71 (tx), §83 (recovery), §89.

## 1. Broker

Redis + BullMQ.

## 2. Queues (§25)

```text
integration.import
integration.sync
integration.webhook
integration.reconciliation
integration.retry
```

## 3. Worker payload (§26)

```json
{ "jobId": "job_123", "integrationId": "int_456",
  "entityType": "contact", "externalId": "789" }
```

## 4. Worker pipeline (§26)

```text
load source → map (04) → validate → identity lookup (07)
  → dedupe (07) → create/update → write external id → audit (46)
```

## 5. Retry only temporary (§41)

Retry: `TIMEOUT`, `NETWORK_ERROR`, `RATE_LIMIT`, `5XX`, `TEMPORARY_PROVIDER_ERROR`.
Permanent (→ DLQ, no retry): `INVALID_DATA`, `AUTH_FAILED`, `PERMISSION_DENIED`, `NOT_FOUND`, `INVALID_MAPPING`.

## 6. Backoff (§42)

```text
1 → 5s, 2 → 30s, 3 → 5m, 4 → 30m   (jitter; maxAttempts configurable)
```

Never infinite retry (§88).

## 7. Rate limit (§43)

Per-provider centralized limiter: `requests/minute`, `requests/day`, `batch_size`, `concurrency`.

## 8. Idempotency (§27)

Key = `${provider}:${entity}:${externalId}:${op}:${version}`. Skip if already processed.

## 9. Recovery (§83)

Worker crash → job resumes via checkpoint (§40). Duplicate webhook → idempotency blocks.

## 10. Dead-letter

`integration.retry` exhaustion → DeadLetter; surfaced in Logs API (§53).

# 05. Import Engine — Mess&Anger Integration Hub

> Part of the Integration Architecture implementation cycle (§91).
> Source blueprint: §22 (job), §23 (items), §24 (lifecycle), §40 (checkpoint), §49 (import API), §71 (transactions), §72 (consistency), §85 (MVP).

## 1. Job model (01 §2.5 / §2.6)

- `integration_jobs`: `type`, `entity_type`, `status`, `total`, `processed`, `created`, `updated`, `duplicates`, `errors`.
- `integration_job_items`: per-record `status`, `attempts`, `error_code`, `error_message`, `payload_reference`.

## 2. Lifecycle (§24)

```text
CREATED → QUEUED → PROCESSING → SUCCESS
FAILED → RETRYING → (SUCCESS | DEAD_LETTER)
pause / resume / cancel supported (§49)
```

## 3. Big import = checkpoint (§40)

State per job: `job_id`, `cursor`, `page`, `processed_count`, `last_external_id`. After crash → **resume** from checkpoint (§83), never restart from zero.

## 4. Transactions (§71)

One job → many item-level transactions. Partial failure survives; never one tx per 100k rows.

## 5. Consistency order (§72)

```text
external id saved → canonical saved → audit saved → job item marked success
```

## 6. Dry run / Preview (§85)

`dry_run` flag: validate + count, no writes.

## 7. API (§49)

```http
POST /api/v1/integrations/:id/imports     enqueue
GET  /api/v1/integrations/:id/imports     list
GET  /api/v1/imports/:jobId               status
POST /api/v1/imports/:jobId/start
POST /api/v1/imports/:jobId/pause
POST /api/v1/imports/:jobId/resume
POST /api/v1/imports/:jobId/cancel
POST /api/v1/imports/:jobId/retry
```

## 8. Engine flow

enqueue → worker pulls page (06) → per item: map (04) → validate → identity lookup (07) → dedupe (07) → create/update → write external id → audit (46).

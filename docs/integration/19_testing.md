# 19. Testing — Mess&Anger Integration Hub

> Part of the Integration Architecture implementation cycle (§91).
> Source blueprint: §78 (per-connector), §79 (contract), §80 (mocks), §81 (load), §82 (failure), §83 (recovery).

## 1. Per-connector (§78)

connect / auth / list (pagination) / create / update / delete / rate-limit / webhook / error.

## 2. Contract (§79)

Provider payload → Adapter → Canonical; assert schema stability.

## 3. Mocks (§80)

`MockCRM` / `Mock1C` / `MockWebhookProvider` for unit / integration / load / failure suites.

## 4. Load (§81)

1k / 10k / 100k / 1M records; measure throughput / memory / CPU / DB load / queue latency / API calls.

## 5. Failure (§82)

provider down / network lost / worker crash / token expired / rate limit / invalid record / duplicate webhook / DB restart / queue restart.

## 6. Recovery (§83)

Job resumes via checkpoint (§40); idempotency (§27) blocks duplicate webhook; backoff (§42) on rate limit; `REAUTH_REQUIRED` on expired token.

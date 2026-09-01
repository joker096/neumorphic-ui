# 18. Security — Mess&Anger Integration Hub

> Part of the Integration Architecture implementation cycle (§91).
> Source blueprint: §1.2, §14, §37, §44, §45, §46, §47, §67, §68, §69.

## 1. Credentials (§1.2, §14)

Backend-only — never in frontend. Stored in `integration_credentials.encrypted_value` (app-KMS). `rotated_at` tracked.

## 2. Webhook (§37)

Verify signature + timestamp (replay window) + payload schema + replay `event_id`. HTTPS alone is NOT trusted.

## 3. Errors (§44 / §45)

Typed taxonomy + safe `{code, message, retryable}`. Technical detail in backend logs only.

## 4. Audit (§46)

Every mutating operation writes an `integration_audit_logs` row.

## 5. Secret redaction (§47)

Never log `access_token` / `refresh_token` / `client_secret` / `api_key` / `password` / `webhook_secret` / `Authorization` — emit `[REDACTED]`.

## 6. RBAC (§68) + scopes (§67)

Roles: Owner / Admin / Integration Manager / Manager / Viewer. Integration Manager = connect / configure / sync / retry / view logs. Viewer = read-only. Scopes: contacts / companies / deals / tasks / files / messages `:read` / `:write`.

## 7. Multi-tenant (§69)

`organization_id` on every entity; tenant checked at HTTP / Service / Queue / Worker / Webhook / DB / Storage / Logs.

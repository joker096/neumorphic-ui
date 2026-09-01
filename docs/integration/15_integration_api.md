# 15. Integration API — Mess&Anger Integration Hub

> Part of the Integration Architecture implementation cycle (§91).
> Source blueprint: §48–§54 (routes), §67 (scopes), §68 (RBAC), §69 (tenant), §45 (errors), §74 (health).

## 1. Base

`/api/v1/integrations` — every route requires auth + RBAC scope (§67) + tenant context (§69).

## 2. Routes (§48–§54)

```http
GET    /                              list
POST   /                              create draft
POST   /:id/connect
POST   /:id/disconnect
GET    /:id/mappings
PUT    /:id/mappings
POST   /:id/mappings/preview
POST   /:id/imports                   (+ /start /pause /resume /cancel /retry)
GET    /:id/imports/:jobId
POST   /:id/sync                      (+ /start /pause /resume /full)
GET    /:id/conflicts
POST   /conflicts/:id/resolve
GET    /:id/logs | /:id/errors | /:id/health
POST   /webhooks/:provider/:integrationId
```

## 3. Error shape (§45)

```json
{ "code": "RATE_LIMIT", "message": "safe text", "retryable": true }
```

Technical detail in backend logs only (§47).

## 4. Health (§74)

`HEALTHY` / `WARNING` / `DEGRADED` / `ERROR` / `DISCONNECTED` / `REAUTH_REQUIRED`.

## 5. Tenant (§69)

`organization_id` on every query; resolved from JWT in middleware; enforced at Service/Queue/Worker/Webhook/DB/Storage/Logs.

# 10. Conflict Engine — Mess&Anger Integration Hub

> Part of the Integration Architecture implementation cycle (§91).
> Source blueprint: §31 (model), §32 (strategies), §33 (field ownership), §52 (API), §86 (prod), §88/§89.

## 1. Model (01 §2.7)

`integration_conflicts`: `entity_type`, `internal_id`, `external_id`, `field`, `local_value`, `external_value`, `local_updated_at`, `external_updated_at`, `strategy`, `status`.

## 2. Strategies (§32)

```text
SOURCE_WINS | TARGET_WINS | LAST_WRITE_WINS | MANUAL | MERGE
```

Default `MANUAL`.

## 3. Field ownership (§33)

`MasterSystem`: per-field source of truth (CRM vs Messenger). On conflict, owner wins; if both edited recently → `MANUAL` / `LAST_WRITE_WINS`.

## 4. Resolution

Resolving writes both sides via the connector (`Connector.update`). Status → `RESOLVED`, `resolved_by` + `resolved_at` set.

## 5. API (§52)

```http
GET  /api/v1/integrations/:id/conflicts
GET  /api/v1/conflicts/:id
POST /api/v1/conflicts/:id/resolve
```

## 6. Gating (§88)

Conflict engine is **mandatory before** `BIDIRECTIONAL` sync. Two-way sync without it is forbidden.

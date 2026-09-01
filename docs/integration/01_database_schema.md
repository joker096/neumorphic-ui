# 01. Database Schema — Mess&Anger Integration Hub

> Part of the Integration Architecture implementation cycle (§91).
> Source blueprint: `docs/MessAnger_Integration_Architecture.md` §12, §13, §14, §15, §22, §23, §31, §46, §70.
> Executable DDL: `server/integrations/migrations/001_init.sql`.

## 1. Engine & conventions

- PostgreSQL 14+.
- Every table carries `organization_id` for tenant isolation (row-level tenancy; enforced in queries, not via schema-only FK to keep the hub decoupled from the org service).
- Primary keys: opaque strings (UUID v4). Never expose provider internal IDs as PKs.
- Timestamps: `TIMESTAMPTZ` UTC. `created_at`/`updated_at` default `now()`.
- `config`, `metadata`, `custom_fields` style payloads: `jsonb`.
- Secrets NEVER live in `integrations.config` — only in `integration_credentials.encrypted_value` (app-level encrypted; KMS/secret manager preferred).

## 2. Tables

### 2.1 `integrations` (§13)

```sql
CREATE TABLE integrations (
  id              TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  provider        TEXT NOT NULL,
  name            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft',   -- draft|connecting|connected|error|paused
  mode            TEXT NOT NULL DEFAULT 'production', -- production|sandbox
  sync_direction  TEXT NOT NULL DEFAULT 'inbound', -- inbound|outbound|bidirectional|read_only
  config          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2.2 `integration_credentials` (§14)

```sql
CREATE TABLE integration_credentials (
  id             TEXT PRIMARY KEY,
  integration_id TEXT NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  credential_type TEXT NOT NULL,        -- api_key|oauth2|webhook_secret|basic
  encrypted_value TEXT NOT NULL,        -- app-encrypted blob
  expires_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  rotated_at     TIMESTAMPTZ
);
```

### 2.3 `integration_external_ids` (§12) — identity / dedupe map

```sql
CREATE TABLE integration_external_ids (
  id                TEXT PRIMARY KEY,
  organization_id   TEXT NOT NULL,
  integration_id    TEXT NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  entity_type       TEXT NOT NULL,       -- contact|company|deal|task|...
  external_id       TEXT NOT NULL,
  internal_id       TEXT NOT NULL,
  external_updated_at TIMESTAMPTZ,
  last_synced_at    TIMESTAMPTZ,
  content_hash      TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (integration_id, entity_type, external_id)
);
```

### 2.4 `integration_mappings` (§15)

```sql
CREATE TABLE integration_mappings (
  id            TEXT PRIMARY KEY,
  integration_id TEXT NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  entity_type   TEXT NOT NULL,
  source_field  TEXT NOT NULL,
  target_field  TEXT NOT NULL,
  transform     TEXT,                    -- normalizePhone|mapEnum|... (§17)
  default_value JSONB,
  required      BOOLEAN NOT NULL DEFAULT false,
  enabled       BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2.5 `integration_jobs` (§22) — import / sync jobs

```sql
CREATE TABLE integration_jobs (
  id             TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  integration_id  TEXT NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  type           TEXT NOT NULL,          -- import|sync|reconcile
  entity_type    TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'CREATED', -- CREATED|QUEUED|PROCESSING|SUCCESS|FAILED|RETRYING|DEAD_LETTER (§24)
  total          INTEGER NOT NULL DEFAULT 0,
  processed      INTEGER NOT NULL DEFAULT 0,
  created        INTEGER NOT NULL DEFAULT 0,
  updated        INTEGER NOT NULL DEFAULT 0,
  duplicates     INTEGER NOT NULL DEFAULT 0,
  errors         INTEGER NOT NULL DEFAULT 0,
  started_at     TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  created_by     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2.6 `integration_job_items` (§23)

```sql
CREATE TABLE integration_job_items (
  id               TEXT PRIMARY KEY,
  job_id           TEXT NOT NULL REFERENCES integration_jobs(id) ON DELETE CASCADE,
  external_id      TEXT,
  entity_type      TEXT NOT NULL,
  status           TEXT NOT NULL,        -- SUCCESS|FAILED|SKIPPED
  attempts         INTEGER NOT NULL DEFAULT 0,
  error_code       TEXT,
  error_message    TEXT,
  payload_reference TEXT,                -- object-storage ref, not the payload itself
  processed_at     TIMESTAMPTZ
);
```

### 2.7 `integration_conflicts` (§31)

```sql
CREATE TABLE integration_conflicts (
  id                 TEXT PRIMARY KEY,
  integration_id     TEXT NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  entity_type        TEXT NOT NULL,
  internal_id        TEXT NOT NULL,
  external_id        TEXT,
  field              TEXT NOT NULL,
  local_value        JSONB,
  external_value     JSONB,
  local_updated_at   TIMESTAMPTZ,
  external_updated_at TIMESTAMPTZ,
  strategy           TEXT NOT NULL DEFAULT 'MANUAL', -- SOURCE_WINS|TARGET_WINS|LAST_WRITE_WINS|MANUAL|MERGE (§32)
  status             TEXT NOT NULL DEFAULT 'OPEN',   -- OPEN|RESOLVED
  resolved_by        TEXT,
  resolved_at        TIMESTAMPTZ
);
```

### 2.8 `integration_audit_logs` (§46) — immutable trail

```sql
CREATE TABLE integration_audit_logs (
  id              TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  integration_id  TEXT,
  actor           TEXT,                  -- user id or 'system'
  action          TEXT NOT NULL,         -- connect|sync|import|webhook|conflict|error
  entity_type     TEXT,
  external_id     TEXT,
  status          TEXT NOT NULL,
  error_code      TEXT,
  error_message   TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## 3. Indexes (§70)

```sql
CREATE INDEX ix_external_ids_lookup
  ON integration_external_ids (integration_id, entity_type, external_id);
CREATE INDEX ix_external_ids_internal
  ON integration_external_ids (integration_id, internal_id);
CREATE INDEX ix_integrations_org
  ON integrations (organization_id, provider);
CREATE INDEX ix_jobs_status
  ON integration_jobs (integration_id, status);
CREATE INDEX ix_job_items_job
  ON integration_job_items (job_id, status);
CREATE INDEX ix_conflicts_status
  ON integration_conflicts (integration_id, status);
CREATE INDEX ix_audit_integration
  ON integration_audit_logs (integration_id, created_at);
CREATE INDEX ix_audit_org
  ON integration_audit_logs (organization_id, created_at);
```

## 4. Rules (from §1, §89)

- Credentials only in `integration_credentials.encrypted_value`.
- No hard delete of rows that carry an external mapping (use `status`/`paused`).
- Dedupe priority (§28): `external_id` → exact phone → exact email → INN → provider id → composite. Never auto-merge on name only.
- Every mutating operation writes an `integration_audit_logs` row (§26 worker step "audit").

## 5. Open items

- Sync-state store (`SyncStateService`, §34/§89) may need `integration_sync_states` — add when Sync Engine (sub-doc 08) is built.
- Partition `integration_audit_logs` by `created_at` at scale.

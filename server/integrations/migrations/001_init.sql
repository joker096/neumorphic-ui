-- 001_init.sql — Mess&Anger Integration Hub schema
-- Source: docs/integration/01_database_schema.md (blueprint §12,§13,§14,§15,§22,§23,§31,§46,§70)
-- Engine: PostgreSQL 14+

CREATE TABLE integrations (
  id              TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  provider        TEXT NOT NULL,
  name            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft',
  mode            TEXT NOT NULL DEFAULT 'production',
  sync_direction  TEXT NOT NULL DEFAULT 'inbound',
  config          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE integration_credentials (
  id             TEXT PRIMARY KEY,
  integration_id TEXT NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  credential_type TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,
  expires_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  rotated_at     TIMESTAMPTZ
);

CREATE TABLE integration_external_ids (
  id                TEXT PRIMARY KEY,
  organization_id   TEXT NOT NULL,
  integration_id    TEXT NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  entity_type       TEXT NOT NULL,
  external_id       TEXT NOT NULL,
  internal_id       TEXT NOT NULL,
  external_updated_at TIMESTAMPTZ,
  last_synced_at    TIMESTAMPTZ,
  content_hash      TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (integration_id, entity_type, external_id)
);

CREATE TABLE integration_mappings (
  id            TEXT PRIMARY KEY,
  integration_id TEXT NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  entity_type   TEXT NOT NULL,
  source_field  TEXT NOT NULL,
  target_field  TEXT NOT NULL,
  transform     TEXT,
  default_value JSONB,
  required      BOOLEAN NOT NULL DEFAULT false,
  enabled       BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE integration_jobs (
  id             TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  integration_id  TEXT NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  type           TEXT NOT NULL,
  entity_type    TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'CREATED',
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

CREATE TABLE integration_job_items (
  id               TEXT PRIMARY KEY,
  job_id           TEXT NOT NULL REFERENCES integration_jobs(id) ON DELETE CASCADE,
  external_id      TEXT,
  entity_type      TEXT NOT NULL,
  status           TEXT NOT NULL,
  attempts         INTEGER NOT NULL DEFAULT 0,
  error_code       TEXT,
  error_message    TEXT,
  payload_reference TEXT,
  processed_at     TIMESTAMPTZ
);

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
  strategy           TEXT NOT NULL DEFAULT 'MANUAL',
  status             TEXT NOT NULL DEFAULT 'OPEN',
  resolved_by        TEXT,
  resolved_at        TIMESTAMPTZ
);

CREATE TABLE integration_audit_logs (
  id              TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  integration_id  TEXT,
  actor           TEXT,
  action          TEXT NOT NULL,
  entity_type     TEXT,
  external_id     TEXT,
  status          TEXT NOT NULL,
  error_code      TEXT,
  error_message   TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE TABLE integration_entities (
  id              TEXT PRIMARY KEY,
  integration_id  TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  name            TEXT,
  email           TEXT,
  phone           TEXT,
  data            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_entities_lookup ON integration_entities (integration_id, entity_type);
CREATE INDEX ix_entities_phone  ON integration_entities (integration_id, entity_type, phone);
CREATE INDEX ix_entities_email  ON integration_entities (integration_id, entity_type, email);

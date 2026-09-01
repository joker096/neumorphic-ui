// Integration Hub — external-id map (blueprint §12). Authoritative dedupe key.
// Phase-3 SQLite; production target = PostgreSQL `server/integrations/migrations/001_init.sql`.
import { getDb } from '../../db.js'
import type { EntityType } from './Connector.js'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS integration_external_ids (
  id              TEXT PRIMARY KEY,
  integration_id  TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  external_id     TEXT NOT NULL,
  internal_id     TEXT NOT NULL,
  last_synced_at  TEXT,
  UNIQUE (integration_id, entity_type, external_id)
);
`

export class ExternalIdStore {
  private db = getDb()
  constructor() {
    this.db.exec(SCHEMA)
  }

  // Stable id derived from the natural key (no separate nanoid needed).
  private static key(integrationId: string, entityType: EntityType, externalId: string): string {
    return `${integrationId}:${entityType}:${externalId}`
  }

  upsert(integrationId: string, entityType: EntityType, externalId: string, internalId: string): void {
    this.db
      .prepare(
        `INSERT INTO integration_external_ids (id, integration_id, entity_type, external_id, internal_id, last_synced_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(integration_id, entity_type, external_id) DO UPDATE SET
           internal_id = excluded.internal_id, last_synced_at = datetime('now')`,
      )
      .run(
        ExternalIdStore.key(integrationId, entityType, externalId),
        integrationId,
        entityType,
        externalId,
        internalId,
      )
  }

  get(integrationId: string, entityType: EntityType, externalId: string): string | undefined {
    const r = this.db
      .prepare(
        'SELECT internal_id FROM integration_external_ids WHERE integration_id = ? AND entity_type = ? AND external_id = ?',
      )
      .get(integrationId, entityType, externalId) as any
    return r ? r.internal_id : undefined
  }
}

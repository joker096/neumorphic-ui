// Integration Hub — canonical entity store (blueprint §8 / §12).
// Phase-3 SQLite; production target = PostgreSQL `server/integrations/migrations/001_init.sql`.
import { getDb } from '../../db.js'
import type { CanonicalEntity, EntityType } from './Connector.js'

export interface StoredEntity {
  id: string
  integrationId: string
  entityType: EntityType
  canonical: Partial<CanonicalEntity>
  createdAt: string
  updatedAt: string
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS integration_entities (
  id              TEXT PRIMARY KEY,
  integration_id  TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  name            TEXT,
  email           TEXT,
  phone           TEXT,
  data            TEXT NOT NULL DEFAULT '{}',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS ix_entities_lookup ON integration_entities (integration_id, entity_type);
CREATE INDEX IF NOT EXISTS ix_entities_phone ON integration_entities (integration_id, entity_type, phone);
CREATE INDEX IF NOT EXISTS ix_entities_email ON integration_entities (integration_id, entity_type, email);
`

export class EntityStore {
  private db = getDb()
  constructor() {
    this.db.exec(SCHEMA)
  }

  upsert(e: StoredEntity): void {
    this.db
      .prepare(
        `INSERT INTO integration_entities (id, integration_id, entity_type, name, email, phone, data, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name, email = excluded.email, phone = excluded.phone,
           data = excluded.data, updated_at = datetime('now')`,
      )
      .run(
        e.id,
        e.integrationId,
        e.entityType,
        e.canonical.name ?? null,
        e.canonical.email ?? null,
        e.canonical.phone ?? null,
        JSON.stringify(e.canonical ?? {}),
      )
  }

  get(integrationId: string, entityType: EntityType, id: string): StoredEntity | undefined {
    const r = this.db
      .prepare('SELECT * FROM integration_entities WHERE integration_id = ? AND entity_type = ? AND id = ?')
      .get(integrationId, entityType, id) as any
    return r ? rowToEntity(r) : undefined
  }

  findByPhone(integrationId: string, entityType: EntityType, phone: string): StoredEntity[] {
    if (!phone) return []
    return (
      this.db
        .prepare('SELECT * FROM integration_entities WHERE integration_id = ? AND entity_type = ? AND phone = ?')
        .all(integrationId, entityType, phone) as any[]
    ).map(rowToEntity)
  }

  findByEmail(integrationId: string, entityType: EntityType, email: string): StoredEntity[] {
    if (!email) return []
    return (
      this.db
        .prepare('SELECT * FROM integration_entities WHERE integration_id = ? AND entity_type = ? AND email = ?')
        .all(integrationId, entityType, email) as any[]
    ).map(rowToEntity)
  }

  countByIntegration(integrationId: string, entityType: EntityType): number {
    const r = this.db
      .prepare('SELECT COUNT(*) AS n FROM integration_entities WHERE integration_id = ? AND entity_type = ?')
      .get(integrationId, entityType) as any
    return r ? r.n : 0
  }

  listIds(integrationId: string, entityType: EntityType): string[] {
    return (
      this.db
        .prepare('SELECT id FROM integration_entities WHERE integration_id = ? AND entity_type = ?')
        .all(integrationId, entityType) as any[]
    ).map((r: any) => r.id)
  }
}

function rowToEntity(r: any): StoredEntity {
  return {
    id: r.id,
    integrationId: r.integration_id,
    entityType: r.entity_type,
    canonical: r.data ? JSON.parse(r.data) : {},
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

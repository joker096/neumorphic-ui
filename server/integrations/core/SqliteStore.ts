// Integration Hub — Phase-1 persistent store (SQLite via server's better-sqlite3).
// Production target = PostgreSQL `server/integrations/migrations/001_init.sql`.
import { getDb } from '../../db.js';
import type { IntegrationRecord, Store } from './IntegrationManager.js';
import type { SyncDirection } from './Connector.js';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS integrations (
  id              TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  provider        TEXT NOT NULL,
  name            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft',
  sync_direction  TEXT NOT NULL DEFAULT 'inbound',
  config          TEXT NOT NULL DEFAULT '{}',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS ix_integrations_org ON integrations (organization_id, provider);
`;

function rowToRecord(r: any): IntegrationRecord {
  return {
    id: r.id,
    organizationId: r.organization_id,
    provider: r.provider,
    name: r.name,
    status: r.status,
    syncDirection: (r.sync_direction ?? 'inbound') as SyncDirection,
    config: r.config ? JSON.parse(r.config) : {},
    createdAt: r.created_at,
  };
}

export class SqliteStore implements Store {
  private db = getDb();
  constructor() {
    this.db.exec(SCHEMA);
  }

  list(orgId: string): IntegrationRecord[] {
    return (this.db
      .prepare('SELECT * FROM integrations WHERE organization_id = ?')
      .all(orgId) as any[]).map(rowToRecord);
  }

  get(id: string): IntegrationRecord | undefined {
    const r = this.db.prepare('SELECT * FROM integrations WHERE id = ?').get(id) as any;
    return r ? rowToRecord(r) : undefined;
  }

  save(rec: IntegrationRecord): void {
    this.db
      .prepare(
        `INSERT INTO integrations (id, organization_id, provider, name, status, sync_direction, config, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           organization_id = excluded.organization_id,
           provider = excluded.provider,
           name = excluded.name,
           status = excluded.status,
           sync_direction = excluded.sync_direction,
           config = excluded.config,
           updated_at = datetime('now')`,
      )
      .run(
        rec.id,
        rec.organizationId,
        rec.provider,
        rec.name,
        rec.status,
        rec.syncDirection,
        JSON.stringify(rec.config ?? {}),
      );
  }

  remove(id: string): void {
    this.db.prepare('DELETE FROM integrations WHERE id = ?').run(id);
  }
}

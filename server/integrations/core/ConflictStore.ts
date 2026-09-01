// Integration Hub — Conflict store (blueprint §31). SQLite parity with migrations/001_init.sql.
import { getDb } from '../../db.js'

export interface StoredConflict {
  id: string
  integrationId: string
  entityType: string
  internalId: string
  externalId: string | null
  field: string
  localValue: unknown
  externalValue: unknown
  localUpdatedAt: string | null
  externalUpdatedAt: string | null
  strategy: string
  status: string
  resolvedBy: string | null
  resolvedAt: string | null
}

export class ConflictStore {
  private db = getDb()
  constructor() {
    this.db.exec(`CREATE TABLE IF NOT EXISTS integration_conflicts (
      id TEXT PRIMARY KEY,
      integration_id TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      internal_id TEXT NOT NULL,
      external_id TEXT,
      field TEXT NOT NULL,
      local_value TEXT,
      external_value TEXT,
      local_updated_at TEXT,
      external_updated_at TEXT,
      strategy TEXT NOT NULL DEFAULT 'MANUAL',
      status TEXT NOT NULL DEFAULT 'OPEN',
      resolved_by TEXT,
      resolved_at TEXT
    )`)
  }
  upsert(c: StoredConflict): void {
    this.db.prepare(`INSERT INTO integration_conflicts
      (id, integration_id, entity_type, internal_id, external_id, field, local_value, external_value, local_updated_at, external_updated_at, strategy, status, resolved_by, resolved_at)
      VALUES (@id, @integrationId, @entityType, @internalId, @externalId, @field, @localValue, @externalValue, @localUpdatedAt, @externalUpdatedAt, @strategy, @status, @resolvedBy, @resolvedAt)
      ON CONFLICT(id) DO UPDATE SET status=@status, resolved_by=@resolvedBy, resolved_at=@resolvedAt, strategy=@strategy`).run(c)
  }
  get(id: string): StoredConflict | undefined {
    const r = this.db.prepare('SELECT * FROM integration_conflicts WHERE id = ?').get(id) as any
    return r ? this.rowToConflict(r) : undefined
  }
  listOpen(integrationId: string): StoredConflict[] {
    const rows = this.db.prepare('SELECT * FROM integration_conflicts WHERE integration_id = ? AND status = ?').all(integrationId, 'OPEN') as any[]
    return rows.map(this.rowToConflict)
  }
  resolve(id: string, strategy: string, resolvedBy: string): void {
    this.db.prepare(`UPDATE integration_conflicts SET status='RESOLVED', strategy=?, resolved_by=?, resolved_at=datetime('now') WHERE id=?`).run(strategy, resolvedBy, id)
  }
  private rowToConflict(r: any): StoredConflict {
    return {
      id: r.id, integrationId: r.integration_id, entityType: r.entity_type, internalId: r.internal_id,
      externalId: r.external_id, field: r.field,
      localValue: r.local_value ? JSON.parse(r.local_value) : null,
      externalValue: r.external_value ? JSON.parse(r.external_value) : null,
      localUpdatedAt: r.local_updated_at, externalUpdatedAt: r.external_updated_at,
      strategy: r.strategy, status: r.status, resolvedBy: r.resolved_by, resolvedAt: r.resolved_at,
    }
  }
}

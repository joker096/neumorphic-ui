// Integration Hub — Audit log store (blueprint §46). SQLite parity with migrations/001_init.sql.
import { getDb } from '../../db.js'

export interface AuditEntry {
  id: string
  organizationId: string
  integrationId: string | null
  actor: string | null
  action: string
  entityType: string | null
  externalId: string | null
  status: string
  errorCode: string | null
  errorMessage: string | null
  metadata: Record<string, unknown> | string | null
}

export class AuditStore {
  private db = getDb()
  constructor() {
    this.db.exec(`CREATE TABLE IF NOT EXISTS integration_audit_logs (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      integration_id TEXT,
      actor TEXT,
      action TEXT NOT NULL,
      entity_type TEXT,
      external_id TEXT,
      status TEXT NOT NULL,
      error_code TEXT,
      error_message TEXT,
      metadata TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`)
  }
  insert(e: AuditEntry): void {
    this.db.prepare(`INSERT INTO integration_audit_logs
      (id, organization_id, integration_id, actor, action, entity_type, external_id, status, error_code, error_message, metadata)
      VALUES (@id, @organizationId, @integrationId, @actor, @action, @entityType, @externalId, @status, @errorCode, @errorMessage, @metadata)`)
      // `metadata` is a TEXT column. Binding the raw object made node:sqlite
      // throw ("can only bind numbers, strings, bigints, buffers, and null"),
      // which aborted every audited action — including integration creation.
      .run({ ...e, metadata: typeof e.metadata === 'string' ? e.metadata : JSON.stringify(e.metadata ?? {}) })
  }

  list(integrationId?: string, limit = 100): AuditEntry[] {
    if (integrationId) {
      return this.db
        .prepare(`SELECT * FROM integration_audit_logs WHERE integration_id = ? ORDER BY created_at DESC LIMIT ?`)
        .all(integrationId, limit) as AuditEntry[]
    }
    return this.db
      .prepare(`SELECT * FROM integration_audit_logs ORDER BY created_at DESC LIMIT ?`)
      .all(limit) as AuditEntry[]
  }
}

export const auditStore = new AuditStore()

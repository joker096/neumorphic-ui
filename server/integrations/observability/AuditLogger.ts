// Integration Hub — Audit logger (blueprint §46).
import { nanoid } from 'nanoid'
import { AuditStore } from '../core/AuditStore.js'

export interface AuditParams {
  organizationId: string
  integrationId?: string | null
  actor?: string | null
  action: string
  entityType?: string | null
  externalId?: string | null
  status: string
  errorCode?: string | null
  errorMessage?: string | null
  metadata?: Record<string, unknown>
}

export class AuditLogger {
  private store = new AuditStore()
  log(p: AuditParams): void {
    this.store.insert({
      id: nanoid(), organizationId: p.organizationId, integrationId: p.integrationId ?? null, actor: p.actor ?? null,
      action: p.action, entityType: p.entityType ?? null, externalId: p.externalId ?? null, status: p.status,
      errorCode: p.errorCode ?? null, errorMessage: p.errorMessage ?? null, metadata: p.metadata ?? {},
    })
  }
}

export const audit = new AuditLogger()

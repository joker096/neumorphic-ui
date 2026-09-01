// Integration Hub — Reconciliation (blueprint §39).
import { integrationManager } from '../core/IntegrationManager.js'
import { IntegrationError, StaticCredentialHandle, IntegrationContext } from '../core/Connector.js'
import { EntityStore } from '../core/EntityStore.js'
import { connectorRegistry } from '../core/ConnectorRegistry.js'
import type { EntityType } from '../core/Connector.js'

const RECON_ENTITIES: EntityType[] = ['contact', 'company', 'deal']

export interface ReconciliationReport {
  integrationId: string
  reconciledAt: string
  perEntity: { entityType: EntityType; externalCount: number; internalCount: number; delta: number }[]
  note: string
}

export class ReconciliationService {
  private entities = new EntityStore()

  async reconcile(integrationId: string): Promise<ReconciliationReport> {
    const rec = integrationManager.get(integrationId)
    if (!rec) throw new IntegrationError('NOT_FOUND', 'Integration not found')
    const connector = connectorRegistry.get(rec.provider)
    if (!connector) throw new IntegrationError('PROVIDER', 'Connector not registered')
    if (!connector.list) throw new IntegrationError('PROVIDER', 'Connector does not support listing for reconciliation')

    const ctx: IntegrationContext = {
      organizationId: rec.organizationId ?? '',
      integrationId,
      provider: rec.provider,
      credentials: new StaticCredentialHandle(integrationId, (rec.config ?? {}) as Record<string, unknown>),
      config: (rec.config ?? {}) as Record<string, unknown>,
    }

    const perEntity: ReconciliationReport['perEntity'] = []
    for (const entityType of RECON_ENTITIES) {
      const internalCount = this.entities.countByIntegration(integrationId, entityType)
      let externalCount = -1
      try {
        const page = await connector.list(entityType, { limit: 100000 }, ctx)
        externalCount = page.items.length
      } catch {
        externalCount = -1
      }
      perEntity.push({
        entityType,
        externalCount,
        internalCount,
        delta: externalCount < 0 ? 0 : externalCount - internalCount,
      })
    }

    return {
      integrationId,
      reconciledAt: new Date().toISOString(),
      perEntity,
      note: 'External vs internal count delta. Field-level missing/orphan diff is a follow-up.',
    }
  }
}

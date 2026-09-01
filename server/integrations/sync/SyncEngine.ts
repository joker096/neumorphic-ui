// Incremental sync (blueprint §34/§35/§38).
import { connectorRegistry } from '../core/ConnectorRegistry.js'
import { integrationManager } from '../core/IntegrationManager.js'
import { IntegrationError } from '../core/Connector.js'
import type { EntityType, IntegrationContext } from '../core/Connector.js'
import { ImportService } from '../import/ImportService.js'

export class SyncEngine {
  async sync(integrationId: string, entityType: EntityType, ctx: IntegrationContext): Promise<{ processed: number }> {
    const rec = integrationManager.get(integrationId)
    if (!rec) throw new IntegrationError('NOT_FOUND', 'Integration not found')
    const connector = connectorRegistry.get(rec.provider)
    if (!connector.getChanges) {
      throw new IntegrationError('VALIDATION', 'Connector does not support incremental sync')
    }
    const page = await connector.getChanges('', ctx)
    const svc = new ImportService()
    svc.runImport(integrationId, entityType, page.items.map((i) => i.data), [])
    return { processed: page.items.length }
  }
}

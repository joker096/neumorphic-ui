// Integration Hub core (blueprint §2/§7/§13/§15/§22).
// Orchestrates integrations; depends only on the Connector interface + a Store.
// Phase 1: persistent SQLite Store (production target = PostgreSQL migrations/001_init.sql).

import { nanoid } from 'nanoid'
import { SqliteStore } from './SqliteStore.js'
import type {
  Connector, ConnectorCapabilities, CredentialHandle, EntityType, IntegrationContext,
} from './Connector.js'
import { IntegrationError, StaticCredentialHandle } from './Connector.js'
import type { FieldMapping } from '../mapping/MappingEngine.js'
import { connectorRegistry } from './ConnectorRegistry.js'
import { AmoConnector } from '../providers/amocrm.js'
import { Bitrix24Connector } from '../providers/bitrix24.js'
import { OneCConnector } from '../providers/1c.js'
import { MemoryQueue } from '../queue/MemoryQueue.js'
import { audit } from '../observability/AuditLogger.js'
import { metrics } from '../observability/Metrics.js'
import { health } from '../observability/HealthService.js'

export interface IntegrationRecord {
  id: string
  organizationId: string
  provider: string
  name: string
  status: 'draft' | 'connecting' | 'connected' | 'error' | 'paused'
  syncDirection: 'inbound' | 'outbound' | 'bidirectional' | 'read_only'
  config: Record<string, unknown>
  mappings?: FieldMapping[]
  createdAt: string
}

export interface Store {
  list(orgId: string): IntegrationRecord[]
  get(id: string): IntegrationRecord | undefined
  save(rec: IntegrationRecord): void
  remove(id: string): void
}

class MemoryStore implements Store {
  private map = new Map<string, IntegrationRecord>()
  list(orgId: string): IntegrationRecord[] {
    return [...this.map.values()].filter((r) => r.organizationId === orgId)
  }
  get(id: string): IntegrationRecord | undefined {
    return this.map.get(id)
  }
  save(rec: IntegrationRecord): void {
    this.map.set(rec.id, rec)
  }
  remove(id: string): void {
    this.map.delete(id)
  }
}

export class IntegrationManager {
  private store: Store

  constructor(store: Store = new SqliteStore()) {
    this.store = store
    // Register reference connectors (blueprint §55 first providers).
    connectorRegistry.register(new AmoConnector())
    connectorRegistry.register(new Bitrix24Connector())
    connectorRegistry.register(new OneCConnector())
  }

  list(orgId: string): IntegrationRecord[] {
    return this.store.list(orgId)
  }

  get(id: string): IntegrationRecord | undefined {
    return this.store.get(id)
  }

  create(
    orgId: string,
    provider: string,
    name: string,
    syncDirection: IntegrationRecord['syncDirection'] = 'inbound',
    config: Record<string, unknown> = {},
  ): IntegrationRecord {
    if (!connectorRegistry.has(provider)) {
      throw new IntegrationError('VALIDATION', `Unknown provider: ${provider}`)
    }
    const rec: IntegrationRecord = {
      id: nanoid(),
      organizationId: orgId,
      provider,
      name,
      status: 'draft',
      syncDirection,
      config,
      createdAt: new Date().toISOString(),
    }
    this.store.save(rec)
    audit.log({ organizationId: orgId, integrationId: rec.id, actor: orgId, action: 'create', status: 'success' })
    metrics.inc('integrations_created')
    return rec
  }

  async connect(
    id: string,
    input: { organizationId: string; credentials: CredentialHandle; config?: Record<string, unknown> },
  ): Promise<ConnectorCapabilities> {
    const rec = this.store.get(id)
    if (!rec) throw new IntegrationError('NOT_FOUND', 'Integration not found')
    const connector: Connector = connectorRegistry.get(rec.provider)
    const ctx: IntegrationContext = {
      organizationId: input.organizationId,
      integrationId: id,
      provider: rec.provider,
      credentials: input.credentials,
      config: input.config ?? rec.config,
    }
    rec.status = 'connecting'
    this.store.save(rec)
    try {
      await connector.connect(ctx)
      const test = await connector.testConnection(ctx)
      rec.status = test.ok ? 'connected' : 'error'
      this.store.save(rec)
      health.set(id, test.ok ? 'HEALTHY' : 'REAUTH_REQUIRED')
      audit.log({ organizationId: input.organizationId, integrationId: id, actor: input.organizationId, action: 'connect', status: test.ok ? 'success' : 'error' })
      return connector.getCapabilities()
    } catch (e) {
      rec.status = 'error'
      this.store.save(rec)
      health.set(id, 'ERROR')
      const err = e as Error
      audit.log({ organizationId: input.organizationId, integrationId: id, actor: input.organizationId, action: 'connect', status: 'error', errorCode: 'PROVIDER', errorMessage: err.message })
      throw e
    }
  }

  disconnect(id: string): void {
    const rec = this.store.get(id)
    if (!rec) throw new IntegrationError('NOT_FOUND', 'Integration not found')
    rec.status = 'paused'
    this.store.save(rec)
  }

  remove(id: string): void {
    const rec = this.store.get(id)
    if (!rec) throw new IntegrationError('NOT_FOUND', 'Integration not found')
    this.store.remove(id)
  }

  connectorList(): { provider: string; capabilities: ConnectorCapabilities }[] {
    return connectorRegistry.list().map((c) => ({ provider: c.provider, capabilities: c.getCapabilities() }))
  }

  // Enqueue an import job (blueprint §22/§25). Phase 1 queue = in-memory; BullMQ is the prod target.
  enqueueImport(id: string, entityType: EntityType, records: Record<string, unknown>[] = []): { jobId: string } {
    const rec = this.store.get(id)
    if (!rec) throw new IntegrationError('NOT_FOUND', 'Integration not found')
    const jobId = nanoid()
    void integrationQueue.enqueue({ jobId, integrationId: id, entityType, records })
    metrics.inc('imports_enqueued')
    return { jobId }
  }

  saveMappings(id: string, mappings: FieldMapping[]): void {
    const rec = this.store.get(id)
    if (!rec) throw new IntegrationError('NOT_FOUND', 'Integration not found')
    rec.mappings = mappings
    this.store.save(rec)
  }
}

// Process-wide singletons used by the HTTP route.
export const integrationManager = new IntegrationManager()
export const integrationQueue = new MemoryQueue()

export { StaticCredentialHandle }

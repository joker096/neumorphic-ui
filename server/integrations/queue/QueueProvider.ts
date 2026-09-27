// Integration Hub queue contract (blueprint §25/§26).
import type { EntityType } from '../core/Connector.js'

export interface QueueJob {
  jobId?: string
  type?: 'import' | 'webhook'
  integrationId: string
  entityType: EntityType
  records: Record<string, unknown>[]
  payload?: { provider: string; body: string; eventId: string }
}

export interface QueueProvider {
  /**
   * Accepts a job. Synchronous so back-pressure is visible to the caller
   * (a bounded queue rejects with `IntegrationError('RATE_LIMIT')`); the
   * processing itself is asynchronous.
   */
  enqueue(job: QueueJob): void
}

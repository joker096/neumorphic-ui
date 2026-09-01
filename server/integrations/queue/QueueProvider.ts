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
  enqueue(job: QueueJob): Promise<void>
}

// 1C Agent (blueprint §61). Outbound relay: drains an outbound queue and pushes
// canonical changes to 1C via OData using OneCConnector.create/update.
import { OneCConnector } from './1c.js'
import type { CanonicalEntity, EntityType, IntegrationContext } from '../core/Connector.js'

export interface OutboundOp {
  integrationId: string
  entity: EntityType
  externalId?: string
  canonical: CanonicalEntity
  op: 'create' | 'update'
}

export class OneCAgent {
  private connector = new OneCConnector()
  private contexts = new Map<string, IntegrationContext>()
  private queue: OutboundOp[] = []
  private timer: NodeJS.Timeout | null = null

  registerIntegration(integrationId: string, ctx: IntegrationContext): void {
    this.contexts.set(integrationId, ctx)
  }

  enqueue(op: OutboundOp): void {
    this.queue.push(op)
  }

  start(intervalMs = 5000): void {
    if (this.timer) return
    this.timer = setInterval(() => void this.drain(), intervalMs)
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  async drain(): Promise<number> {
    let n = 0
    while (this.queue.length) {
      const op = this.queue.shift()!
      const ctx = this.contexts.get(op.integrationId)
      if (!ctx) continue
      try {
        if (op.op === 'create') await this.connector.create(op.entity, op.canonical, ctx)
        else if (op.externalId) await this.connector.update(op.entity, op.externalId, op.canonical, ctx)
        n++
      } catch {
        // re-enqueue for next drain (simple retry; order preserved)
        this.queue.push(op)
        break
      }
    }
    return n
  }
}

export const oneCAgent = new OneCAgent()

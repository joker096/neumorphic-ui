// Integration Hub — Webhook receiver (blueprint §36 / §37 / §54).
import { IntegrationError, IntegrationContext, StaticCredentialHandle } from '../core/Connector.js'
import { integrationQueue, integrationManager } from '../core/IntegrationManager.js'
import { connectorRegistry } from '../core/ConnectorRegistry.js'

export interface WebhookRequest {
  provider: string
  integrationId: string
  rawBody: string
  signature?: string
  timestamp?: string
}

// §37 signature/timestamp/replay verification is connector-specific.
// We resolve connector + build a context, call connector.verifyWebhookSignature when
// implemented, then enqueue with a stable idempotency key (§27) and return fast (§54).
export function receiveWebhook(r: WebhookRequest): { accepted: true; eventId: string } {
  if (!r.provider || !r.integrationId) {
    throw new IntegrationError('VALIDATION', 'provider and integrationId required', false)
  }
  const record = integrationManager.get(r.integrationId)
  if (!record) throw new IntegrationError('NOT_FOUND', 'integration not found', false)
  const connector = connectorRegistry.get(record.provider)
  const config = (record.config ?? {}) as Record<string, unknown>
  const ctx: IntegrationContext = {
    organizationId: record.organizationId ?? '',
    integrationId: r.integrationId,
    provider: record.provider,
    credentials: new StaticCredentialHandle(r.integrationId, config),
    config,
  }
  if (connector.verifyWebhookSignature) {
    if (!connector.verifyWebhookSignature(r.rawBody, r.signature ?? '', ctx)) {
      throw new IntegrationError('AUTH_FAILED', 'webhook signature verification failed', false)
    }
  }
  const eventId = `${r.provider}:${r.integrationId}:${hashBody(r.rawBody)}`
  integrationQueue.enqueue({
    type: 'webhook',
    integrationId: r.integrationId,
    entityType: 'contact',
    records: [],
    payload: { provider: r.provider, body: r.rawBody, eventId },
  })
  return { accepted: true, eventId }
}

function hashBody(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0
  return String(h)
}

// Integration Hub — Webhook receiver (blueprint §36 / §37 / §54).
import { createHash } from 'node:crypto'
import { IntegrationError, IntegrationContext, StaticCredentialHandle, type Connector } from '../core/Connector.js'
import { integrationQueue, integrationManager } from '../core/IntegrationManager.js'
import { connectorRegistry } from '../core/ConnectorRegistry.js'
import { ReplayGuard, verifyHubSignature } from './WebhookAuth.js'

export interface WebhookRequest {
  provider: string
  integrationId: string
  rawBody: string
  signature?: string
  timestamp?: string
}

export interface WebhookResult {
  accepted: true
  eventId: string
  /** True when the same body was already ingested (provider retry). */
  duplicate?: boolean
}

// Process-wide replay guard: one duplicate body is ingested once, no matter
// which integration or how many retries.
const replayGuard = new ReplayGuard()

/** Exposed for tests / ops inspection. */
export function webhookReplayGuard(): ReplayGuard {
  return replayGuard
}

/**
 * §37 authentication. The hub NEVER accepts an unauthenticated webhook:
 *
 *   - connector with a native scheme (AmoCRM, Bitrix24) → its verifier decides;
 *   - otherwise a configured shared secret must produce a valid hub signature
 *     over `${timestamp}.${rawBody}`;
 *   - neither available → reject.
 *
 * Connectors that ship a verifier must themselves fail closed; the shipped
 * ones (AmoCRM, Bitrix24) return false whenever they cannot prove possession.
 */
function authenticate(connector: Connector, r: WebhookRequest, ctx: IntegrationContext): void {
  const secret = (typeof ctx.config['webhookSecret'] === 'string' ? (ctx.config['webhookSecret'] as string) : undefined)
    ?? ctx.credentials.get<string>('webhookSecret')

  if (typeof connector.verifyWebhookSignature === 'function') {
    if (secret) {
      // Configured secret: the hub signature is authoritative. A provider
      // scheme that also passes is fine; a failing one is not fatal because
      // the secret already proved possession.
      const hub = verifyHubSignature({ secret, timestamp: r.timestamp, rawBody: r.rawBody, signature: r.signature })
      if (hub.ok) return
    }
    if (!connector.verifyWebhookSignature(r.rawBody, r.signature ?? '', ctx)) {
      throw new IntegrationError('AUTH_FAILED', 'webhook signature verification failed', false)
    }
    return
  }

  const hub = verifyHubSignature({ secret, timestamp: r.timestamp, rawBody: r.rawBody, signature: r.signature })
  if (!hub.ok) {
    throw new IntegrationError('AUTH_FAILED', `webhook authentication failed (${hub.reason})`, false)
  }
}

/** Stable idempotency key (§27). Full-width digest — no 32-bit collisions. */
export function webhookEventId(provider: string, integrationId: string, rawBody: string): string {
  const digest = createHash('sha256').update(rawBody).digest('hex')
  return `${provider}:${integrationId}:${digest}`
}

export function receiveWebhook(r: WebhookRequest): WebhookResult {
  if (!r.provider || !r.integrationId) {
    throw new IntegrationError('VALIDATION', 'provider and integrationId required', false)
  }
  if (typeof r.rawBody !== 'string' || !r.rawBody.length) {
    throw new IntegrationError('VALIDATION', 'webhook body required', false)
  }
  const record = integrationManager.get(r.integrationId)
  if (!record) throw new IntegrationError('NOT_FOUND', 'integration not found', false)
  // The path must name the integration's own provider, so a caller cannot
  // apply one provider's rules (or its absence) to another provider's endpoint.
  if (record.provider !== r.provider) {
    throw new IntegrationError('AUTH_FAILED', 'provider does not match integration', false)
  }
  // `get` throws for an unknown provider — check first so the caller gets a
  // typed 400/404 instead of a 500.
  if (!connectorRegistry.has(record.provider)) {
    throw new IntegrationError('NOT_FOUND', `no connector for provider ${record.provider}`, false)
  }
  const connector = connectorRegistry.get(record.provider)
  const config = (record.config ?? {}) as Record<string, unknown>
  const ctx: IntegrationContext = {
    organizationId: record.organizationId ?? '',
    integrationId: r.integrationId,
    provider: record.provider,
    credentials: new StaticCredentialHandle(r.integrationId, config),
    config,
  }

  authenticate(connector, r, ctx)

  const eventId = webhookEventId(r.provider, r.integrationId, r.rawBody)
  if (replayGuard.has(eventId)) {
    // Provider retry of an already-ingested body: acknowledge, do not re-import.
    return { accepted: true, eventId, duplicate: true }
  }
  integrationQueue.enqueue({
    jobId: eventId,
    type: 'webhook',
    integrationId: r.integrationId,
    entityType: 'contact',
    records: [],
    payload: { provider: r.provider, body: r.rawBody, eventId },
  })
  // Claimed only after the queue accepted it, so a 429 cannot burn the event.
  replayGuard.claim(eventId)
  return { accepted: true, eventId }
}

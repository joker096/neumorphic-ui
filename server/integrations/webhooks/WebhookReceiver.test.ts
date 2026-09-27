import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createHash } from 'node:crypto'

// The receiver talks to the process-wide integration manager + queue, so both
// are stubbed: this suite is about authentication, not the import pipeline.
const getRecord = vi.fn()
const enqueue = vi.fn()
const getConnector = vi.fn()

vi.mock('../core/IntegrationManager.js', () => ({
  integrationManager: { get: (id: string) => getRecord(id) },
  integrationQueue: { enqueue: (job: unknown) => enqueue(job) },
}))
vi.mock('../core/ConnectorRegistry.js', () => ({
  connectorRegistry: {
    has: (provider: string) => getConnector(provider) !== undefined,
    get: (provider: string) => getConnector(provider),
  },
}))

import { receiveWebhook, webhookEventId, webhookReplayGuard } from './WebhookReceiver.js'
import { signHmacWebhook, webhookSigningString } from './WebhookAuth.js'
import { IntegrationError } from '../core/Connector.js'

const SECRET = 'whsec_test_secret'

// The replay guard is process-wide and keyed on the body, so every test signs
// and ingests its own payload.
let bodySeq = 0
function body(): string {
  bodySeq += 1
  return `{"event":"contact.created","n":${bodySeq}}`
}

function withSecret(extra: Record<string, unknown> = {}) {
  getRecord.mockReturnValue({
    id: 'int_1', organizationId: '1', provider: 'amocrm', name: 'Amo',
    config: { webhookSecret: SECRET, ...extra },
  })
}

function nativeVerifier(ok: boolean) {
  return { verifyWebhookSignature: vi.fn(() => ok) }
}

describe('receiveWebhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: a connector with no provider-native scheme of its own.
    getConnector.mockReturnValue({})
  })

  describe('fail-closed authentication', () => {
    it('rejects a request with no signature', () => {
      withSecret()
      expect(() => receiveWebhook({ provider: 'amocrm', integrationId: 'int_1', rawBody: body() }))
        .toThrowError(IntegrationError)
      expect(enqueue).not.toHaveBeenCalled()
    })

    it('rejects a connector without a verifier and without a secret', () => {
      getRecord.mockReturnValue({ id: 'int_1', organizationId: '1', provider: 'onec', config: {} })
      getConnector.mockReturnValue({})
      expect(() => receiveWebhook({
        provider: 'onec', integrationId: 'int_1', rawBody: body(), signature: 'anything', timestamp: String(Date.now()),
      })).toThrowError(/webhook authentication failed \(missing_secret\)/)
      expect(enqueue).not.toHaveBeenCalled()
    })

    it('rejects a connector whose native verifier fails', () => {
      withSecret()
      getConnector.mockReturnValue(nativeVerifier(false))
      expect(() => receiveWebhook({
        provider: 'amocrm', integrationId: 'int_1', rawBody: body(), signature: 'sha256=deadbeef', timestamp: String(Date.now()),
      })).toThrowError(/signature verification failed/)
      expect(enqueue).not.toHaveBeenCalled()
    })

    it('rejects a wrong hub signature', () => {
      withSecret()
      const payload = body()
      const ts = String(Date.now())
      // Correct shape, wrong key.
      const bad = signHmacWebhook('not-the-secret', ts, payload)
      expect(() => receiveWebhook({ provider: 'amocrm', integrationId: 'int_1', rawBody: payload, signature: bad, timestamp: ts }))
        .toThrowError(/webhook authentication failed \(bad_signature\)/)
      expect(enqueue).not.toHaveBeenCalled()
    })

    it('rejects a valid signature replayed outside the tolerance window', () => {
      withSecret()
      const payload = body()
      const ts = String(Date.now() - 3_600_000)
      expect(() => receiveWebhook({
        provider: 'amocrm', integrationId: 'int_1', rawBody: payload,
        signature: signHmacWebhook(SECRET, ts, payload), timestamp: ts,
      })).toThrowError(/stale_timestamp/)
      expect(enqueue).not.toHaveBeenCalled()
    })
  })

  describe('accepted', () => {
    it('accepts a correctly hub-signed webhook and queues it', () => {
      withSecret()
      const payload = body()
      const ts = String(Date.now())
      const r = receiveWebhook({
        provider: 'amocrm', integrationId: 'int_1', rawBody: payload,
        signature: signHmacWebhook(SECRET, ts, payload), timestamp: ts,
      })
      expect(r.accepted).toBe(true)
      expect(r.duplicate).toBeUndefined()
      expect(enqueue).toHaveBeenCalledTimes(1)
      expect(enqueue.mock.calls[0][0]).toMatchObject({
        type: 'webhook', integrationId: 'int_1', jobId: r.eventId,
      })
    })

    it('accepts a provider-native signature when the connector verifies it', () => {
      withSecret()
      getConnector.mockReturnValue(nativeVerifier(true))
      const r = receiveWebhook({ provider: 'amocrm', integrationId: 'int_1', rawBody: body(), signature: 'provider-sig' })
      expect(r.accepted).toBe(true)
      expect(enqueue).toHaveBeenCalledTimes(1)
    })
  })

  describe('replay + idempotency', () => {
    it('ingests a body once and reports later deliveries as duplicates', () => {
      withSecret()
      getConnector.mockReturnValue(nativeVerifier(true))
      const payload = body()
      const first = receiveWebhook({ provider: 'amocrm', integrationId: 'int_1', rawBody: payload, signature: 'sig' })
      const second = receiveWebhook({ provider: 'amocrm', integrationId: 'int_1', rawBody: payload, signature: 'sig' })
      expect(first.duplicate).toBeUndefined()
      expect(second.duplicate).toBe(true)
      expect(second.eventId).toBe(first.eventId)
      expect(enqueue).toHaveBeenCalledTimes(1)
    })

    it('gives different bodies different event ids (no 32-bit collision)', () => {
      expect(webhookEventId('amocrm', 'int_1', '{"a":1}'))
        .not.toBe(webhookEventId('amocrm', 'int_1', '{"a":2}'))
      const digest = createHash('sha256').update('{"a":1}').digest('hex')
      expect(webhookEventId('amocrm', 'int_1', '{"a":1}')).toBe(`amocrm:int_1:${digest}`)
    })

    it('exposes the shared replay guard', () => {
      expect(webhookReplayGuard().size).toBeGreaterThanOrEqual(0)
    })
  })

  describe('validation', () => {
    it('rejects an unknown integration', () => {
      getRecord.mockReturnValue(undefined)
      expect(() => receiveWebhook({ provider: 'amocrm', integrationId: 'nope', rawBody: body() }))
        .toThrowError(/integration not found/)
    })

    it('rejects a path provider that does not match the integration', () => {
      withSecret()
      expect(() => receiveWebhook({ provider: 'bitrix24', integrationId: 'int_1', rawBody: body(), signature: 'sig' }))
        .toThrowError(/provider does not match/)
    })

    it('rejects an empty body', () => {
      withSecret()
      expect(() => receiveWebhook({ provider: 'amocrm', integrationId: 'int_1', rawBody: '', signature: 'sig' }))
        .toThrowError(/webhook body required/)
    })
  })
})

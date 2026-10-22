import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  allowConnection,
  allowPeerLookup,
  MAX_CONNECTIONS_PER_MINUTE,
  MAX_PEER_LOOKUPS_PER_MINUTE,
} from '../middleware/connectionLimit.js'
import { resetRateLimits } from '../middleware/rateLimit.js'

const ROOT = join(process.cwd(), 'server')

describe('signaling server connection budgets', () => {
  beforeEach(() => {
    resetRateLimits()
  })

  it('allows 240 websocket handshakes per client IP and denies the next one', () => {
    for (let i = 0; i < MAX_CONNECTIONS_PER_MINUTE; i++) {
      expect(allowConnection('10.0.0.1')).toBe(true)
    }
    expect(allowConnection('10.0.0.1')).toBe(false)
  })

  it('keeps the handshake budget of two client IPs apart', () => {
    for (let i = 0; i < MAX_CONNECTIONS_PER_MINUTE; i++) {
      expect(allowConnection('10.0.0.2')).toBe(true)
    }
    expect(allowConnection('10.0.0.2')).toBe(false)
    expect(allowConnection('10.0.0.3')).toBe(true)
  })

  it('allows 60 peer-directory lookups per client IP and denies the next one', () => {
    for (let i = 0; i < MAX_PEER_LOOKUPS_PER_MINUTE; i++) {
      expect(allowPeerLookup('10.0.0.4')).toBe(true)
    }
    expect(allowPeerLookup('10.0.0.4')).toBe(false)
  })

  it('keeps the handshake budget and the peer-lookup budget independent', () => {
    for (let i = 0; i < MAX_PEER_LOOKUPS_PER_MINUTE; i++) {
      expect(allowPeerLookup('10.0.0.5')).toBe(true)
    }
    expect(allowPeerLookup('10.0.0.5')).toBe(false)
    expect(allowConnection('10.0.0.5')).toBe(true)
  })

  it('shares one bucket implementation with the rest of the server', () => {
    const src = readFileSync(join(ROOT, 'signaling-server.ts'), 'utf8')
    // The hand-rolled limiter must be gone - the budgets live in the shared one.
    expect(src).not.toMatch(/connectionAttempts/)
    expect(src).not.toMatch(/checkConnectionRateLimit/)
    expect(src).toMatch(/allowConnection\(/)
    expect(src).toMatch(/allowPeerLookup\(/)
  })
})

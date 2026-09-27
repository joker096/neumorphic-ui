import { describe, it, expect, afterEach } from 'vitest'
import { normalizeIp, resolveClientIp, setTrustedProxies } from '../middleware/clientIp'
import type { IncomingMessage } from 'node:http'

/** Minimal IncomingMessage stand-in: only socket + headers are consulted. */
function req(remoteAddress: string | undefined, headers: Record<string, string> = {}): IncomingMessage {
  return { socket: { remoteAddress }, headers } as unknown as IncomingMessage
}

afterEach(() => setTrustedProxies(null))

describe('normalizeIp', () => {
  it('unwraps IPv4-mapped IPv6 and lowercases', () => {
    expect(normalizeIp('::ffff:203.0.113.7')).toBe('203.0.113.7')
    expect(normalizeIp('FE80::1%eth0')).toBe('fe80::1')
    expect(normalizeIp('  198.51.100.9  ')).toBe('198.51.100.9')
  })

  it('drops a port from a bare IPv4 literal', () => {
    expect(normalizeIp('203.0.113.7:44321')).toBe('203.0.113.7')
  })

  it('returns empty string for junk', () => {
    expect(normalizeIp('')).toBe('')
    expect(normalizeIp(undefined)).toBe('')
  })
})

describe('resolveClientIp', () => {
  it('uses the X-Forwarded-For client when the peer is a trusted proxy', () => {
    // The P0-1 regression: behind nginx the peer is loopback for everyone.
    expect(resolveClientIp(req('::ffff:127.0.0.1', { 'x-forwarded-for': '203.0.113.7' }))).toBe('203.0.113.7')
  })

  it('keeps distinct buckets for distinct clients behind one proxy', () => {
    const a = resolveClientIp(req('127.0.0.1', { 'x-forwarded-for': '203.0.113.7' }))
    const b = resolveClientIp(req('127.0.0.1', { 'x-forwarded-for': '198.51.100.9' }))
    expect(a).not.toBe(b)
  })

  it('ignores X-Forwarded-For from an untrusted peer (no header spoofing)', () => {
    setTrustedProxies(['10.0.0.1'])
    expect(resolveClientIp(req('203.0.113.7', { 'x-forwarded-for': '198.51.100.9' }))).toBe('203.0.113.7')
  })

  it('walks a proxy chain and returns the rightmost untrusted hop', () => {
    setTrustedProxies(['127.0.0.1', '10.0.0.1'])
    // client, untrusted edge, trusted inner proxy (us)
    const r = resolveClientIp(req('127.0.0.1', { 'x-forwarded-for': '203.0.113.7, 198.51.100.9, 10.0.0.1' }))
    expect(r).toBe('198.51.100.9')
  })

  it('returns the leftmost hop when every entry is a trusted proxy', () => {
    setTrustedProxies(['127.0.0.1', '10.0.0.1', '10.0.0.2'])
    expect(resolveClientIp(req('127.0.0.1', { 'x-forwarded-for': '10.0.0.1, 10.0.0.2' }))).toBe('10.0.0.1')
  })

  it('treats a non-loopback hop as the client when it is not trusted', () => {
    // 10.0.0.1/2 are unknown hops here, so the rightmost one wins.
    expect(resolveClientIp(req('127.0.0.1', { 'x-forwarded-for': '10.0.0.1, 10.0.0.2' }))).toBe('10.0.0.2')
  })

  it('falls back to X-Real-IP, then to the peer', () => {
    expect(resolveClientIp(req('127.0.0.1', { 'x-real-ip': '203.0.113.7' }))).toBe('203.0.113.7')
    expect(resolveClientIp(req('127.0.0.1'))).toBe('127.0.0.1')
    expect(resolveClientIp(req(undefined))).toBe('unknown')
  })

  it('skips empty X-Forwarded-For entries', () => {
    expect(resolveClientIp(req('127.0.0.1', { 'x-forwarded-for': '203.0.113.7, , ' }))).toBe('203.0.113.7')
  })
})

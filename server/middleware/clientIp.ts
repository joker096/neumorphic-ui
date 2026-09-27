/**
 * Trusted-proxy-aware client IP resolution.
 *
 * Behind nginx every request reaches the Node process from loopback, so
 * `req.socket.remoteAddress` collapses to 127.0.0.1 for the whole internet and
 * all per-IP rate limits become one global bucket. That is a remote DoS: 3
 * requests to /api/auth/verify-2fa lock 2FA out for every client.
 *
 * Rule: X-Forwarded-For is honoured ONLY when the immediate peer is a trusted
 * proxy, then the rightmost untrusted entry wins (the value appended by the
 * last proxy in front of us). An untrusted peer can therefore neither read nor
 * forge a client IP by setting the header itself.
 */
import type { IncomingMessage } from 'node:http'

/** Loopback by default: nginx runs on the same host (see mess.cvr.name.conf). */
const DEFAULT_TRUSTED_PROXIES = ['127.0.0.1', '::1', '::ffff:127.0.0.1']

const LOOPBACK = DEFAULT_TRUSTED_PROXIES

/** IPv4-mapped IPv6 (`::ffff:1.2.3.4`) → `1.2.3.4`, lowercase, no port. */
export function normalizeIp(raw: string | undefined | null): string {
  if (!raw) return ''
  let ip = String(raw).trim().toLowerCase()
  if (!ip) return ''
  // Strip an IPv6 zone index (`%eth0`) and a trailing `:port` on bare IPv4.
  const zone = ip.indexOf('%')
  if (zone !== -1) ip = ip.slice(0, zone)
  if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(ip)) ip = ip.slice(0, ip.lastIndexOf(':'))
  if (ip.startsWith('::ffff:') && /^\d{1,3}(\.\d{1,3}){3}$/.test(ip.slice(7))) {
    ip = ip.slice(7)
  }
  return ip
}

let _trusted: Set<string> | null = null

/** Trusted proxy allowlist. `TRUSTED_PROXIES` overrides the loopback default. */
export function trustedProxies(): Set<string> {
  if (_trusted) return _trusted
  const raw = process.env.TRUSTED_PROXIES
  const list = raw && raw.trim()
    ? raw.split(',').map((s) => normalizeIp(s)).filter(Boolean)
    : LOOPBACK.slice()
  _trusted = new Set(list)
  return _trusted
}

/** Test seam: force a specific trusted-proxy allowlist. */
export function setTrustedProxies(list: string[] | null): void {
  _trusted = list === null ? null : new Set(list.map(normalizeIp).filter(Boolean))
}

function header(req: IncomingMessage, name: string): string {
  const v = req.headers[name]
  if (Array.isArray(v)) return v.join(',')
  return typeof v === 'string' ? v : ''
}

/**
 * Resolve the client IP for rate limiting and connection logging.
 * Falls back to the socket peer when no forwarded header is present.
 */
export function resolveClientIp(req: IncomingMessage): string {
  const peer = normalizeIp(req.socket?.remoteAddress) || 'unknown'
  const trusted = trustedProxies()
  if (!trusted.has(peer)) return peer

  const chain = header(req, 'x-forwarded-for')
    .split(',')
    .map(normalizeIp)
    .filter(Boolean)
  if (chain.length === 0) {
    const real = normalizeIp(header(req, 'x-real-ip'))
    return real || peer
  }
  // Rightmost untrusted entry = the address the last trusted proxy observed.
  for (let i = chain.length - 1; i >= 0; i--) {
    if (!trusted.has(chain[i]!)) return chain[i]!
  }
  return chain[0]!
}

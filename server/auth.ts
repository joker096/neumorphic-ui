import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import { TOTP } from 'otpauth'
import { createHmac } from 'node:crypto'
import { getDb } from './db.js'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  console.warn('WARN: JWT_SECRET not set. Signaling server will fail to start.')
  console.warn('CLI commands work without it. Run once: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"')
}

/**
 * Two token families, two keys, two audiences.
 *
 * Admin session tokens and relay connection tokens used to share one key and
 * one verifier, so a 24h admin token was also a relay credential and a
 * publicly-minted relay token was accepted anywhere an admin token was
 * expected (the scope claim existed but nothing checked it). The relay key is
 * derived from JWT_SECRET with a domain separator, so deployments need no new
 * configuration while the two token types can no longer be confused.
 */
const RELAY_KEY_INFO = 'messanger/relay-jwt/v1'
export const TOKEN_AUD_ADMIN = 'admin'
export const TOKEN_AUD_RELAY = 'relay'

let _relaySecretCache: string | null = null

function relaySecret(): string {
  if (_relaySecretCache) return _relaySecretCache
  if (!JWT_SECRET) throw new Error('JWT_SECRET not configured. Cannot sign or verify relay token.')
  const explicit = process.env.RELAY_JWT_SECRET
  if (explicit) {
    if (explicit === JWT_SECRET) {
      throw new Error('RELAY_JWT_SECRET must differ from JWT_SECRET (relay tokens would be admin tokens).')
    }
    _relaySecretCache = explicit
  } else {
    // Domain-separated derivation: a distinct key, same operational secret.
    _relaySecretCache = createHmac('sha256', JWT_SECRET).update(RELAY_KEY_INFO).digest('hex')
  }
  return _relaySecretCache
}

export interface JwtPayload {
  adminId: number
  username: string
}

export interface RelayTokenPayload {
  id: string
  scope: typeof TOKEN_AUD_RELAY
}

/** Admin session token. Only ever verified by `verifyAdminToken`. */
export function signToken(payload: JwtPayload): string {
  if (!JWT_SECRET) throw new Error('JWT_SECRET not configured. Cannot sign token.')
  return jwt.sign(
    { ...payload, scope: TOKEN_AUD_ADMIN },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '24h', audience: TOKEN_AUD_ADMIN } as jwt.SignOptions,
  )
}

/**
 * Mint a short-lived relay connection token for app clients. The signaling
 * WebSocket handshake requires `?token=<jwt>`; this endpoint lets any client
 * obtain one. Message confidentiality is enforced client-side by
 * per-session ECDH-derived AES-GCM encryption (see P2PTransport), not by the
 * relay.
 */
export function signRelayToken(id: string, expiresIn: string | number = '1h'): string {
  return jwt.sign(
    { id, sub: id, scope: TOKEN_AUD_RELAY },
    relaySecret(),
    { algorithm: 'HS256', expiresIn, audience: TOKEN_AUD_RELAY } as jwt.SignOptions,
  )
}

/** Verify an admin session token. Rejects relay tokens by key and audience. */
export function verifyAdminToken(token: string): JwtPayload {
  if (!JWT_SECRET) throw new Error('JWT_SECRET not configured. Cannot verify token.')
  const payload = jwt.verify(token, JWT_SECRET, {
    algorithms: ['HS256'],
    audience: TOKEN_AUD_ADMIN,
  }) as JwtPayload & { scope?: string }
  if (payload.scope !== TOKEN_AUD_ADMIN) throw new Error('Token is not an admin session token.')
  return payload
}

/** Verify a relay connection token. Rejects admin tokens by key and audience. */
export function verifyRelayToken(token: string): RelayTokenPayload {
  const payload = jwt.verify(token, relaySecret(), {
    algorithms: ['HS256'],
    audience: TOKEN_AUD_RELAY,
  }) as RelayTokenPayload
  if (payload.scope !== TOKEN_AUD_RELAY) throw new Error('Token is not a relay token.')
  return payload
}

export function generateTotpSecret(): { secret: string; uri: string } {
  const totp = new TOTP({
    issuer: 'Mess&Anger',
    label: 'admin',
    algorithm: 'SHA256',
    digits: 6,
    period: 30,
  })
  return {
    secret: totp.secret.base32,
    uri: totp.toString(),
  }
}

export function verifyTotp(secretBase32: string, token: string): boolean {
  const totp = new TOTP({
    secret: secretBase32,
    algorithm: 'SHA256',
    digits: 6,
    period: 30,
  })
  const delta = totp.validate({ token, window: 0 })
  return delta !== null
}

export function createAdminSession(adminId: number, token: string): void {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  getDb().prepare('INSERT INTO sessions (admin_id, token, expires_at) VALUES (?, ?, ?)').run(adminId, token, expiresAt)
}

export function validateSession(token: string): JwtPayload | null {
  try {
    // Admin audience is enforced here as well as by the DB row, so a token
    // that is somehow present in `sessions` still needs the right scope.
    const payload = verifyAdminToken(token)
    const row = getDb().prepare(
      "SELECT id FROM sessions WHERE token = ? AND expires_at > datetime('now')"
    ).get(token)
    if (!row) return null
    return payload
  } catch {
    return null
  }
}

export function invalidateSession(token: string): void {
  getDb().prepare('DELETE FROM sessions WHERE token = ?').run(token)
}

import { IncomingMessage, ServerResponse } from 'node:http'
import { validateSession } from '../auth.js'

export interface AuthenticatedRequest extends IncomingMessage {
  admin?: { adminId: number; username: string }
}

/** Outcome of a bearer-token check. */
export interface AuthResult {
  /** True when the request carries a valid administrator token. */
  ok: boolean
  /** The administrator behind the token (only set when `ok` is true). */
  admin?: { adminId: number; username: string }
  /** Why the check failed (only set when `ok` is false). */
  reason?: 'missing' | 'invalid'
}

/**
 * Check the bearer token of a request.
 *
 * Split out of `requireAuth` so a caller can decide what to answer for a
 * failed check - the rate-limited admin endpoints answer 429 instead of 401
 * once the anonymous budget of that IP is spent.
 */
export function authenticate(req: IncomingMessage): AuthResult {
  const authHeader = req.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { ok: false, reason: 'missing' }
  }

  const payload = validateSession(authHeader.slice(7))
  if (!payload) {
    return { ok: false, reason: 'invalid' }
  }
  return { ok: true, admin: payload }
}

/** Write the 401 answer for a failed bearer-token check. */
export function writeUnauthorized(res: ServerResponse, reason: 'missing' | 'invalid' = 'invalid'): void {
  res.writeHead(401, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: reason === 'missing' ? 'Missing authorization header' : 'Invalid or expired token' }))
}

export function requireAuth(req: AuthenticatedRequest, res: ServerResponse): boolean {
  const result = authenticate(req)
  if (!result.ok) {
    writeUnauthorized(res, result.reason ?? 'invalid')
    return false
  }

  req.admin = result.admin!
  return true
}

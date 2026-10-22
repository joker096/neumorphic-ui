import { checkRateLimit } from './rateLimit.js'

/**
 * Budgets for the two public entry points of the signaling server.
 *
 * The buckets live in the shared limiter (see ./rateLimit.ts) - one map, one
 * sweeper, one place to audit. This module only owns the numbers and the keys.
 */

/**
 * 240/min per *real* client IP. This used to be 60/min keyed on the raw socket
 * peer, which behind nginx is 127.0.0.1 for every user on the internet - 60
 * connects/min fleet-wide, and any burst past it produced self-sustaining 1008
 * "Too many connections" denials. Carrier-grade NAT puts many users on one
 * public IP, so the ceiling has to cover a shared egress, not a single socket.
 */
export const MAX_CONNECTIONS_PER_MINUTE = 240

/**
 * 60/min per client IP for the unauthenticated peer directory lookup.
 *
 * The lookup answers "is this identity online", so an unbudgeted endpoint is
 * a presence oracle an attacker can hammer; the ceiling stays generous
 * because a client probes a peer before it burns a WebSocket connection.
 */
export const MAX_PEER_LOOKUPS_PER_MINUTE = 60

const WINDOW_MS = 60000

/**
 * Budget for one WebSocket handshake. The IP must be the proxy-aware one
 * (see middleware/clientIp.ts), otherwise every client behind a reverse proxy
 * shares a single bucket.
 */
export function allowConnection(ip: string): boolean {
  return checkRateLimit('ws-connect:' + ip, {
    windowMs: WINDOW_MS,
    maxRequests: MAX_CONNECTIONS_PER_MINUTE,
  }).allowed
}

/**
 * Budget for one peer-directory lookup. The IP must be the proxy-aware one.
 */
export function allowPeerLookup(ip: string): boolean {
  return checkRateLimit('peer-lookup:' + ip, {
    windowMs: WINDOW_MS,
    maxRequests: MAX_PEER_LOOKUPS_PER_MINUTE,
  }).allowed
}

import { SIGNALING_SEED_URLS } from '../../config/signalling'
import { fetchTextWithTimeout } from './fetchWithTimeout'

/**
 * Self-contained relay auth: the signaling server requires a JWT in `?token=`.
 * Because the relay mints its own tokens (see server /api/auth/token) there is
 * no external IdP — the client just asks the relay for one. Tokens are cached
 * and refreshed before expiry. If the relay does not yet expose the endpoint
 * (old deployment) we degrade gracefully and return '' (the connection will
 * then be rejected by the server, same as before this change).
 */

const TOKEN_REFRESH_MS = 45 * 60 * 1000 // refresh well before the 1h expiry

/** Deadline for the relay token request — the relay has to answer fast. */
const RELAY_TOKEN_TIMEOUT_MS = 3000

let cachedToken: string | null = null
let cachedUntil = 0
let inflight: Promise<string> | null = null

function getRestBase(wsUrl: string): string {
  const override = (import.meta.env as any)?.VITE_SIGNALING_REST_URL as string | undefined
  if (override) return override.replace(/\/$/, '')
  try {
    const u = new URL(wsUrl)
    const scheme = u.protocol === 'wss:' ? 'https:' : 'http:'
    return `${scheme}//${u.host}`
  } catch {
    return ''
  }
}

async function fetchRelayToken(id?: string): Promise<string> {
  const restBase = getRestBase(SIGNALING_SEED_URLS[0] || '')
  if (!restBase) return ''
  if (typeof fetch !== 'function') return ''
  const res = await fetchTextWithTimeout(
    `${restBase}/api/auth/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(id ? { id } : {}),
    },
    RELAY_TOKEN_TIMEOUT_MS,
  )
  if (!res.ok) throw new Error(`relay token fetch failed: ${res.status}`)
  const data = JSON.parse(res.text) as { token?: string }
  if (!data.token) throw new Error('relay token missing in response')
  return data.token
}

export async function getRelayToken(id?: string): Promise<string> {
  const now = Date.now()
  if (cachedToken && now < cachedUntil) return cachedToken
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const token = await fetchRelayToken(id)
      cachedToken = token
      cachedUntil = now + TOKEN_REFRESH_MS
      return token
    } finally {
      inflight = null
    }
  })()
  return inflight
}

/** Append a `token` query param to a WebSocket URL without clobbering existing params. */
export function withToken(url: string, token: string): string {
  if (!token) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}token=${encodeURIComponent(token)}`
}

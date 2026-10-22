const API_BASE = (import.meta as any).env?.VITE_API_URL || ''

/** A request that hangs longer than this is aborted so the operator sees an error. */
const REQUEST_TIMEOUT_MS = 15_000

/**
 * Error thrown when the server answered with something the admin SPA cannot
 * use: a non-2xx status or a body that is not JSON.
 *
 * `serverMessage` carries the server's own `error` field when it sent one, so
 * the UI can show that text verbatim instead of guessing.
 */
export class AdminApiError extends Error {
  readonly status: number
  readonly serverMessage?: string
  /** Machine-readable reason from the server (`session_expired`, `invalid_code`, …). */
  readonly code?: string

  constructor(status: number, message: string, serverMessage?: string, code?: string) {
    super(message)
    this.name = 'AdminApiError'
    this.status = status
    this.serverMessage = serverMessage
    this.code = code
  }
}

/** How a response should be interpreted. */
interface RequestBehaviour {
  /**
   * A 401 answer means the session is gone (the default): the token is
   * dropped and the operator is sent back to the login screen.
   *
   * Some endpoints answer 401 as a normal result — a wrong 2FA code, for
   * instance — and must leave the session alone.
   */
  unauthorizedIsSessionLoss?: boolean
}

/** Payload of `POST /api/auth/login` — the error field is sent with HTTP 200. */
export interface LoginResponse {
  sessionToken?: string
  requires2FA?: boolean
  needsCaptcha?: boolean
  sessionId?: string
  challenge?: string
  error?: string
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  behaviour: RequestBehaviour = {}
): Promise<T> {
  const token = sessionStorage.getItem('admin_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers, signal: controller.signal })
  } catch (err) {
    if (controller.signal.aborted) throw new AdminApiError(0, 'Request timed out')
    throw err
  } finally {
    clearTimeout(timer)
  }

  // Read the body as text first: a proxy error page (HTML) must not surface as
  // a raw "Unexpected token '<'" syntax error.
  const raw = await res.text()
  let body: unknown = null
  if (raw) {
    try {
      body = JSON.parse(raw)
    } catch {
      body = null
    }
  }

  const serverMessage =
    body && typeof (body as { error?: unknown }).error === 'string'
      ? (body as { error: string }).error
      : undefined

  const serverCode =
    body && typeof (body as { code?: unknown }).code === 'string'
      ? (body as { code: string }).code
      : undefined

  // A 401 normally means the session is gone: drop the token and send the
  // operator back to the login screen. Endpoints that answer 401 as a normal
  // result (a wrong 2FA code) opt out and keep the session.
  if (res.status === 401 && behaviour.unauthorizedIsSessionLoss !== false) {
    sessionStorage.removeItem('admin_token')
    window.location.hash = '#/login'
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    throw new AdminApiError(
      res.status,
      serverMessage || `Request failed (${res.status})`,
      serverMessage,
      serverCode
    )
  }

  if (body === null) {
    throw new AdminApiError(res.status, 'Unexpected response from server')
  }

  return body as T
}

export const api = {
  login: (username: string, password: string, captchaSession?: string, captchaAnswer?: string) =>
    request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, captchaSession, captchaAnswer: captchaAnswer !== undefined ? String(captchaAnswer) : undefined }),
    }),

  verify2FA: (sessionToken: string, code: string) =>
    request<{ token: string }>(
      '/api/auth/verify-2fa',
      {
        method: 'POST',
        body: JSON.stringify({ sessionToken, code }),
      },
      // A 401 here means a wrong code or an expired session — not a lost
      // session: the operator has to be able to retry or go back.
      { unauthorizedIsSessionLoss: false }
    ),

  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  reset2FA: () =>
    request<{ secret: string; uri: string }>('/api/auth/reset-2fa', { method: 'POST' }),

  getOverview: () =>
    request<{ onlineNow: number; today: number; totalUsers: number; countries: number }>('/api/stats/overview'),

  getCountries: () =>
    request<{ countries: Array<{ country: string; count: number }> }>('/api/stats/countries'),

  getDevices: () =>
    request<{ devices: Array<{ name: string; count: number; percentage: number }>; total: number }>('/api/stats/devices'),

  getUsers: (page = 1, limit = 50) =>
    request<{ users: any[]; total: number; page: number; limit: number }>(`/api/stats/users?page=${page}&limit=${limit}`),

  getAds: () => request<{ ads: any[] }>('/api/ads'),

  createAd: (data: { title: string; image_url: string; target_url: string; active?: boolean }) =>
    request<{ id: number }>('/api/ads', { method: 'POST', body: JSON.stringify(data) }),

  updateAd: (id: number, data: Partial<{ title: string; image_url: string; target_url: string; active: boolean }>) =>
    request<{ ok: boolean }>(`/api/ads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteAd: (id: number) => request<{ ok: boolean }>(`/api/ads/${id}`, { method: 'DELETE' }),
}

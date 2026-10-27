import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import http from 'node:http'

// --- Env set BEFORE importing route/db (they read env at module load) ---
process.env.JWT_SECRET = 'test-jwt-secret-embed'
process.env.DB_PATH = 'data/test-embed.db'

const harnessHandler = (req: http.IncomingMessage, res: http.ServerResponse) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1')
  handleEmbedRoute(req, res, url.pathname)
}

let handleEmbedRoute: (req: any, res: any, p: string) => boolean
let harnessServer: http.Server
let harnessPort = 0
let published: { topic: string; frame: any }[] = []

function startServer(handler: (req: http.IncomingMessage, res: http.ServerResponse) => void): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    const s = http.createServer(handler)
    s.once('error', reject)
    s.listen(0, '127.0.0.1', () => resolve(s))
  })
}

async function seedWidget(overrides: Record<string, unknown> = {}): Promise<string> {
  const { getDb } = await import('../db.js')
  const db = getDb()
  const id = overrides.id || 'widget_1'
  db.prepare(
    'INSERT INTO embed_widgets (id, name, website_domains, title, subtitle, position, theme, locale, require_prechat_form, offline_form_enabled, file_upload, emoji, rating_enabled, operators_online, enabled, created_at) ' +
    'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))',
  ).run(
    id,
    overrides.name ?? 'Test Widget',
    overrides.website_domains ?? 'example.com',
    overrides.title ?? 'Need help?',
    overrides.subtitle ?? 'We reply fast',
    overrides.position ?? 'bottom-right',
    overrides.theme ?? JSON.stringify({ primaryColor: '#2563eb' }),
    overrides.locale ?? 'ru',
    overrides.require_prechat_form ?? 1,
    overrides.offline_form_enabled ?? 0,
    overrides.file_upload ?? 1,
    overrides.emoji ?? 1,
    overrides.rating_enabled ?? 1,
    overrides.operators_online ?? 1,
    overrides.enabled ?? 1,
  )
  return String(id)
}

beforeAll(async () => {
  const mod = await import('../embed.js')
  handleEmbedRoute = mod.handleEmbedRoute
  // Capture publish calls.
  mod.registeredEmbedRealtime.publishToTopic = (topic, frame) => { published.push({ topic, frame }) }
  const { getDb } = await import('../db.js')
  getDb()
  harnessServer = await startServer(harnessHandler)
  const address = harnessServer.address()
  if (!address || typeof address === 'string' || !address.port) {
    throw new Error(`embed harness: no usable port (${String(address)})`)
  }
  harnessPort = address.port
})

afterAll(async () => {
  const fs = await import('node:fs')
  const { closeDb, resetDbForTests } = await import('../db')
  resetDbForTests()
  closeDb()
  await new Promise<void>((r) => harnessServer.close(() => r()))
  if (fs.existsSync('data/test-embed.db')) fs.unlinkSync('data/test-embed.db')
})

afterEach(async () => {
  const { resetRateLimits } = await import('../middleware/rateLimit.js')
  resetRateLimits()
  published = []
})

const base = () => `http://127.0.0.1:${harnessPort}`
const ORIGIN = { Origin: 'http://localhost:3000' }

async function api(path: string, opts: { method?: string; token?: string; body?: unknown; headers?: Record<string, string> } = {}) {
  const headers: Record<string, string> = { ...ORIGIN, ...(opts.headers || {}) }
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  return fetch(`${base()}${path}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })
}

async function json(res: Response): Promise<any> {
  return res.json()
}

describe('embed API', () => {
  it('rejects config from a non-allowlisted origin with 403', async () => {
    await seedWidget()
    const res = await api('/api/v1/embed/widgets/widget_1/config', { headers: { Origin: 'http://evil.test' } })
    expect(res.status).toBe(403)
  })

  it('serves widget config with normalized features', async () => {
    await seedWidget({ id: 'widget_cfg' })
    const res = await api('/api/v1/embed/widgets/widget_cfg/config')
    expect(res.status).toBe(200)
    const body = await json(res)
    expect(body.widget.id).toBe('widget_cfg')
    expect(body.widget.title).toBe('Need help?')
    expect(body.widget.position).toBe('bottom-right')
    expect(body.widget.theme.primaryColor).toBe('#2563eb')
    expect(body.widget.features).toEqual({ fileUpload: true, emoji: true, prechatForm: true, offlineForm: false, rating: true })
    expect(body.widget.operators_online).toBe(true)
  })

  it('404 for unknown or disabled widget', async () => {
    const unknown = await api('/api/v1/embed/widgets/nope/config')
    expect(unknown.status).toBe(404)
    await seedWidget({ id: 'widget_disabled', enabled: 0 })
    const disabled = await api('/api/v1/embed/widgets/widget_disabled/config')
    expect(disabled.status).toBe(404)
  })

  it('creates a fresh visitor session and returns tokens', async () => {
    await seedWidget({ id: 'widget_sess' })
    const res = await api('/api/v1/embed/widgets/widget_sess/session', {
      method: 'POST',
      body: { name: 'Alice', email: 'alice@example.com', attributes: { plan: 'pro' } },
    })
    expect(res.status).toBe(201)
    const body = await json(res)
    expect(body.visitor_session_id).toBeTruthy()
    expect(body.visitor_token).toBeTruthy()
    expect(body.websocket_token).toBeTruthy()

    // Same visitor_token reuses the same session; name/email update.
    const res2 = await api('/api/v1/embed/widgets/widget_sess/session', {
      method: 'POST',
      body: { visitor_token: body.visitor_token, name: 'Alice B', email: 'alice@example.com' },
    })
    const body2 = await json(res2)
    expect(body2.visitor_session_id).toBe(body.visitor_session_id)
    expect(body2.visitor_token).toBe(body.visitor_token)

    const { getDb } = await import('../db.js')
    const row = getDb().prepare('SELECT name FROM embed_visitor_sessions WHERE id = ?').get(body.visitor_session_id) as any
    expect(row.name).toBe('Alice B')
  })

  it('creates a conversation for an authenticated visitor session', async () => {
    await seedWidget({ id: 'widget_conv' })
    const sess = await json(await api('/api/v1/embed/widgets/widget_conv/session', { method: 'POST', body: {} }))
    const unauth = await api('/api/v1/embed/conversations', { method: 'POST', body: { visitor_session_id: sess.visitor_session_id } })
    expect(unauth.status).toBe(401)

    const bad = await api('/api/v1/embed/conversations', { method: 'POST', token: sess.visitor_token, body: { visitor_session_id: 'does-not-exist' } })
    expect(bad.status).toBe(401)

    const res = await api('/api/v1/embed/conversations', { method: 'POST', token: sess.visitor_token, body: { visitor_session_id: sess.visitor_session_id, context: { page: '/pricing', referrer: 'https://example.com' } } })
    expect(res.status).toBe(201)
    const body = await json(res)
    expect(body.conversation_id).toBeTruthy()
  })

  it('lists conversations for the visitor session', async () => {
    await seedWidget({ id: 'widget_list' })
    const sess = await json(await api('/api/v1/embed/widgets/widget_list/session', { method: 'POST', body: {} }))
    await api('/api/v1/embed/conversations', { method: 'POST', token: sess.visitor_token, body: { visitor_session_id: sess.visitor_session_id } })

    const res = await api(`/api/v1/embed/conversations?session=${sess.visitor_session_id}`, { token: sess.visitor_token })
    expect(res.status).toBe(200)
    const list = await json(res)
    expect(Array.isArray(list)).toBe(true)
    expect(list).toHaveLength(1)
    expect(list[0].status).toBe('open')
  })

  it('sends a message, persists it, and publishes to the conversation topic', async () => {
    published = []
    await seedWidget({ id: 'widget_send' })
    const sess = await json(await api('/api/v1/embed/widgets/widget_send/session', { method: 'POST', body: {} }))
    const conv = await json(await api('/api/v1/embed/conversations', { method: 'POST', token: sess.visitor_token, body: { visitor_session_id: sess.visitor_session_id } }))

    const empty = await api(`/api/v1/embed/conversations/${conv.conversation_id}/messages`, { method: 'POST', token: sess.visitor_token, body: { type: 'text', body: '   ' } })
    expect(empty.status).toBe(400)

    const res = await api(`/api/v1/embed/conversations/${conv.conversation_id}/messages`, { method: 'POST', token: sess.visitor_token, body: { type: 'text', body: 'Hello operator' } })
    expect(res.status).toBe(201)
    const body = await json(res)
    expect(body.message_id).toBeTruthy()

    expect(published).toHaveLength(1)
    expect(published[0].topic).toBe(`embed:c:${conv.conversation_id}`)
    expect(published[0].frame.type).toBe('message:created')
    expect((published[0].frame as any).message.body).toBe('Hello operator')

    // Message list returns the stored message.
    const list = await json(await api(`/api/v1/embed/conversations/${conv.conversation_id}/messages`, { token: sess.visitor_token }))
    expect(list).toHaveLength(1)
    expect(list[0].sender_type).toBe('visitor')
    expect(list[0].body).toBe('Hello operator')
  })

  it('rejects message access to a conversation owned by another visitor', async () => {
    await seedWidget({ id: 'widget_owner' })
    const s1 = await json(await api('/api/v1/embed/widgets/widget_owner/session', { method: 'POST', body: {} }))
    const s2 = await json(await api('/api/v1/embed/widgets/widget_owner/session', { method: 'POST', body: {} }))
    const conv = await json(await api('/api/v1/embed/conversations', { method: 'POST', token: s1.visitor_token, body: { visitor_session_id: s1.visitor_session_id } }))

    const res = await api(`/api/v1/embed/conversations/${conv.conversation_id}/messages`, { token: s2.visitor_token })
    expect(res.status).toBe(401)
  })

  it('handles typing and rating', async () => {
    await seedWidget({ id: 'widget_tr' })
    const sess = await json(await api('/api/v1/embed/widgets/widget_tr/session', { method: 'POST', body: {} }))
    const conv = await json(await api('/api/v1/embed/conversations', { method: 'POST', token: sess.visitor_token, body: { visitor_session_id: sess.visitor_session_id } }))

    published = []
    const typing = await api(`/api/v1/embed/conversations/${conv.conversation_id}/typing`, { method: 'POST', token: sess.visitor_token, body: { is_typing: true } })
    expect(typing.status).toBe(200)
    expect(published).toHaveLength(1)
    expect(published[0].frame.type).toBe('typing')
    expect((published[0].frame as any).sender).toBe('visitor')

    const rating = await api(`/api/v1/embed/conversations/${conv.conversation_id}/rating`, { method: 'POST', token: sess.visitor_token, body: { rating: 5, comment: 'Great' } })
    expect(rating.status).toBe(200)
    const { getDb } = await import('../db.js')
    const row = getDb().prepare('SELECT rating, rating_comment FROM embed_conversations WHERE id = ?').get(conv.conversation_id) as any
    expect(row.rating).toBe(5)
    expect(row.rating_comment).toBe('Great')
  })

  it('rejects uploads of disallowed types and accepts allowed ones', async () => {
    await seedWidget({ id: 'widget_up' })
    const sess = await json(await api('/api/v1/embed/widgets/widget_up/session', { method: 'POST', body: {} }))
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')

    const bad = await api('/api/v1/embed/upload', { method: 'POST', token: sess.visitor_token, body: { type: 'application/x-msdownload', data: png.toString('base64') } })
    expect(bad.status).toBe(400)

    const good = await api('/api/v1/embed/upload', { method: 'POST', token: sess.visitor_token, body: { type: 'image/png', data: png.toString('base64') } })
    expect(good.status).toBe(201)
    const body = await json(good)
    expect(body.attachment_id).toBeTruthy()
    expect(body.url).toMatch(/^\/uploads\//)
  })

  it('applies the message rate limit per visitor session', async () => {
    await seedWidget({ id: 'widget_rl' })
    const sess = await json(await api('/api/v1/embed/widgets/widget_rl/session', { method: 'POST', body: {} }))
    const conv = await json(await api('/api/v1/embed/conversations', { method: 'POST', token: sess.visitor_token, body: { visitor_session_id: sess.visitor_session_id } }))

    for (let i = 0; i < 6; i += 1) {
      const r = await api(`/api/v1/embed/conversations/${conv.conversation_id}/messages`, { method: 'POST', token: sess.visitor_token, body: { type: 'text', body: `msg ${i}` } })
      expect(r.status).toBe(201)
    }
    const limited = await api(`/api/v1/embed/conversations/${conv.conversation_id}/messages`, { method: 'POST', token: sess.visitor_token, body: { type: 'text', body: 'over limit' } })
    expect(limited.status).toBe(429)
  })
})

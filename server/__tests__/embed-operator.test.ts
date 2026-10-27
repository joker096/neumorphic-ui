import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import http from 'node:http'
import { createHmac } from 'node:crypto'

process.env.JWT_SECRET = 'test-jwt-secret-embed-operator'
process.env.DB_PATH = 'data/test-embed-operator.db'

const harnessHandler = (req: http.IncomingMessage, res: http.ServerResponse) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1')
  handleEmbedRoute(req, res, url.pathname)
}

let handleEmbedRoute: (req: any, res: any, p: string) => boolean
let harnessServer: http.Server
let harnessPort = 0
let published: { topic: string; frame: any }[] = []
let adminToken = ''

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
  const id = overrides.id || 'widget_op'
  db.prepare(
    'INSERT INTO embed_widgets (id, name, website_domains, title, subtitle, position, theme, locale, require_prechat_form, offline_form_enabled, file_upload, emoji, rating_enabled, operators_online, enabled, hmac_secret, created_at) ' +
    'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))',
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
    overrides.hmac_secret ?? 'test-hmac-secret',
  )
  return String(id)
}

beforeAll(async () => {
  const mod = await import('../embed.js')
  handleEmbedRoute = mod.handleEmbedRoute
  mod.registeredEmbedRealtime.publishToTopic = (topic, frame) => { published.push({ topic, frame }) }
  const { getDb } = await import('../db.js')
  getDb()
  const authMod = await import('../auth.js')
  adminToken = authMod.signToken({ adminId: 1, username: 'operator1' })
  // createAdminSession has an FK on admins(admin_id); Insert a matching row.
  getDb().prepare('INSERT INTO admins (username, password_hash, totp_secret) VALUES (?, ?, ?)')
    .run('operator1', 'x', 'JBSWY3DPEHPK3PXP')
  authMod.createAdminSession(1, adminToken)
  harnessServer = await startServer(harnessHandler)
  const address = harnessServer.address()
  if (!address || typeof address === 'string' || !address.port) {
    throw new Error(`embed-operator harness: no usable port (${String(address)})`)
  }
  harnessPort = address.port
})

afterAll(async () => {
  const fs = await import('node:fs')
  const { closeDb, resetDbForTests } = await import('../db')
  resetDbForTests()
  closeDb()
  await new Promise<void>((r) => harnessServer.close(() => r()))
  if (fs.existsSync('data/test-embed-operator.db')) fs.unlinkSync('data/test-embed-operator.db')
})

afterEach(async () => {
  const { resetRateLimits } = await import('../middleware/rateLimit.js')
  resetRateLimits()
  published = []
})

const base = () => `http://127.0.0.1:${harnessPort}`

async function api(path: string, opts: { method?: string; token?: string; body?: unknown; headers?: Record<string, string> } = {}) {
  const headers: Record<string, string> = { ...(opts.headers || {}) }
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

async function setupConversation(widgetId: string): Promise<{ convId: string; visitorToken: string; sessId: string }> {
  const sess = await json(await api(`/api/v1/embed/widgets/${widgetId}/session`, {
    method: 'POST',
    headers: { Origin: 'http://localhost:3000' },
    body: { name: 'Visitor', email: 'v@example.com' },
  }))
  const conv = await json(await api('/api/v1/embed/conversations', {
    method: 'POST',
    token: sess.visitor_token,
    headers: { Origin: 'http://localhost:3000' },
    body: { visitor_session_id: sess.visitor_session_id },
  }))
  return { convId: conv.conversation_id, visitorToken: sess.visitor_token, sessId: sess.visitor_session_id }
}

describe('embed operator API', () => {
  it('requires admin auth (401 without token)', async () => {
    await seedWidget({ id: 'op_auth' })
    const res = await api('/api/v1/embed/operator/widgets')
    expect(res.status).toBe(401)
  })

  it('lists widgets', async () => {
    await seedWidget({ id: 'op_widgets' })
    const res = await api('/api/v1/embed/operator/widgets', { token: adminToken })
    expect(res.status).toBe(200)
    const list = await json(res)
    expect(list.some((w: any) => w.widget_id === 'op_widgets')).toBe(true)
  })

  it('lists conversations with visitor info and last message', async () => {
    await seedWidget({ id: 'op_list' })
    const { convId, visitorToken } = await setupConversation('op_list')
    await api(`/api/v1/embed/conversations/${convId}/messages`, {
      method: 'POST',
      token: visitorToken,
      headers: { Origin: 'http://localhost:3000' },
      body: { type: 'text', body: 'I need help' },
    })

    const res = await api('/api/v1/embed/operator/conversations?status=open&widget=op_list', { token: adminToken })
    expect(res.status).toBe(200)
    const list = await json(res)
    expect(list).toHaveLength(1)
    expect(list[0].conversation_id).toBe(convId)
    expect(list[0].status).toBe('open')
    expect(list[0].visitor.name).toBe('Visitor')
    expect(list[0].visitor.email).toBe('v@example.com')
    expect(list[0].message_count).toBe(1)
    expect(list[0].last_message.body).toBe('I need help')
    expect(list[0].last_message.sender_type).toBe('visitor')
  })

  it('reads a full conversation thread', async () => {
    await seedWidget({ id: 'op_thread' })
    const { convId, visitorToken } = await setupConversation('op_thread')
    await api(`/api/v1/embed/conversations/${convId}/messages`, {
      method: 'POST', token: visitorToken, headers: { Origin: 'http://localhost:3000' }, body: { body: 'a' },
    })
    await api(`/api/v1/embed/conversations/${convId}/messages`, {
      method: 'POST', token: visitorToken, headers: { Origin: 'http://localhost:3000' }, body: { body: 'b' },
    })

    const res = await api(`/api/v1/embed/operator/conversations/${convId}/messages`, { token: adminToken })
    expect(res.status).toBe(200)
    const list = await json(res)
    expect(list).toHaveLength(2)
    expect(list.map((m: any) => m.body)).toEqual(['a', 'b'])
  })

  it('sends an operator reply, persists, publishes, and reopens a closed conversation', async () => {
    await seedWidget({ id: 'op_send' })
    const { convId } = await setupConversation('op_send')
    await api(`/api/v1/embed/operator/conversations/${convId}`, { method: 'PATCH', token: adminToken, body: { status: 'closed' } })

    published = []
    const res = await api(`/api/v1/embed/operator/conversations/${convId}/messages`, {
      method: 'POST', token: adminToken, body: { type: 'text', body: 'We are on it' },
    })
    expect(res.status).toBe(201)
    const body = await json(res)
    expect(body.message_id).toBeTruthy()

    expect(published).toHaveLength(1)
    expect(published[0].topic).toBe(`embed:c:${convId}`)
    expect((published[0].frame as any).message.sender_type).toBe('operator')
    expect((published[0].frame as any).message.body).toBe('We are on it')

    const { getDb } = await import('../db.js')
    const row = getDb().prepare('SELECT sender_type, sender_id, body FROM embed_messages WHERE id = ?').get(body.message_id) as any
    expect(row.sender_type).toBe('operator')
    expect(row.sender_id).toBe('operator1')
    expect(row.body).toBe('We are on it')

    const conv = getDb().prepare('SELECT status FROM embed_conversations WHERE id = ?').get(convId) as any
    expect(conv.status).toBe('open')
  })

  it('closes and reassigns a conversation', async () => {
    await seedWidget({ id: 'op_update' })
    const { convId } = await setupConversation('op_update')

    const res = await api(`/api/v1/embed/operator/conversations/${convId}`, { method: 'PATCH', token: adminToken, body: { status: 'closed', assignee_id: 'op2' } })
    expect(res.status).toBe(200)
    const { getDb } = await import('../db.js')
    const row = getDb().prepare('SELECT status, assignee_id, closed_at FROM embed_conversations WHERE id = ?').get(convId) as any
    expect(row.status).toBe('closed')
    expect(row.assignee_id).toBe('op2')
    expect(row.closed_at).toBeTruthy()
  })

  it('404 on unknown conversation', async () => {
    const res = await api('/api/v1/embed/operator/conversations/does-not-exist/messages', { token: adminToken })
    expect(res.status).toBe(404)
  })
})

describe('embed identified users (HMAC §12.2)', () => {
  it('stamps identity when the HMAC claim verifies', async () => {
    await seedWidget({ id: 'op_hmac' })
    const secret = 'test-hmac-secret'
    const uid = 'user-42'
    const exp = Math.floor(Date.now() / 1000) + 3600
    const sig = createHmac('sha256', secret).update(`${uid}:${exp}`).digest('base64')

    const res = await api('/api/v1/embed/widgets/op_hmac/session', {
      method: 'POST',
      headers: { Origin: 'http://localhost:3000' },
      body: { visitor_token: 'tok-hmac', identity: { uid, exp, signature: sig } },
    })
    expect(res.status).toBe(201)
    const body = await json(res)
    expect(body.identified).toBe(true)
    expect(body.identity).toEqual({ uid, exp })

    const { getDb } = await import('../db.js')
    const row = getDb().prepare('SELECT identity FROM embed_visitor_sessions WHERE id = ?').get(body.visitor_session_id) as any
    expect(JSON.parse(row.identity).uid).toBe(uid)
  })

  it('fails closed on a forged signature (identity ignored)', async () => {
    await seedWidget({ id: 'op_hmac_bad' })
    const res = await api('/api/v1/embed/widgets/op_hmac_bad/session', {
      method: 'POST',
      headers: { Origin: 'http://localhost:3000' },
      body: { visitor_token: 'tok-forge', identity: { uid: 'victim', exp: Math.floor(Date.now() / 1000) + 3600, signature: 'd2hviY2hjcmlhZnQ=' } },
    })
    expect(res.status).toBe(201)
    const body = await json(res)
    expect(body.identified).toBe(false)
    expect(body.identity).toBeNull()
  })

  it('rejects expired identity claims', async () => {
    await seedWidget({ id: 'op_hmac_exp' })
    const secret = 'test-hmac-secret'
    const uid = 'user-old'
    const exp = Math.floor(Date.now() / 1000) - 60
    const sig = createHmac('sha256', secret).update(`${uid}:${exp}`).digest('base64')

    const res = await api('/api/v1/embed/widgets/op_hmac_exp/session', {
      method: 'POST',
      headers: { Origin: 'http://localhost:3000' },
      body: { visitor_token: 'tok-exp', identity: { uid, exp, signature: sig } },
    })
    const body = await json(res)
    expect(body.identified).toBe(false)
    expect(body.identity).toBeNull()
  })
})

// Embeddable website chat widget — backend (REST + WS topic protocol).
//
// Design (per AGENT_TASK.embedded-site-chat.md §6/§7/§11):
//   - "script tag + iframe" is the primary integration (вариант A). The host
//     page loads `widget.js`, which mounts an <iframe> pointing at
//     `EMBED_ORIGIN/embed/<widgetId>`. The chat UI lives inside that frame, so
//     host CSS/JS cannot leak in and widget CSS cannot leak out.
//   - REST drives configuration, sessions, conversations, messages and uploads.
//   - Realtime uses the existing signaling relay pub/sub (topics `embed:c:<id>`)
//     so the operator's Team Inbox and the widget subscribe to the same room.
//   - Visitor identity is a short-lived `visitor_token` (Bearer). Optional HMAC
//     signature for identified site users (see §12.2).
//
// Security invariants:
//   - widgetId is public, but a widget only works on allowed domains
//     (`website_domains`). The server checks Origin + Referer for every embed
//     request and WebSocket subscription.
//   - Rate limits: message send 6/min per visitor session, session-create
//     20/min per IP, upload 4/min per session.
//   - Message bodies are stored as-is but MUST be rendered as text by the client
//     (never innerHTML). No raw HTML is ever trusted.

import { IncomingMessage, ServerResponse } from 'node:http'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { getDb } from './db.js'
import { resolveClientIp } from './middleware/clientIp.js'
import { isOriginAllowedForEmbed } from './middleware/embedOrigin.js'
import { createRateLimiter, tooManyRequests } from './middleware/rateLimit.js'
import { authorizeAdminRequest } from './middleware/rateLimit.js'
import type { AdminLimiters } from './middleware/rateLimit.js'

// ---------------------------------------------------------------------------
// Rate limiters (shared map, one sweeper — see middleware/rateLimit.ts)
// ---------------------------------------------------------------------------

export const embedLimiters = {
  session: createRateLimiter(20, 60000), // per IP
  send: createRateLimiter(6, 60000), // per visitor session
  upload: createRateLimiter(4, 60000), // per visitor session
  config: createRateLimiter(120, 60000), // per IP
}

/**
 * Operator (admin) rate limiters for the embed operator endpoints. The bucket
 * charges follow the same convention as the integrations endpoints: anonymous /
 * unusable-token traffic shares a per-IP bucket, each signed-in administrator
 * has their own bucket so operators behind a shared egress IP can't lock each
 * other out.
 */
export const embedOperatorLimiters: AdminLimiters = {
  anonymous: createRateLimiter(30, 60000),
  admin: createRateLimiter(120, 60000),
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const ALLOWED_UPLOAD_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/json',
])

// ---------------------------------------------------------------------------
// Embed REST handler. Returns true when it handled the request.
// ---------------------------------------------------------------------------

export function handleEmbedRoute(req: IncomingMessage, res: ServerResponse, path: string): boolean {
  // Operator (admin) endpoints — `/api/v1/embed/operator/*`
  if (path.startsWith('/api/v1/embed/operator/')) {
    return handleOperatorRoute(req, res, path)
  }

  // Widget public config — GET /api/v1/embed/widgets/:widgetId/config
  const cfgMatch = path.match(/^\/api\/v1\/embed\/widgets\/([^/]+)\/config$/)
  if (cfgMatch && req.method === 'GET') {
    const ip = resolveClientIp(req)
    if (!embedLimiters.config.check(`ip:${ip}`)) { tooManyRequests(res); return true }
    handleWidgetConfig(req, res, cfgMatch[1]!)
    return true
  }

  // Visitor session — POST /api/v1/embed/widgets/:widgetId/session
  const sessMatch = path.match(/^\/api\/v1\/embed\/widgets\/([^/]+)\/session$/)
  if (sessMatch && req.method === 'POST') {
    const ip = resolveClientIp(req)
    if (!embedLimiters.session.check(`ip:${ip}`)) { tooManyRequests(res); return true }
    handleSessionCreate(req, res, sessMatch[1]!)
    return true
  }

  // Conversation — POST /api/v1/embed/conversations
  if (path === '/api/v1/embed/conversations' && req.method === 'POST') {
    handleConversationCreate(req, res)
    return true
  }

  // Conversation list for a session — GET /api/v1/embed/conversations?session=...
  if (path === '/api/v1/embed/conversations' && req.method === 'GET') {
    handleConversationList(req, res)
    return true
  }

  // Messages — GET/POST /api/v1/embed/conversations/:id/messages
  const msgMatch = path.match(/^\/api\/v1\/embed\/conversations\/([^/]+)\/messages$/)
  if (msgMatch) {
    if (req.method === 'GET') { handleMessageList(req, res, msgMatch[1]!); return true }
    if (req.method === 'POST') { handleMessageSend(req, res, msgMatch[1]!); return true }
  }

  // Typing — POST /api/v1/embed/conversations/:id/typing
  const typeMatch = path.match(/^\/api\/v1\/embed\/conversations\/([^/]+)\/typing$/)
  if (typeMatch && req.method === 'POST') {
    handleTyping(req, res, typeMatch[1]!)
    return true
  }

  // Rating — POST /api/v1/embed/conversations/:id/rating
  const rateMatch = path.match(/^\/api\/v1\/embed\/conversations\/([^/]+)\/rating$/)
  if (rateMatch && req.method === 'POST') {
    handleRating(req, res, rateMatch[1]!)
    return true
  }

  // Upload — POST /api/v1/embed/upload
  if (path === '/api/v1/embed/upload' && req.method === 'POST') {
    handleUpload(req, res)
    return true
  }

  return false
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getVisitorToken(req: IncomingMessage): string | null {
  const auth = req.headers['authorization'] || ''
  if (!auth.toLowerCase().startsWith('bearer ')) return null
  const token = auth.slice(7).trim()
  return token || null
}

function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (c: Buffer) => {
      size += c.length
      if (size > 2 * 1024 * 1024) {
        reject(new Error('payload too large'))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {})
      } catch {
        reject(new Error('invalid json'))
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  if (res.headersSent) return
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

/** Origin/Referer guard — the widget is only reachable from allowed domains. */
function originAllowedForRequest(req: IncomingMessage): boolean {
  const origin = (req.headers['origin'] || req.headers['referer'] || '').toString()
  return isOriginAllowedForEmbed(origin)
}

// ---------------------------------------------------------------------------
// Widget config
// ---------------------------------------------------------------------------

function handleWidgetConfig(req: IncomingMessage, res: ServerResponse, widgetId: string): void {
  if (!originAllowedForRequest(req)) {
    sendJson(res, 403, { error: 'origin not allowed' })
    return
  }
  const db = getDb()
  const widget = db.prepare('SELECT * FROM embed_widgets WHERE id = ?').get(widgetId) as any
  if (!widget || !widget.enabled) {
    sendJson(res, 404, { error: 'widget not found' })
    return
  }
  sendJson(res, 200, {
    widget: {
      id: widget.id,
      title: widget.title,
      subtitle: widget.subtitle,
      position: widget.position,
      theme: JSON.parse(widget.theme || '{}'),
      locale: widget.locale,
      features: {
        fileUpload: !!widget.file_upload,
        emoji: !!widget.emoji,
        prechatForm: !!widget.require_prechat_form,
        offlineForm: !!widget.offline_form_enabled,
        rating: !!widget.rating_enabled,
      },
      operators_online: !!widget.operators_online,
    },
  })
}

// ---------------------------------------------------------------------------
// Visitor session
// ---------------------------------------------------------------------------

/**
 * Verify an HMAC-signed visitor identity claim (§12.2). The site owner signs
 * a stable identifier (uid) plus an expiry with the widget's `hmac_secret`.
 * The server recomputes the HMAC-SHA256 over the canonical claim and compares
 * in constant time, so an attacker who can read the visitor token cannot forge
 * an identity without the secret.
 */
function verifyIdentityHmac(
  secret: string,
  uid: string,
  exp: number | undefined,
  signature: string,
): boolean {
  if (!secret || !uid || typeof signature !== 'string' || !signature) return false
  const claim = exp ? `${uid}:${exp}` : uid
  const expected = createHmac('sha256', secret).update(claim).digest()
  let provided: Buffer
  try {
    provided = Buffer.from(signature, 'base64')
  } catch {
    return false
  }
  if (provided.length !== expected.length) return false
  return timingSafeEqual(provided, expected)
}

function handleSessionCreate(req: IncomingMessage, res: ServerResponse, widgetId: string): void {
  if (!originAllowedForRequest(req)) { sendJson(res, 403, { error: 'origin not allowed' }); return }
  const db = getDb()
  const widget = db.prepare('SELECT id, hmac_secret FROM embed_widgets WHERE id = ? AND enabled = 1').get(widgetId) as any
  if (!widget) { sendJson(res, 404, { error: 'widget not found' }); return }

  readBody(req).then((body) => {
    const visitorToken = body.visitor_token || crypto.randomUUID()
    const name = (body.name || '').toString().slice(0, 120)
    const email = (body.email || '').toString().slice(0, 200)
    const attributes = body.attributes || {}

    // Optional HMAC-signed identity (§12.2). When the claim verifies, stamp it
    // on the session; malformed claims fail closed (identity ignored) but never
    // reject the session itself.
    let identity: string | null = null
    const claim = body.identity
    if (claim && typeof claim === 'object') {
      const uid = String(claim.uid || '').slice(0, 200)
      const exp = typeof claim.exp === 'number' ? claim.exp : undefined
      if (uid && (exp === undefined || exp > Date.now() / 1000)) {
        if (widget.hmac_secret && verifyIdentityHmac(widget.hmac_secret, uid, exp, String(claim.signature || ''))) {
          identity = JSON.stringify({ uid, exp: exp ?? null })
        }
      }
    }

    const existing = db.prepare(
      'SELECT id FROM embed_visitor_sessions WHERE widget_id = ? AND visitor_token = ?',
    ).get(widgetId, visitorToken) as any

    let sessionId: string
    if (existing) {
      sessionId = existing.id
      db.prepare(
        'UPDATE embed_visitor_sessions SET last_seen_at = datetime(\'now\'), ' +
        'name = CASE WHEN ? THEN ? ELSE name END, ' +
        'email = CASE WHEN ? THEN ? ELSE email END, ' +
        'identity = COALESCE(?, identity) WHERE id = ?',
      ).run(name !== '' ? 1 : 0, name, email !== '' ? 1 : 0, email, identity, sessionId)
    } else {
      sessionId = crypto.randomUUID()
      db.prepare(
        'INSERT INTO embed_visitor_sessions (id, widget_id, visitor_token, name, email, attributes, first_seen_at, last_seen_at, identity) VALUES (?, ?, ?, ?, ?, ?, datetime(\'now\'), datetime(\'now\'), ?)',
      ).run(sessionId, widgetId, visitorToken, name, email, JSON.stringify(attributes), identity)
    }

    sendJson(res, 201, {
      visitor_session_id: sessionId,
      visitor_token: visitorToken,
      websocket_token: crypto.randomUUID(),
      identified: !!identity,
      identity: identity ? JSON.parse(identity) : null,
    })
  }).catch(() => sendJson(res, 400, { error: 'bad request' }))
}

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

function handleConversationCreate(req: IncomingMessage, res: ServerResponse): void {
  if (!originAllowedForRequest(req)) { sendJson(res, 403, { error: 'origin not allowed' }); return }
  const visitorToken = getVisitorToken(req)
  if (!visitorToken) { sendJson(res, 401, { error: 'visitor token required' }); return }

  readBody(req).then((body) => {
    const db = getDb()
    const session = db.prepare(
      'SELECT * FROM embed_visitor_sessions WHERE id = ? AND visitor_token = ?',
    ).get(body.visitor_session_id, visitorToken) as any
    if (!session) { sendJson(res, 401, { error: 'invalid session' }); return }

    const id = crypto.randomUUID()
    const metadata = body.context || {}
    db.prepare(
      'INSERT INTO embed_conversations (id, widget_id, visitor_session_id, status, source, started_at, metadata) VALUES (?, ?, ?, \'open\', \'website\', datetime(\'now\'), ?)',
    ).run(id, session.widget_id, session.id, JSON.stringify(metadata))

    sendJson(res, 201, { conversation_id: id })
  }).catch(() => sendJson(res, 400, { error: 'bad request' }))
}

function handleConversationList(req: IncomingMessage, res: ServerResponse): void {
  const visitorToken = getVisitorToken(req)
  if (!visitorToken) { sendJson(res, 401, { error: 'visitor token required' }); return }
  const sessionId = new URL(req.url || '', 'http://x').searchParams.get('session')
  if (!sessionId) { sendJson(res, 400, { error: 'session required' }); return }

  const db = getDb()
  const session = db.prepare(
    'SELECT id FROM embed_visitor_sessions WHERE id = ? AND visitor_token = ?',
  ).get(sessionId, visitorToken) as any
  if (!session) { sendJson(res, 401, { error: 'invalid session' }); return }

  const rows = db.prepare(
    'SELECT id, status, started_at, closed_at, metadata FROM embed_conversations WHERE visitor_session_id = ? ORDER BY started_at DESC',
  ).all(sessionId) as any[]

  sendJson(res, 200, rows.map((r) => ({
    conversation_id: r.id,
    status: r.status,
    started_at: r.started_at,
    closed_at: r.closed_at,
    metadata: JSON.parse(r.metadata || '{}'),
  })))
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

function handleMessageList(req: IncomingMessage, res: ServerResponse, conversationId: string): void {
  const visitorToken = getVisitorToken(req)
  if (!visitorToken) { sendJson(res, 401, { error: 'visitor token required' }); return }

  const db = getDb()
  const conv = db.prepare(
    'SELECT id FROM embed_conversations WHERE id = ?',
  ).get(conversationId) as any
  if (!conv) { sendJson(res, 404, { error: 'conversation not found' }); return }

  // Verify the conversation belongs to this visitor session.
  const session = db.prepare(
    'SELECT id FROM embed_visitor_sessions WHERE id = (SELECT visitor_session_id FROM embed_conversations WHERE id = ?) AND visitor_token = ?',
  ).get(conversationId, visitorToken) as any
  if (!session) { sendJson(res, 401, { error: 'invalid session' }); return }

  const rows = db.prepare(
    'SELECT id, sender_type, sender_id, type, body, attachments, status, created_at FROM embed_messages WHERE conversation_id = ? ORDER BY created_at ASC',
  ).all(conversationId) as any[]

  sendJson(res, 200, rows.map((r) => ({
    id: r.id,
    sender_type: r.sender_type,
    sender_id: r.sender_id,
    type: r.type,
    body: r.body,
    attachments: JSON.parse(r.attachments || '[]'),
    status: r.status,
    created_at: r.created_at,
  })))
}

function handleMessageSend(req: IncomingMessage, res: ServerResponse, conversationId: string): void {
  const visitorToken = getVisitorToken(req)
  if (!visitorToken) { sendJson(res, 401, { error: 'visitor token required' }); return }
  const ip = resolveClientIp(req)

  readBody(req).then((body) => {
    const db = getDb()
    const conv = db.prepare(
      'SELECT id FROM embed_conversations WHERE id = ?',
    ).get(conversationId) as any
    if (!conv) { sendJson(res, 404, { error: 'conversation not found' }); return }

    const session = db.prepare(
      'SELECT id FROM embed_visitor_sessions WHERE id = (SELECT visitor_session_id FROM embed_conversations WHERE id = ?) AND visitor_token = ?',
    ).get(conversationId, visitorToken) as any
    if (!session) { sendJson(res, 401, { error: 'invalid session' }); return }

    if (!embedLimiters.send.check(`session:${session.id}`)) { tooManyRequests(res); return }

    const text = (body.body || '').toString().slice(0, 4000)
    if (!text.trim()) { sendJson(res, 400, { error: 'empty message' }); return }

    const id = crypto.randomUUID()
    db.prepare(
      'INSERT INTO embed_messages (id, conversation_id, sender_type, sender_id, type, body, attachments, status, created_at) VALUES (?, ?, \'visitor\', ?, \'text\', ?, \'[]\', \'sent\', datetime(\'now\'))',
    ).run(id, conversationId, session.id, text)

    publishToConversation(conversationId, { type: 'message:created', message: { id, body: text, sender_type: 'visitor' } })

    sendJson(res, 201, { message_id: id })
  }).catch(() => sendJson(res, 400, { error: 'bad request' }))
}

function handleTyping(req: IncomingMessage, res: ServerResponse, conversationId: string): void {
  const visitorToken = getVisitorToken(req)
  if (!visitorToken) { sendJson(res, 401, { error: 'visitor token required' }); return }
  readBody(req).then((body) => {
    publishToConversation(conversationId, { type: 'typing', is_typing: !!body.is_typing, sender: 'visitor' })
    sendJson(res, 200, { ok: true })
  }).catch(() => sendJson(res, 400, { error: 'bad request' }))
}

function handleRating(req: IncomingMessage, res: ServerResponse, conversationId: string): void {
  const visitorToken = getVisitorToken(req)
  if (!visitorToken) { sendJson(res, 401, { error: 'visitor token required' }); return }
  readBody(req).then((body) => {
    const rating = Math.max(1, Math.min(5, Number(body.rating) || 5))
    const comment = (body.comment || '').toString().slice(0, 1000)
    const db = getDb()
    db.prepare(
      'UPDATE embed_conversations SET rating = ?, rating_comment = ? WHERE id = ?',
    ).run(rating, comment, conversationId)
    sendJson(res, 200, { ok: true })
  }).catch(() => sendJson(res, 400, { error: 'bad request' }))
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

function handleUpload(req: IncomingMessage, res: ServerResponse): void {
  const visitorToken = getVisitorToken(req)
  if (!visitorToken) { sendJson(res, 401, { error: 'visitor token required' }); return }

  // In production this should stream to S3-compatible storage. For the current
  // self-hosted server we accept an authenticated multipart-ish JSON with base64
  // payload — simple, testable, and bounded. The `url` field points at a
  // static asset we write under `data/uploads`.
  readBody(req).then(async (body) => {
    const type = (body.type || '').toString().toLowerCase()
    const data = (body.data || '').toString()
    if (!ALLOWED_UPLOAD_TYPES.has(type)) { sendJson(res, 400, { error: 'unsupported type' }); return }
    const size = Buffer.byteLength(data, 'base64')
    if (size > MAX_UPLOAD_BYTES) { sendJson(res, 413, { error: 'file too large' }); return }

    const id = crypto.randomUUID()
    const ext = type.split('/')[1]?.replace('jpeg', 'jpg') || 'bin'
    const fileName = `${id}.${ext}`
    const { mkdirSync, writeFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const dir = join(process.cwd(), 'data', 'uploads')
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, fileName), Buffer.from(data, 'base64'))

    const db = getDb()
    db.prepare('INSERT INTO embed_attachments (id, file_name, mime_type, size_bytes, created_at) VALUES (?, ?, ?, ?, datetime(\'now\'))').run(id, fileName, type, size)

    sendJson(res, 201, { attachment_id: id, url: `/uploads/${fileName}` })
  }).catch(() => sendJson(res, 400, { error: 'bad request' }))
}

// ---------------------------------------------------------------------------
// Operator (admin) endpoints
// ---------------------------------------------------------------------------

const OPERATOR_LIST_LIMIT = 100

function handleOperatorRoute(req: IncomingMessage, res: ServerResponse, path: string): boolean {
  const ip = resolveClientIp(req)
  const admin = authorizeAdminRequest(req as any, res, ip, embedOperatorLimiters)
  if (!admin) return true

  // List widgets — GET /api/v1/embed/operator/widgets
  if (path === '/api/v1/embed/operator/widgets' && req.method === 'GET') {
    const rows = getDb().prepare(
      'SELECT id, name, title, enabled, created_at FROM embed_widgets ORDER BY created_at DESC',
    ).all() as any[]
    sendJson(res, 200, rows.map((r) => ({
      widget_id: r.id,
      name: r.name,
      title: r.title,
      enabled: !!r.enabled,
      created_at: r.created_at,
    })))
    return true
  }

  // List conversations — GET /api/v1/embed/operator/conversations?status=&widget=
  if (path === '/api/v1/embed/operator/conversations' && req.method === 'GET') {
    const q = new URL(req.url || '', 'http://x').searchParams
    const status = q.get('status') || 'open'
    const widgetId = q.get('widget') || ''
    if (status !== 'open' && status !== 'closed' && status !== 'all') {
      sendJson(res, 400, { error: 'invalid status' }); return true
    }
    let sql = `SELECT c.id, c.widget_id, c.status, c.assignee_id, c.source, c.started_at,
                      c.closed_at, c.rating, c.rating_comment, c.metadata,
                      s.name AS v_name, s.email AS v_email, s.phone AS v_phone,
                      s.attributes AS v_attributes, s.last_seen_at AS v_last_seen,
                      s.identity AS v_identity,
                      (SELECT COUNT(*) FROM embed_messages m WHERE m.conversation_id = c.id) AS msg_count,
                      (SELECT m.body FROM embed_messages m WHERE m.conversation_id = c.id
                        ORDER BY m.created_at DESC LIMIT 1) AS last_body,
                      (SELECT m.sender_type FROM embed_messages m WHERE m.conversation_id = c.id
                        ORDER BY m.created_at DESC LIMIT 1) AS last_sender
               FROM embed_conversations c
               JOIN embed_visitor_sessions s ON s.id = c.visitor_session_id
               WHERE 1=1`
    const params: any[] = []
    if (status !== 'all') { sql += ' AND c.status = ?'; params.push(status) }
    if (widgetId) { sql += ' AND c.widget_id = ?'; params.push(widgetId) }
    sql += ' ORDER BY c.started_at DESC LIMIT ?'
    params.push(OPERATOR_LIST_LIMIT)
    const rows = getDb().prepare(sql).all(...params) as any[]
    sendJson(res, 200, rows.map((r) => ({
      conversation_id: r.id,
      widget_id: r.widget_id,
      status: r.status,
      assignee_id: r.assignee_id,
      source: r.source,
      started_at: r.started_at,
      closed_at: r.closed_at,
      rating: r.rating,
      rating_comment: r.rating_comment,
      metadata: JSON.parse(r.metadata || '{}'),
      visitor: {
        name: r.v_name,
        email: r.v_email,
        phone: r.v_phone,
        attributes: JSON.parse(r.v_attributes || '{}'),
        last_seen_at: r.v_last_seen,
        identity: r.v_identity ? JSON.parse(r.v_identity) : null,
      },
      message_count: r.msg_count,
      last_message: r.last_body ? { body: r.last_body, sender_type: r.last_sender } : null,
    })))
    return true
  }

  // Conversation messages — GET /api/v1/embed/operator/conversations/:id/messages
  const listMatch = path.match(/^\/api\/v1\/embed\/operator\/conversations\/([^/]+)\/messages$/)
  if (listMatch && req.method === 'GET') {
    const conv = getDb().prepare('SELECT id FROM embed_conversations WHERE id = ?').get(listMatch[1]!) as any
    if (!conv) { sendJson(res, 404, { error: 'conversation not found' }); return true }
    const rows = getDb().prepare(
      'SELECT id, sender_type, sender_id, type, body, attachments, status, created_at FROM embed_messages WHERE conversation_id = ? ORDER BY created_at ASC',
    ).all(listMatch[1]!) as any[]
    sendJson(res, 200, rows.map((r) => ({
      id: r.id,
      sender_type: r.sender_type,
      sender_id: r.sender_id,
      type: r.type,
      body: r.body,
      attachments: JSON.parse(r.attachments || '[]'),
      status: r.status,
      created_at: r.created_at,
    })))
    return true
  }

  // Operator reply — POST /api/v1/embed/operator/conversations/:id/messages
  const sendMatch = path.match(/^\/api\/v1\/embed\/operator\/conversations\/([^/]+)\/messages$/)
  if (sendMatch && req.method === 'POST') {
    const conv = getDb().prepare('SELECT id FROM embed_conversations WHERE id = ?').get(sendMatch[1]!) as any
    if (!conv) { sendJson(res, 404, { error: 'conversation not found' }); return true }
    readBody(req).then((body) => {
      const text = (body.body || '').toString().slice(0, 4000)
      if (!text.trim()) { sendJson(res, 400, { error: 'empty message' }); return }
      const id = crypto.randomUUID()
      getDb().prepare(
        "INSERT INTO embed_messages (id, conversation_id, sender_type, sender_id, type, body, attachments, status, created_at) VALUES (?, ?, 'operator', ?, 'text', ?, '[]', 'sent', datetime('now'))",
      ).run(id, sendMatch[1]!, admin.username, text)
      publishToConversation(sendMatch[1]!, { type: 'message:created', message: { id, body: text, sender_type: 'operator', sender_id: admin.username } })
      // Reopening a closed conversation on an operator reply is the expected
      // inbox behavior.
      getDb().prepare(
        "UPDATE embed_conversations SET status = 'open', closed_at = NULL WHERE id = ? AND status = 'closed'",
      ).run(sendMatch[1]!)
      sendJson(res, 201, { message_id: id })
    }).catch(() => sendJson(res, 400, { error: 'bad request' }))
    return true
  }

  // Update conversation — PATCH /api/v1/embed/operator/conversations/:id
  const updMatch = path.match(/^\/api\/v1\/embed\/operator\/conversations\/([^/]+)$/)
  if (updMatch && req.method === 'PATCH') {
    const conv = getDb().prepare('SELECT id FROM embed_conversations WHERE id = ?').get(updMatch[1]!) as any
    if (!conv) { sendJson(res, 404, { error: 'conversation not found' }); return true }
    readBody(req).then((body) => {
      const db = getDb()
      if (typeof body.status === 'string') {
        if (body.status !== 'open' && body.status !== 'closed') {
          sendJson(res, 400, { error: 'invalid status' }); return
        }
        db.prepare(
          "UPDATE embed_conversations SET status = ?, closed_at = CASE WHEN ? = 'closed' THEN datetime('now') ELSE NULL END WHERE id = ?",
        ).run(body.status, body.status, updMatch[1]!)
      }
      if (typeof body.assignee_id === 'string') {
        db.prepare('UPDATE embed_conversations SET assignee_id = ? WHERE id = ?').run(body.assignee_id || null, updMatch[1]!)
      }
      sendJson(res, 200, { ok: true })
    }).catch(() => sendJson(res, 400, { error: 'bad request' }))
    return true
  }

  return false
}

// ---------------------------------------------------------------------------
// Realtime (WS topic publish)
// ---------------------------------------------------------------------------

/**
 * Publish a frame to the conversation topic over the signaling relay. The
 * server-side WebSocket room for `embed:c:<conversationId>` is maintained by
 * the signaling server (the widget and the operator Team Inbox both subscribe).
 * We reuse the same server-level registration so no extra infra is required.
 */
function publishToConversation(conversationId: string, frame: object): void {
  // Publish to the conversation topic over the signaling relay. The publisher
  // is registered once by the signaling server at startup (embedRealtime.ts);
  // this indirection keeps embed.ts free of a hard dependency on the WS server.
  const { publishToTopic } = registeredEmbedRealtime
  if (publishToTopic) publishToTopic(`embed:c:${conversationId}`, frame)
}

export const registeredEmbedRealtime: { publishToTopic?: (topic: string, frame: object) => void } = {}

export { originAllowedForRequest, getVisitorToken, ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_BYTES }

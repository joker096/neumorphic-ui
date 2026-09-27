import { IncomingMessage, ServerResponse } from 'node:http'
import { getDb } from '../db.js'
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js'
import { resolveClientIp } from '../middleware/clientIp.js'

const adsRateLimit = new Map<string, { count: number; resetAt: number }>()

function checkAdsRateLimit(ip: string, maxRequests = 50, windowMs = 60000): boolean {
  const now = Date.now()
  let entry = adsRateLimit.get(ip)
  if (!entry || now > entry.resetAt) {
    adsRateLimit.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= maxRequests) return false
  entry.count++
  return true
}

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of adsRateLimit) {
    if (now > entry.resetAt) adsRateLimit.delete(key)
  }
}, 300000)

export function handleAdsRoute(req: IncomingMessage, res: ServerResponse, path: string): boolean {
  // Rate limit for client endpoints
  const ip = resolveClientIp(req)
  if (!checkAdsRateLimit(ip)) {
    res.writeHead(429, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Too many requests' }))
    return true
  }

  // Client endpoints (no auth)
  if (path === '/api/ads/active' && req.method === 'GET') { handleGetActiveAd(res); return true }
  const impMatch = path.match(/^\/api\/ads\/(\d+)\/impression$/)
  if (impMatch && req.method === 'POST') { handleTrackImpression(res, parseInt(impMatch[1]!)); return true }
  const clickMatch = path.match(/^\/api\/ads\/(\d+)\/click$/)
  if (clickMatch && req.method === 'POST') { handleTrackClick(res, parseInt(clickMatch[1]!)); return true }

  // Admin endpoints (auth required)
  const authReq = req as AuthenticatedRequest
  if (path === '/api/ads' && req.method === 'GET') {
    if (!requireAuth(authReq, res)) return true
    handleListAds(res); return true
  }
  if (path === '/api/ads' && req.method === 'POST') {
    if (!requireAuth(authReq, res)) return true
    handleCreateAd(req, res); return true
  }
  const match = path.match(/^\/api\/ads\/(\d+)$/)
  if (match) {
    const id = parseInt(match[1]!)
    if (req.method === 'PUT') {
      if (!requireAuth(authReq, res)) return true
      handleUpdateAd(req, res, id); return true
    }
    if (req.method === 'DELETE') {
      if (!requireAuth(authReq, res)) return true
      handleDeleteAd(authReq, res, id); return true
    }
  }
  return false
}

const MAX_BODY_SIZE = 1024 * 100 // 100KB limit

const HTTP_URL_RE = /^https?:\/\//i

export function validateAdInput(data: any): string | null {
  if (typeof data !== 'object' || data === null) return 'Invalid request body'
  for (const f of ['title', 'image_url', 'target_url'] as const) {
    const v = data[f]
    if (typeof v !== 'string' || !v.trim()) return `${f}: required`
    if (f === 'title' && v.trim().length > 200) return 'title: max 200 characters'
    if (f !== 'title' && (v.length > 2048 || !HTTP_URL_RE.test(v))) return `${f}: must be a valid http(s) URL`
  }
  if (data.active !== undefined && typeof data.active !== 'boolean') return 'active: must be a boolean'
  return null
}

function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = ''
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BODY_SIZE) {
        req.destroy()
        reject(new Error('Request body too large'))
        return
      }
      body += chunk.toString()
    })
    req.on('end', () => {
      try { resolve(JSON.parse(body)) } catch { reject(new Error('Invalid JSON')) }
    })
    req.on('error', reject)
  })
}

function handleGetActiveAd(res: ServerResponse): void {
  const ad = getDb().prepare(
    'SELECT id, title, image_url, target_url FROM ads WHERE active = 1 ORDER BY updated_at DESC LIMIT 1'
  ).get() as any

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ ad: ad || null }))
}

function handleTrackImpression(res: ServerResponse, adId: number): void {
  getDb().prepare("INSERT INTO ad_events (ad_id, type) VALUES (?, 'impression')").run(adId)
  getDb().prepare('UPDATE ads SET impressions = impressions + 1 WHERE id = ?').run(adId)
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ ok: true }))
}

function handleTrackClick(res: ServerResponse, adId: number): void {
  getDb().prepare("INSERT INTO ad_events (ad_id, type) VALUES (?, 'click')").run(adId)
  getDb().prepare('UPDATE ads SET clicks = clicks + 1 WHERE id = ?').run(adId)
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ ok: true }))
}

function handleListAds(res: ServerResponse): void {
  const ads = getDb().prepare('SELECT * FROM ads ORDER BY created_at DESC').all()
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ ads }))
}

async function handleCreateAd(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const { title, image_url, target_url, active } = await readBody(req)
    const err = validateAdInput({ title, image_url, target_url, active })
    if (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err }))
      return
    }
    const result = getDb().prepare(
      'INSERT INTO ads (title, image_url, target_url, active) VALUES (?, ?, ?, ?)'
    ).run(title, image_url, target_url, active ? 1 : 0)
    res.writeHead(201, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ id: result.lastInsertRowid }))
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid request body' }))
  }
}

async function handleUpdateAd(req: IncomingMessage, res: ServerResponse, id: number): Promise<void> {
  try {
    const fields = await readBody(req)
    const existing = getDb().prepare('SELECT * FROM ads WHERE id = ?').get(id) as any
    if (!existing) {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Ad not found' }))
      return
    }
    const candidate = {
      title: fields.title ?? existing.title,
      image_url: fields.image_url ?? existing.image_url,
      target_url: fields.target_url ?? existing.target_url,
    }
    const err = validateAdInput(candidate)
    if (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err }))
      return
    }
    getDb().prepare(`
      UPDATE ads SET title = ?, image_url = ?, target_url = ?, active = ?,
        updated_at = datetime('now') WHERE id = ?
    `).run(
      candidate.title,
      candidate.image_url,
      candidate.target_url,
      fields.active !== undefined ? (fields.active ? 1 : 0) : existing.active,
      id
    )
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid request body' }))
  }
}

function handleDeleteAd(req: AuthenticatedRequest, res: ServerResponse, id: number): void {
  const ad = getDb().prepare('SELECT * FROM ads WHERE id = ?').get(id) as any
  if (!ad) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Ad not found' }))
    return
  }
  getDb().prepare('DELETE FROM ad_events WHERE ad_id = ?').run(id)
  getDb().prepare('DELETE FROM ads WHERE id = ?').run(id)
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ ok: true }))
}

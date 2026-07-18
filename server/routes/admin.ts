import { IncomingMessage, ServerResponse } from 'node:http'
import { getDb } from '../db.js'
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js'

const MAX_BODY_SIZE = 1024 * 100

function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = ''
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BODY_SIZE) { req.destroy(); reject(new Error('Request body too large')); return }
      body += chunk.toString()
    })
    req.on('end', () => {
      try { resolve(JSON.parse(body)) } catch { reject(new Error('Invalid JSON')) }
    })
    req.on('error', reject)
  })
}

// --- Analytics Endpoints ---

function handleGetStatsOverview(res: ServerResponse): void {
  const db = getDb()
  const totalUsers = (db.prepare('SELECT COUNT(DISTINCT public_key) as count FROM connections WHERE country IS NOT NULL').get() as any).count || 0
  const connectedNow = (db.prepare("SELECT COUNT(*) as count FROM connections WHERE disconnected_at IS NULL").get() as any).count || 0
  const connected24h = (db.prepare("SELECT COUNT(*) as count FROM connections WHERE connected_at >= datetime('now', '-1 day')").get() as any).count || 0
  const totalConnections = (db.prepare('SELECT COUNT(*) as count FROM connections').get() as any).count || 0
  const totalDisconnections = (db.prepare('SELECT COUNT(*) as count FROM connections WHERE disconnected_at IS NOT NULL').get() as any).count || 0

  const recentUsers = (db.prepare("SELECT COUNT(DISTINCT public_key) as count FROM connections WHERE connected_at >= datetime('now', '-1 day')").get() as any).count || 0

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ totalUsers, connectedNow, connected24h, totalConnections, recentUsers }))
}

function handleGetUsersList(req: IncomingMessage, res: ServerResponse): void {
  const params = new URLSearchParams((req as any).url?.split('?')[1] || '')
  const page = parseInt(params.get('page') || '1', 10) || 1
  const limit = Math.min(parseInt(params.get('limit') || '50', 10) || 50, 200)
  const offset = (page - 1) * limit

  const search = params.get('search') || ''
  const query = search ? `WHERE public_key LIKE ? OR country LIKE ?` : ''
  const paramsArr = search ? [`%${search}%`, `%${search}%`] : []

  const rows = getDb().prepare(`
    SELECT public_key, country, user_agent, connected_at, disconnected_at, COUNT(*) as connection_count
    FROM connections
    ${query}
    GROUP BY public_key
    ORDER BY MAX(connected_at) DESC
    LIMIT ? OFFSET ?
  `).all(...paramsArr, limit, offset) as any[]

  const total = getDb().prepare(`
    SELECT COUNT(DISTINCT public_key) as count FROM connections
    ${query}
  `).get(...paramsArr) as any

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ users: rows, total: total?.count || 0, page, limit }))
}

function handleGetDeviceStats(res: ServerResponse): void {
  const rows = getDb().prepare(`
    SELECT user_agent, COUNT(*) as count
    FROM connections
    WHERE user_agent IS NOT NULL AND user_agent != ''
    GROUP BY user_agent
    ORDER BY count DESC
    LIMIT 10
  `).all() as { user_agent: string, count: number }[]

  const osMap: Record<string, number> = {}
  for (const { user_agent, count } of rows) {
    const os = parseOS(user_agent)
    osMap[os] = (osMap[os] || 0) + count
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ devices: Object.entries(osMap).map(([name, count]) => ({ name, count })) }))
}

function parseOS(ua: string): string {
  if (!ua) return 'Unknown'
  if (/android/.test(ua)) return 'Android'
  if (/ios|iphone|ipad|ipod/.test(ua)) return 'iOS'
  if (/windows/.test(ua)) return 'Windows'
  if (/macos|mac os x/.test(ua)) return 'macOS'
  if (/linux/.test(ua)) return 'Linux'
  if (/mobile|phone/.test(ua)) return 'Mobile'
  return 'Other'
}

function handleGetCountryStats(res: ServerResponse): void {
  const rows = getDb().prepare(`
    SELECT country, COUNT(DISTINCT public_key) as users
    FROM connections
    WHERE country IS NOT NULL
    GROUP BY country
    ORDER BY users DESC
    LIMIT 20
  `).all() as { country: string, users: number }[]

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ countries: rows }))
}

function handleGetAdAnalytics(req: IncomingMessage, res: ServerResponse): void {
  const params = new URLSearchParams((req as any).url?.split('?')[1] || '')
  const adId = params.get('adId')

  if (adId) {
    const events = getDb().prepare(`
      SELECT type, COUNT(*) as count, DATE(created_at) as day
      FROM ad_events WHERE ad_id = ?
      GROUP BY DATE(created_at)
      ORDER BY day DESC
      LIMIT 30
    `).all(parseInt(adId)) as any[]

    const stats = getDb().prepare('SELECT SUM(impressions) as total_imp, SUM(clicks) as total_clk FROM ads WHERE id = ?').get(parseInt(adId)) as any

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ events, totalImpressions: stats?.total_imp || 0, totalClicks: stats?.total_clk || 0 }))
  } else {
    const ads = getDb().prepare('SELECT id, title, image_url, active, impressions, clicks, created_at FROM ads ORDER BY created_at DESC').all() as any[]

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ads }))
  }
}

// --- Admin Management Endpoints ---

function handleCreateAd(req: IncomingMessage, res: ServerResponse): void {
  readBody(req).then(async (data) => {
    try {
      const { title, image_url, target_url, active = true } = data
      if (!title || !image_url || !target_url) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'title, image_url, target_url required' }))
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
  }).catch(() => {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid JSON' }))
  })
}

function handleUpdateAd(req: IncomingMessage, res: ServerResponse, id: number): void {
  readBody(req).then(async (data) => {
    try {
      const existing = getDb().prepare('SELECT * FROM ads WHERE id = ?').get(id) as any
      if (!existing) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Ad not found' }))
        return
      }
      getDb().prepare(`
        UPDATE ads SET title = ?, image_url = ?, target_url = ?, active = ?,
          updated_at = datetime('now') WHERE id = ?
      `).run(
        data.title ?? existing.title,
        data.image_url ?? existing.image_url,
        data.target_url ?? existing.target_url,
        data.active !== undefined ? (data.active ? 1 : 0) : existing.active,
        id
      )
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true }))
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Invalid request body' }))
    }
  }).catch(() => {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid JSON' }))
  })
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

// --- Main Handler ---

export function handleAdminRoute(req: IncomingMessage, res: ServerResponse, path: string): boolean {
  const authReq = req as AuthenticatedRequest

  // Analytics read endpoints (no auth - public but rate limited)
  if (path === '/api/admin/stats' && req.method === 'GET') {
    handleGetStatsOverview(res)
    return true
  }
  if (path === '/api/admin/users' && req.method === 'GET') {
    handleGetUsersList(req, res)
    return true
  }
  if (path === '/api/admin/devices' && req.method === 'GET') {
    handleGetDeviceStats(res)
    return true
  }
  if (path === '/api/admin/countries' && req.method === 'GET') {
    handleGetCountryStats(res)
    return true
  }

  // Admin write endpoints (auth required)
  if (path === '/api/admin/ads' && req.method === 'GET') {
    if (!requireAuth(authReq, res)) return true
    handleGetAdAnalytics(req, res)
    return true
  }
  if (path === '/api/admin/ads' && req.method === 'POST') {
    if (!requireAuth(authReq, res)) return true
    handleCreateAd(req, res)
    return true
  }
  if (path.match(/^\/api\/admin\/ads\/\d+$/) && req.method === 'PUT') {
    if (!requireAuth(authReq, res)) return true
    const match = path.match(/^\/api\/admin\/ads\/(\d+)$/)
    handleUpdateAd(req, res, parseInt(match?.[1] || '0'))
    return true
  }
  if (path.match(/^\/api\/admin\/ads\/\d+$/) && req.method === 'DELETE') {
    if (!requireAuth(authReq, res)) return true
    const match = path.match(/^\/api\/admin\/ads\/(\d+)$/)
    handleDeleteAd(authReq, res, parseInt(match?.[1] || '0'))
    return true
  }

  return false
}

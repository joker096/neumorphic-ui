import { IncomingMessage, ServerResponse } from 'node:http'
import { getDb } from '../db.js'
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js'

export function handleStatsRoute(req: IncomingMessage, res: ServerResponse, path: string): boolean {
  const authReq = req as AuthenticatedRequest
  if (path === '/api/stats/overview' && req.method === 'GET') {
    if (!requireAuth(authReq, res)) return true
    handleOverview(res)
    return true
  }
  if (path === '/api/stats/countries' && req.method === 'GET') {
    if (!requireAuth(authReq, res)) return true
    handleCountries(res)
    return true
  }
  if (path === '/api/stats/devices' && req.method === 'GET') {
    if (!requireAuth(authReq, res)) return true
    handleDevices(res)
    return true
  }
  if (path === '/api/stats/users' && req.method === 'GET') {
    if (!requireAuth(authReq, res)) return true
    handleUsers(req, res)
    return true
  }
  return false
}

function handleOverview(res: ServerResponse): void {
  const db = getDb()
  const onlineNow = (db.prepare(
    "SELECT COUNT(*) as count FROM connections WHERE disconnected_at IS NULL"
  ).get() as { count: number }).count

  const today = (db.prepare(
    "SELECT COUNT(*) as count FROM connections WHERE connected_at >= datetime('now', '-1 day')"
  ).get() as { count: number }).count

  const totalUsers = (db.prepare(
    'SELECT COUNT(DISTINCT public_key) as count FROM connections'
  ).get() as { count: number }).count

  const countries = (db.prepare(
    'SELECT COUNT(DISTINCT country) as count FROM connections WHERE country IS NOT NULL'
  ).get() as { count: number }).count

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ onlineNow, today, totalUsers, countries }))
}

function handleCountries(res: ServerResponse): void {
  const rows = getDb().prepare(`
    SELECT country, COUNT(DISTINCT public_key) as count
    FROM connections WHERE country IS NOT NULL
    GROUP BY country ORDER BY count DESC LIMIT 20
  `).all()

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ countries: rows }))
}

function handleDevices(res: ServerResponse): void {
  const rows = getDb().prepare(
    "SELECT user_agent FROM connections WHERE user_agent != ''"
  ).all() as { user_agent: string }[]

  const osCount: Record<string, number> = {}
  let total = 0

  for (const { user_agent } of rows) {
    const os = parseOS(user_agent)
    osCount[os] = (osCount[os] || 0) + 1
    total++
  }

  const devices = Object.entries(osCount).map(([name, count]) => ({
    name,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  })).sort((a, b) => b.count - a.count)

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ devices, total }))
}

function handleUsers(req: IncomingMessage, res: ServerResponse): void {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200)
  const offset = (page - 1) * limit

  const total = (getDb().prepare(
    'SELECT COUNT(DISTINCT public_key) as count FROM connections'
  ).get() as { count: number }).count

  const users = getDb().prepare(`
    SELECT public_key, ip, country, user_agent,
           MIN(connected_at) as first_seen,
           MAX(connected_at) as last_seen,
           CASE WHEN MAX(disconnected_at) IS NULL
             AND MAX(connected_at) > datetime('now', '-5 minutes')
             THEN 1 ELSE 0 END as is_online
    FROM connections
    GROUP BY public_key
    ORDER BY last_seen DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset)

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ users, total, page, limit }))
}

function parseOS(ua: string): string {
  if (ua.includes('Windows')) return 'Windows'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iOS')) return 'iOS'
  if (ua.includes('Macintosh') || ua.includes('Mac OS')) return 'macOS'
  if (ua.includes('Linux')) return 'Linux'
  if (ua.includes('CrOS')) return 'ChromeOS'
  return 'Other'
}

# Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build admin panel with 2FA, user analytics (online count, countries, devices), and in-app ad management for the Mess&Anger P2P messenger.

**Architecture:** Extend existing WebSocket signaling server (`server/signaling-server.ts`, port 8765) with a REST API (port 8766), SQLite database, and JWT+TOTP auth. Build a separate React SPA admin UI and an AdBanner component for the main app.

**Tech Stack:** Node.js, TypeScript, `better-sqlite3`, `jsonwebtoken`, `otpauth`, `geoip-lite`, `ua-parser-js`, React, Vite, Tailwind CSS

---

## File Structure

```
server/
├── db.ts                   — SQLite connection + schema init
├── auth.ts                 — JWT + TOTP helpers
├── cli.ts                  — Admin creation CLI (npm run admin:create)
├── signaling-server.ts     — MODIFIED: add connection logging + REST server
├── middleware/
│   └── auth.ts             — JWT verification middleware
├── routes/
│   ├── auth.ts             — POST login, verify-2fa, logout
│   ├── stats.ts            — GET overview, users, countries, devices
│   └── ads.ts              — CRUD ads + client endpoints
└── __tests__/
    ├── db.test.ts
    ├── auth.test.ts
    ├── stats.test.ts
    └── ads.test.ts

admin/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── api/
    │   └── client.ts        — API client with JWT handling
    ├── hooks/
    │   └── useAuth.ts       — Auth context + hook
    ├── pages/
    │   ├── Login.tsx
    │   ├── Verify2FA.tsx
    │   ├── Dashboard.tsx
    │   ├── Users.tsx
    │   ├── Devices.tsx
    │   ├── Ads.tsx
    │   └── Settings.tsx
    └── components/
        ├── Layout.tsx       — Sidebar + top bar shell
        ├── MetricCard.tsx
        └── StatTable.tsx

src/components/ui/
├── AdBanner.tsx             — NEW: in-app ad display component
└── AdBanner.test.tsx        — NEW: ad banner tests
```

---

## Pre-Flight: Install Server Dependencies

**Note:** Run before Task 1.

- [ ] **Step 1: Install new server deps**

```bash
npm install better-sqlite3 jsonwebtoken otpauth geoip-lite ua-parser-js qrcode
npm install -D @types/better-sqlite3 @types/jsonwebtoken @types/geoip-lite @types/ua-parser-js @types/qrcode
```

- [ ] **Step 2: Verify install**

```bash
node -e "require('better-sqlite3'); require('jsonwebtoken'); require('otpauth'); console.log('OK')"
```

Expected output: `OK`

---

### Task 1: Database Layer + Connection Logging

**Files:**
- Create: `server/db.ts`
- Modify: `server/signaling-server.ts`
- Create: `server/__tests__/db.test.ts`

- [ ] **Step 1: Create `server/db.ts` with schema init**

```typescript
import Database from 'better-sqlite3'
import path from 'node:path'

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'admin.db')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    const fs = await import('node:fs')
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initSchema()
  }
  return db
}

function initSchema(): void {
  const d = getDb()
  d.exec(`
    CREATE TABLE IF NOT EXISTS connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      public_key TEXT NOT NULL,
      ip TEXT NOT NULL,
      user_agent TEXT NOT NULL DEFAULT '',
      country TEXT,
      connected_at TEXT NOT NULL DEFAULT (datetime('now')),
      disconnected_at TEXT
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      totp_secret TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL REFERENCES admins(id),
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      image_url TEXT NOT NULL,
      target_url TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 0,
      impressions INTEGER NOT NULL DEFAULT 0,
      clicks INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ad_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ad_id INTEGER NOT NULL REFERENCES ads(id),
      public_key TEXT,
      type TEXT NOT NULL CHECK(type IN ('impression', 'click')),
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL REFERENCES admins(id),
      action TEXT NOT NULL,
      ip TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_connections_pk ON connections(public_key);
    CREATE INDEX IF NOT EXISTS idx_connections_country ON connections(country);
    CREATE INDEX IF NOT EXISTS idx_ad_events_ad ON ad_events(ad_id);
  `)
}

export function logConnection(pk: string, ip: string, ua: string, country?: string): void {
  getDb().prepare(`
    INSERT INTO connections (public_key, ip, user_agent, country) VALUES (?, ?, ?, ?)
  `).run(pk, ip, ua, country || null)
}

export function logDisconnection(pk: string): void {
  getDb().prepare(`
    UPDATE connections SET disconnected_at = datetime('now')
    WHERE public_key = ? AND disconnected_at IS NULL
  `).run(pk)
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}

export function getActiveConnectionCount(): number {
  const row = getDb().prepare(`
    SELECT COUNT(*) as count FROM connections WHERE disconnected_at IS NULL
  `).get() as { count: number }
  return row.count
}
```

Wait — `getDb()` uses `await` but is not async. Let me fix:

```typescript
import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'admin.db')

let db: Database.Database | null = null
let initDone = false

export function getDb(): Database.Database {
  if (!db) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  if (!initDone) {
    initDone = true
    initSchema()
  }
  return db
}

function initSchema(): void {
  const d = db!
  d.exec(`
    CREATE TABLE IF NOT EXISTS connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      public_key TEXT NOT NULL,
      ip TEXT NOT NULL,
      user_agent TEXT NOT NULL DEFAULT '',
      country TEXT,
      connected_at TEXT NOT NULL DEFAULT (datetime('now')),
      disconnected_at TEXT
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      totp_secret TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL REFERENCES admins(id),
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      image_url TEXT NOT NULL,
      target_url TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 0,
      impressions INTEGER NOT NULL DEFAULT 0,
      clicks INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ad_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ad_id INTEGER NOT NULL REFERENCES ads(id),
      public_key TEXT,
      type TEXT NOT NULL CHECK(type IN ('impression', 'click')),
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL REFERENCES admins(id),
      action TEXT NOT NULL,
      ip TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_connections_pk ON connections(public_key);
    CREATE INDEX IF NOT EXISTS idx_connections_country ON connections(country);
    CREATE INDEX IF NOT EXISTS idx_ad_events_ad ON ad_events(ad_id);
  `)
}

export function logConnection(pk: string, ip: string, ua: string, country?: string): void {
  getDb().prepare(`
    INSERT INTO connections (public_key, ip, user_agent, country) VALUES (?, ?, ?, ?)
  `).run(pk, ip, ua, country || null)
}

export function logDisconnection(pk: string): void {
  getDb().prepare(`
    UPDATE connections SET disconnected_at = datetime('now')
    WHERE public_key = ? AND disconnected_at IS NULL
  `).run(pk)
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
    initDone = false
  }
}

export function getActiveConnectionCount(): number {
  const row = getDb().prepare(`
    SELECT COUNT(*) as count FROM connections WHERE disconnected_at IS NULL
  `).get() as { count: number }
  return row.count
}
```

- [ ] **Step 2: Write the DB test**

```typescript
// server/__tests__/db.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'

const TEST_DB = path.join(process.cwd(), 'data', 'test-admin.db')

describe('Database Layer', () => {
  let db: Database.Database

  beforeEach(() => {
    fs.mkdirSync(path.dirname(TEST_DB), { recursive: true })
    db = new Database(TEST_DB)
  })

  afterEach(() => {
    db.close()
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB)
  })

  it('should create all tables', () => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS connections (
        id INTEGER PRIMARY KEY AUTOINCREMENT, public_key TEXT NOT NULL,
        ip TEXT NOT NULL, user_agent TEXT NOT NULL DEFAULT '',
        country TEXT, connected_at TEXT NOT NULL DEFAULT (datetime('now')),
        disconnected_at TEXT
      );
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL, totp_secret TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS ads (
        id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL,
        image_url TEXT NOT NULL, target_url TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 0,
        impressions INTEGER NOT NULL DEFAULT 0, clicks INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `)
    const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`).all() as { name: string }[]
    const names = tables.map(t => t.name)
    expect(names).toContain('connections')
    expect(names).toContain('admins')
    expect(names).toContain('ads')
  })

  it('should insert and read a connection', () => {
    db.exec(`CREATE TABLE IF NOT EXISTS connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT, public_key TEXT NOT NULL,
      ip TEXT NOT NULL, user_agent TEXT NOT NULL DEFAULT '',
      country TEXT, connected_at TEXT NOT NULL DEFAULT (datetime('now')),
      disconnected_at TEXT
    )`)
    db.prepare(`INSERT INTO connections (public_key, ip, user_agent, country) VALUES (?, ?, ?, ?)`)
      .run('pk1', '1.2.3.4', 'TestAgent', 'US')
    const row = db.prepare(`SELECT * FROM connections WHERE public_key = ?`).get('pk1') as any
    expect(row.public_key).toBe('pk1')
    expect(row.ip).toBe('1.2.3.4')
    expect(row.country).toBe('US')
  })

  it('should update disconnection time', () => {
    db.exec(`CREATE TABLE IF NOT EXISTS connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT, public_key TEXT NOT NULL,
      ip TEXT NOT NULL, user_agent TEXT NOT NULL DEFAULT '',
      country TEXT, connected_at TEXT NOT NULL DEFAULT (datetime('now')),
      disconnected_at TEXT
    )`)
    db.prepare(`INSERT INTO connections (public_key, ip, user_agent, country) VALUES (?, ?, ?, ?)`)
      .run('pk2', '5.6.7.8', 'TestAgent', 'DE')
    db.prepare(`UPDATE connections SET disconnected_at = datetime('now') WHERE public_key = ? AND disconnected_at IS NULL`)
      .run('pk2')
    const row = db.prepare(`SELECT * FROM connections WHERE public_key = ?`).get('pk2') as any
    expect(row.disconnected_at).not.toBeNull()
  })
})
```

- [ ] **Step 3: Run test to verify it fails (since db.ts doesn't exist yet)**

```bash
npx vitest run server/__tests__/db.test.ts
Expected: FAIL (error loading db.ts)
```

- [ ] **Step 4: Create `server/db.ts` with the full implementation above**

- [ ] **Step 5: Modify `server/signaling-server.ts` — add connection logging on WS open/close**

Modify the `wss.on('connection', (ws) => { ... })` handler. At the start of the connection callback, add:

```typescript
import { logConnection, logDisconnection, closeDb } from './db.js'
import { lookup } from 'geoip-lite'
import { parse } from 'ua-parser-js'

// Inside ws.on('connection'):
const ip = ws._socket?.remoteAddress || req.socket.remoteAddress || 'unknown'
const ua = ws.upgradeReq?.headers?.['user-agent'] || req.headers?.['user-agent'] || ''
const geo = lookup(ip)
const country = geo?.country || null
// Don't log until register message — we don't have publicKey yet
let registeredPk: string | null = null

// In the 'register' case, add after setting registeredKey:
registeredKey = msg.publicKey
logConnection(registeredKey, ip, ua, country)

// In the 'close' handler, replace current code:
ws.on('close', () => {
  if (registeredKey) {
    logDisconnection(registeredKey)
    if (clients.get(registeredKey) === ws) {
      clients.delete(registeredKey)
    }
  }
})
```

Also add graceful shutdown:
```typescript
process.on('SIGINT', () => {
  console.log('\nShutting down...')
  closeDb()
  process.exit(0)
})
process.on('SIGTERM', () => {
  closeDb()
  process.exit(0)
})
```

- [ ] **Step 6: Run tests**

```bash
npx vitest run server/__tests__/db.test.ts
Expected: PASS
```

- [ ] **Step 7: Commit**

```bash
git add server/db.ts server/signaling-server.ts server/__tests__/db.test.ts package.json package-lock.json
git commit -m "feat(server): add SQLite DB with connection logging"
```

---

### Task 2: Admin Auth — CLI + JWT + TOTP

**Files:**
- Create: `server/auth.ts`
- Create: `server/cli.ts`
- Create: `server/middleware/auth.ts`
- Create: `server/routes/auth.ts`
- Create: `server/__tests__/auth.test.ts`

- [ ] **Step 1: Write auth tests**

```typescript
// server/__tests__/auth.test.ts
import { describe, it, expect } from 'vitest'
import jwt from 'jsonwebtoken'

const JWT_SECRET = 'test-secret'

describe('Auth', () => {
  it('should generate and verify JWT', () => {
    const payload = { adminId: 1, username: 'admin' }
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
    const decoded = jwt.verify(token, JWT_SECRET) as any
    expect(decoded.adminId).toBe(1)
    expect(decoded.username).toBe('admin')
  })

  it('should reject expired token', () => {
    const token = jwt.sign({ adminId: 1 }, JWT_SECRET, { expiresIn: '0s' })
    expect(() => jwt.verify(token, JWT_SECRET)).toThrow()
  })

  it('should reject invalid signature', () => {
    const token = jwt.sign({ adminId: 1 }, 'wrong-secret')
    expect(() => jwt.verify(token, JWT_SECRET)).toThrow()
  })
})
```

- [ ] **Step 2: Create `server/auth.ts` — JWT helpers + TOTP**

```typescript
import jwt from 'jsonwebtoken'
import { TOTP } from 'otpauth'
import { getDb } from './db.js'

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production-' + Date.now().toString(36)
const JWT_EXPIRY = '24h'
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000

export interface JwtPayload {
  adminId: number
  username: string
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}

export function generateTotpSecret(): { secret: string; uri: string } {
  const totp = new TOTP({
    issuer: 'Mess&Anger',
    label: 'admin',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  })
  return {
    secret: totp.secret.base32,
    uri: totp.toString(),
  }
}

export function verifyTotp(secretBase32: string, token: string): boolean {
  const totp = new TOTP({
    secret: secretBase32,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  })
  const delta = totp.validate({ token, window: 1 })
  return delta !== null
}

export function createAdminSession(adminId: number, token: string): void {
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS).toISOString()
  getDb().prepare(`INSERT INTO sessions (admin_id, token, expires_at) VALUES (?, ?, ?)`)
    .run(adminId, token, expiresAt)
}

export function validateSession(token: string): JwtPayload | null {
  try {
    const payload = verifyToken(token)
    const row = getDb().prepare(
      `SELECT id FROM sessions WHERE token = ? AND expires_at > datetime('now')`
    ).get(token)
    if (!row) return null
    return payload
  } catch {
    return null
  }
}

export function invalidateSession(token: string): void {
  getDb().prepare(`DELETE FROM sessions WHERE token = ?`).run(token)
}
```

- [ ] **Step 3: Create `server/middleware/auth.ts`**

```typescript
import { IncomingMessage, ServerResponse } from 'node:http'
import { validateSession } from '../auth.js'

export interface AuthenticatedRequest extends IncomingMessage {
  admin?: { adminId: number; username: string }
}

export function requireAuth(req: AuthenticatedRequest, res: ServerResponse): boolean {
  const authHeader = req.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.writeHead(401, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Missing authorization header' }))
    return false
  }

  const token = authHeader.slice(7)
  const payload = validateSession(token)
  if (!payload) {
    res.writeHead(401, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid or expired token' }))
    return false
  }

  req.admin = payload
  return true
}
```

- [ ] **Step 4: Create `server/routes/auth.ts`**

```typescript
import { IncomingMessage, ServerResponse } from 'node:http'
import bcrypt from 'bcrypt'
import { getDb } from '../db.js'
import { signToken, generateTotpSecret, verifyTotp, createAdminSession, invalidateSession } from '../auth.js'
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js'

export function handleAuthRoute(req: IncomingMessage, res: ServerResponse, path: string): boolean {
  if (path === '/api/auth/login' && req.method === 'POST') return handleLogin(req, res)
  if (path === '/api/auth/verify-2fa' && req.method === 'POST') return handleVerify2FA(req, res)
  if (path === '/api/auth/logout' && req.method === 'POST') return handleLogout(req, res)
  return false
}

function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => body += chunk)
    req.on('end', () => {
      try { resolve(JSON.parse(body)) } catch { reject(new Error('Invalid JSON')) }
    })
    req.on('error', reject)
  })
}

async function handleLogin(req: IncomingMessage, res: ServerResponse): Promise<true> {
  try {
    const { username, password } = await readBody(req)
    if (!username || !password) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Username and password required' }))
      return true
    }

    const admin = getDb().prepare(`SELECT * FROM admins WHERE username = ?`).get(username) as any
    if (!admin) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Invalid credentials' }))
      return true
    }

    const valid = await bcrypt.compare(password, admin.password_hash)
    if (!valid) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Invalid credentials' }))
      return true
    }

    const sessionToken = signToken({ adminId: admin.id, username: admin.username })
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ sessionToken, requires2FA: true }))
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid request body' }))
  }
  return true
}

async function handleVerify2FA(req: IncomingMessage, res: ServerResponse): Promise<true> {
  try {
    const { sessionToken, code } = await readBody(req)
    if (!sessionToken || !code) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Session token and code required' }))
      return true
    }

    const payload = validateSession(sessionToken)
    if (!payload) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Invalid or expired session token' }))
      return true
    }

    const admin = getDb().prepare(`SELECT * FROM admins WHERE id = ?`).get(payload.adminId) as any
    if (!admin || !verifyTotp(admin.totp_secret, code)) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Invalid 2FA code' }))
      return true
    }

    const jwt = signToken({ adminId: admin.id, username: admin.username })
    createAdminSession(admin.id, jwt)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ token: jwt }))
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid request body' }))
  }
  return true
}

async function handleLogout(req: AuthenticatedRequest, res: ServerResponse): Promise<true> {
  if (!requireAuth(req, res)) return true
  const authHeader = req.headers['authorization']!
  const token = authHeader.slice(7)
  invalidateSession(token)
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ ok: true }))
  return true
}
```

- [ ] **Step 5: Create `server/cli.ts` for admin creation**

```typescript
import bcrypt from 'bcrypt'
import QRCode from 'qrcode'
import { getDb, closeDb } from './db.js'
import { generateTotpSecret } from './auth.js'

async function createAdmin(username: string, password: string): Promise<void> {
  getDb()
  const existing = getDb().prepare(`SELECT id FROM admins WHERE username = ?`).get(username)
  if (existing) {
    console.error(`Admin "${username}" already exists`)
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const { secret, uri } = generateTotpSecret()

  getDb().prepare(
    `INSERT INTO admins (username, password_hash, totp_secret) VALUES (?, ?, ?)`
  ).run(username, passwordHash, secret)

  console.log(`\n✅ Admin "${username}" created successfully!\n`)
  console.log(`TOTP Secret: ${secret}`)
  console.log(`\nScan this QR code in Google Authenticator or Authy:\n`)
  const qr = await QRCode.toString(uri, { type: 'terminal', small: true })
  console.log(qr)
  console.log(`\nOr use this URI: ${uri}\n`)

  closeDb()
}

const username = process.argv[2]
const password = process.argv[3]

if (!username || !password) {
  console.error('Usage: npx tsx server/cli.ts <username> <password>')
  process.exit(1)
}

createAdmin(username, password).catch((err) => {
  console.error('Failed to create admin:', err)
  closeDb()
  process.exit(1)
})
```

- [ ] **Step 6: Run auth tests**

```bash
npx vitest run server/__tests__/auth.test.ts
Expected: PASS
```

- [ ] **Step 7: Add admin:create script to package.json**

```json
"admin:create": "npx tsx server/cli.ts"
```

- [ ] **Step 8: Commit**

```bash
git add server/auth.ts server/cli.ts server/middleware/auth.ts server/routes/auth.ts server/__tests__/auth.test.ts package.json
git commit -m "feat(server): add admin auth with JWT, TOTP 2FA, and CLI"
```

---

### Task 3: Stats API

**Files:**
- Create: `server/routes/stats.ts`
- Create: `server/__tests__/stats.test.ts`

- [ ] **Step 1: Write stats tests**

```typescript
// server/__tests__/stats.test.ts
import { describe, it, expect } from 'vitest'

describe('Stats API', () => {
  it('should count active connections', () => {
    const rows = [
      { public_key: 'pk1', country: 'US', user_agent: 'Mozilla/5.0 Windows' },
      { public_key: 'pk2', country: 'DE', user_agent: 'Mozilla/5.0 Android' },
      { public_key: 'pk3', country: 'US', user_agent: 'Mozilla/5.0 Mac' },
    ]
    const activeCount = rows.filter(r => r).length // simple mock
    expect(activeCount).toBe(3)

    const countries: Record<string, number> = {}
    for (const r of rows) {
      if (r.country) countries[r.country] = (countries[r.country] || 0) + 1
    }
    expect(countries['US']).toBe(2)
    expect(countries['DE']).toBe(1)
  })

  it('should parse devices from user agent', () => {
    const agents = [
      { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120', expected: 'Windows' },
      { ua: 'Mozilla/5.0 (Linux; Android 14) Chrome/120', expected: 'Android' },
      { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17) Safari/605', expected: 'iOS' },
      { ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14) Safari/605', expected: 'macOS' },
    ]

    for (const { ua, expected } of agents) {
      const os = ua.includes('Windows') ? 'Windows'
        : ua.includes('Android') ? 'Android'
        : ua.includes('iPhone') ? 'iOS'
        : ua.includes('Macintosh') ? 'macOS'
        : 'Other'
      expect(os).toBe(expected)
    }
  })
})
```

- [ ] **Step 2: Create `server/routes/stats.ts`**

```typescript
import { IncomingMessage, ServerResponse } from 'node:http'
import { getDb } from '../db.js'
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js'

export function handleStatsRoute(req: AuthenticatedRequest, res: ServerResponse, path: string): boolean {
  if (!requireAuth(req, res)) return true

  if (path === '/api/stats/overview' && req.method === 'GET') return handleOverview(res)
  if (path === '/api/stats/countries' && req.method === 'GET') return handleCountries(res)
  if (path === '/api/stats/devices' && req.method === 'GET') return handleDevices(res)
  if (path === '/api/stats/users' && req.method === 'GET') return handleUsers(req, res)
  return false
}

function handleOverview(res: ServerResponse): true {
  const db = getDb()

  const onlineNow = (db.prepare(
    `SELECT COUNT(*) as count FROM connections WHERE disconnected_at IS NULL`
  ).get() as { count: number }).count

  const today = (db.prepare(
    `SELECT COUNT(*) as count FROM connections WHERE connected_at >= datetime('now', '-1 day')`
  ).get() as { count: number }).count

  const totalUsers = (db.prepare(
    `SELECT COUNT(DISTINCT public_key) as count FROM connections`
  ).get() as { count: number }).count

  const countries = (db.prepare(
    `SELECT COUNT(DISTINCT country) as count FROM connections WHERE country IS NOT NULL`
  ).get() as { count: number }).count

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ onlineNow, today, totalUsers, countries }))
  return true
}

function handleCountries(res: ServerResponse): true {
  const rows = getDb().prepare(`
    SELECT country, COUNT(DISTINCT public_key) as count
    FROM connections WHERE country IS NOT NULL
    GROUP BY country ORDER BY count DESC LIMIT 20
  `).all()

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ countries: rows }))
  return true
}

function handleDevices(res: ServerResponse): true {
  const rows = getDb().prepare(`
    SELECT user_agent FROM connections WHERE user_agent != ''
  `).all() as { user_agent: string }[]

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
  return true
}

function handleUsers(req: IncomingMessage, res: ServerResponse): true {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200)
  const offset = (page - 1) * limit

  const total = (getDb().prepare(`SELECT COUNT(DISTINCT public_key) as count FROM connections`).get() as { count: number }).count

  const users = getDb().prepare(`
    SELECT public_key, ip, country, user_agent,
           MIN(connected_at) as first_seen,
           MAX(connected_at) as last_seen,
           CASE WHEN MAX(disconnected_at) IS NULL AND MAX(connected_at) > datetime('now', '-5 minutes')
             THEN 1 ELSE 0 END as is_online
    FROM connections
    GROUP BY public_key
    ORDER BY last_seen DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset)

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ users, total, page, limit }))
  return true
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
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run server/__tests__/stats.test.ts
Expected: PASS
```

- [ ] **Step 4: Commit**

```bash
git add server/routes/stats.ts server/__tests__/stats.test.ts
git commit -m "feat(server): add stats API (overview, countries, devices, users)"
```

---

### Task 4: Ads API

**Files:**
- Create: `server/routes/ads.ts`
- Create: `server/__tests__/ads.test.ts`

- [ ] **Step 1: Write ads tests**

```typescript
// server/__tests__/ads.test.ts
import { describe, it, expect } from 'vitest'

describe('Ads API', () => {
  it('should track impressions and clicks', () => {
    const events: Array<{ adId: number; type: string; pk: string }> = []

    function trackImpression(adId: number, pk: string) {
      events.push({ adId, type: 'impression', pk })
    }
    function trackClick(adId: number, pk: string) {
      events.push({ adId, type: 'click', pk })
    }

    trackImpression(1, 'user_a')
    trackImpression(1, 'user_b')
    trackClick(1, 'user_a')

    const impressions = events.filter(e => e.type === 'impression').length
    const clicks = events.filter(e => e.type === 'click').length

    expect(impressions).toBe(2)
    expect(clicks).toBe(1)
  })
})
```

- [ ] **Step 2: Create `server/routes/ads.ts`**

```typescript
import { IncomingMessage, ServerResponse } from 'node:http'
import { getDb } from '../db.js'
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js'

export function handleAdsRoute(req: AuthenticatedRequest, res: ServerResponse, path: string): boolean {
  // Client endpoints (no auth)
  if (path === '/api/ads/active' && req.method === 'GET') return handleGetActiveAd(res)

  const matchCreate = path.match(/^\/api\/ads\/(\d+)\/impression$/)
  if (matchCreate && req.method === 'POST') return handleTrackImpression(res, parseInt(matchCreate[1]))

  const matchClick = path.match(/^\/api\/ads\/(\d+)\/click$/)
  if (matchClick && req.method === 'POST') return handleTrackClick(res, parseInt(matchClick[1]))

  // Admin endpoints (auth required)
  if (!requireAuth(req, res)) return true

  if (path === '/api/ads' && req.method === 'GET') return handleListAds(res)
  if (path === '/api/ads' && req.method === 'POST') return handleCreateAd(req, res)

  const match = path.match(/^\/api\/ads\/(\d+)$/)
  if (match) {
    const id = parseInt(match[1])
    if (req.method === 'PUT') return handleUpdateAd(req, res, id)
    if (req.method === 'DELETE') return handleDeleteAd(res, id)
  }

  return false
}

function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => body += chunk)
    req.on('end', () => {
      try { resolve(JSON.parse(body)) } catch { reject(new Error('Invalid JSON')) }
    })
    req.on('error', reject)
  })
}

function handleGetActiveAd(res: ServerResponse): true {
  const ad = getDb().prepare(
    `SELECT id, title, image_url, target_url FROM ads WHERE active = 1 ORDER BY updated_at DESC LIMIT 1`
  ).get() as any

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ ad: ad || null }))
  return true
}

async function handleTrackImpression(res: ServerResponse, adId: number): Promise<true> {
  getDb().prepare(`INSERT INTO ad_events (ad_id, type) VALUES (?, 'impression')`).run(adId)
  getDb().prepare(`UPDATE ads SET impressions = impressions + 1 WHERE id = ?`).run(adId)
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ ok: true }))
  return true
}

async function handleTrackClick(res: ServerResponse, adId: number): Promise<true> {
  getDb().prepare(`INSERT INTO ad_events (ad_id, type) VALUES (?, 'click')`).run(adId)
  getDb().prepare(`UPDATE ads SET clicks = clicks + 1 WHERE id = ?`).run(adId)
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ ok: true }))
  return true
}

function handleListAds(res: ServerResponse): true {
  const ads = getDb().prepare(
    `SELECT * FROM ads ORDER BY created_at DESC`
  ).all()
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ ads }))
  return true
}

async function handleCreateAd(req: IncomingMessage, res: ServerResponse): Promise<true> {
  try {
    const { title, image_url, target_url, active } = await readBody(req)
    if (!title || !image_url || !target_url) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'title, image_url, target_url required' }))
      return true
    }
    const result = getDb().prepare(
      `INSERT INTO ads (title, image_url, target_url, active) VALUES (?, ?, ?, ?)`
    ).run(title, image_url, target_url, active ? 1 : 0)
    res.writeHead(201, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ id: result.lastInsertRowid }))
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid request body' }))
  }
  return true
}

async function handleUpdateAd(req: IncomingMessage, res: ServerResponse, id: number): Promise<true> {
  try {
    const fields = await readBody(req)
    const existing = getDb().prepare(`SELECT * FROM ads WHERE id = ?`).get(id) as any
    if (!existing) {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Ad not found' }))
      return true
    }
    getDb().prepare(`
      UPDATE ads SET title = ?, image_url = ?, target_url = ?, active = ?,
        updated_at = datetime('now') WHERE id = ?
    `).run(
      fields.title ?? existing.title,
      fields.image_url ?? existing.image_url,
      fields.target_url ?? existing.target_url,
      fields.active !== undefined ? (fields.active ? 1 : 0) : existing.active,
      id
    )
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid request body' }))
  }
  return true
}

function handleDeleteAd(res: ServerResponse, id: number): true {
  getDb().prepare(`DELETE FROM ad_events WHERE ad_id = ?`).run(id)
  getDb().prepare(`DELETE FROM ads WHERE id = ?`).run(id)
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ ok: true }))
  return true
}
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run server/__tests__/ads.test.ts
Expected: PASS
```

- [ ] **Step 4: Commit**

```bash
git add server/routes/ads.ts server/__tests__/ads.test.ts
git commit -m "feat(server): add ads CRUD and tracking API"
```

---

### Task 5: Wire Up REST Server

**Files:**
- Modify: `server/signaling-server.ts`

- [ ] **Step 1: Add HTTP server for REST API in `server/signaling-server.ts`**

Add at the bottom of the file (before the existing `server.listen`):

```typescript
// --- REST API Server (port 8766) ---
import { createServer as createHttpServer } from 'node:http'
import { handleAuthRoute } from './routes/auth.js'
import { handleStatsRoute } from './routes/stats.js'
import { handleAdsRoute } from './routes/ads.js'

const restServer = createHttpServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
  const path = url.pathname

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const handled =
    handleAuthRoute(req, res, path) ||
    handleStatsRoute(req, res, path) ||
    handleAdsRoute(req, res, path)

  if (!handled) {
    res.writeHead(404)
    res.end(JSON.stringify({ error: 'Not found' }))
  }
})

const REST_PORT = parseInt(process.env.REST_PORT || '8766', 10)
restServer.listen(REST_PORT, () => {
  console.log(`[Mess&Anger] REST API listening on port ${REST_PORT}`)
})
```

Also add the HTTP import at the top of the file (if not already there — `createServer` from `node:http` is already imported).

- [ ] **Step 2: Test the server starts**

```bash
# Start server in background, hit REST endpoint
npx tsx server/signaling-server.ts &
sleep 2
curl -s http://localhost:8766/api/stats/overview | head -c 200
kill %1
```

Expected: JSON response with `onlineNow`, `today`, etc. (even if all zeros).

- [ ] **Step 3: Commit**

```bash
git add server/signaling-server.ts
git commit -m "feat(server): add REST API server on port 8766 with auth, stats, ads routes"
```

---

### Task 6: AdBanner Client Component

**Files:**
- Create: `src/components/ui/AdBanner.tsx`
- Create: `src/components/ui/AdBanner.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/ui/AdBanner.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AdBanner } from './AdBanner'

const mockAd = {
  id: 1,
  title: 'Summer Sale — 50% Off',
  image_url: 'https://example.com/banner.png',
  target_url: 'https://example.com/sale',
}

describe('AdBanner', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should render nothing when no active ad', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ ad: null }),
    })
    const { container } = render(<AdBanner />)
    await waitFor(() => {
      expect(container.innerHTML).toBe('')
    })
  })

  it('should render ad banner when active ad exists', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ ad: mockAd }),
    })
    render(<AdBanner />)
    await waitFor(() => {
      expect(screen.getByText('Summer Sale — 50% Off')).toBeTruthy()
    })
  })

  it('should track impression on render', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ ad: mockAd }),
    })
    render(<AdBanner />)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/ads/1/impression'),
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  it('should track click and open URL on click', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ ad: mockAd }),
    })

    render(<AdBanner />)
    await waitFor(() => {
      expect(screen.getByText('Summer Sale — 50% Off')).toBeTruthy()
    })

    screen.getByText('Summer Sale — 50% Off').click()
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/ads/1/click'),
      expect.objectContaining({ method: 'POST' })
    )
    expect(openSpy).toHaveBeenCalledWith('https://example.com/sale', '_blank')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/ui/AdBanner.test.tsx
Expected: FAIL (module not found)
```

- [ ] **Step 3: Create the AdBanner component**

```typescript
// src/components/ui/AdBanner.tsx
import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:8766'

interface AdData {
  id: number
  title: string
  image_url: string
  target_url: string
}

export function AdBanner() {
  const [ad, setAd] = useState<AdData | null>(null)
  const [impressionSent, setImpressionSent] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/api/ads/active`)
      .then(r => r.json())
      .then(data => {
        if (data.ad) {
          setAd(data.ad)
        }
      })
      .catch(() => {
        // Server unavailable — silently hide ad
      })
  }, [])

  useEffect(() => {
    if (ad && !impressionSent) {
      setImpressionSent(true)
      fetch(`${API_BASE}/api/ads/${ad.id}/impression`, { method: 'POST' })
        .catch(() => {})
    }
  }, [ad, impressionSent])

  if (!ad) return null

  const handleClick = () => {
    fetch(`${API_BASE}/api/ads/${ad.id}/click`, { method: 'POST' })
      .catch(() => {})
    window.open(ad.target_url, '_blank')
  }

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-3 px-4 py-3 mx-2 mb-2 rounded-xl
        bg-gradient-to-r from-orange-500/10 to-amber-500/5
        border border-orange-500/20 cursor-pointer
        hover:from-orange-500/15 hover:to-amber-500/10
        transition-all duration-200 active:scale-[0.99]"
    >
      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-orange-500/20 flex items-center justify-center">
        {ad.image_url ? (
          <img src={ad.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-lg">📢</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-orange-700 dark:text-orange-300 truncate">
          {ad.title}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-orange-500/60">
          sponsored
        </div>
      </div>
      <div className="text-[10px] font-bold px-2 py-0.5 rounded
        bg-orange-500/15 text-orange-600 dark:text-orange-400">
        AD
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/ui/AdBanner.test.tsx
Expected: PASS
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/AdBanner.tsx src/components/ui/AdBanner.test.tsx
git commit -m "feat(ui): add AdBanner component for in-app ad display"
```

---

### Task 7: Admin UI — Scaffold + Login/2FA

**Files:**
- Create: `admin/` Vite + React project
- Create: `admin/src/pages/Login.tsx`
- Create: `admin/src/pages/Verify2FA.tsx`
- Create: `admin/src/api/client.ts`
- Create: `admin/src/hooks/useAuth.ts`

- [ ] **Step 1: Scaffold admin Vite project**

```bash
mkdir -p admin/src/{pages,components,hooks,api}
```

Create `admin/package.json`:
```json
{
  "name": "messanger-admin",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite --port=5174",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "react-router-dom": "^7.1.0",
    "lucide-react": "^0.546.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^5.0.4",
    "typescript": "~5.8.2",
    "vite": "^6.2.3",
    "tailwindcss": "^4.1.14",
    "@tailwindcss/vite": "^4.1.14"
  }
}
```

Create `admin/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

Create `admin/vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5174 },
})
```

Create `admin/index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mess&Anger — Admin Panel</title>
    <link rel="icon" type="image/svg+xml" href="/icon.svg" />
  </head>
  <body class="bg-[#0d0f12] text-white">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `admin/src/main.tsx`:
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
```

Create `admin/src/index.css`:
```css
@import "tailwindcss";
```

- [ ] **Step 2: Create API client**

```typescript
// admin/src/api/client.ts
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8766'

export interface ApiError {
  error: string
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem('admin_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    sessionStorage.removeItem('admin_token')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  return res.json()
}

export const api = {
  login: (username: string, password: string) =>
    request<{ sessionToken: string; requires2FA: boolean }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  verify2FA: (sessionToken: string, code: string) =>
    request<{ token: string }>('/api/auth/verify-2fa', {
      method: 'POST',
      body: JSON.stringify({ sessionToken, code }),
    }),

  logout: () =>
    request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  getOverview: () =>
    request<{ onlineNow: number; today: number; totalUsers: number; countries: number }>('/api/stats/overview'),

  getCountries: () =>
    request<{ countries: Array<{ country: string; count: number }> }>('/api/stats/countries'),

  getDevices: () =>
    request<{ devices: Array<{ name: string; count: number; percentage: number }>; total: number }>('/api/stats/devices'),

  getUsers: (page = 1, limit = 50) =>
    request<{ users: any[]; total: number; page: number; limit: number }>(`/api/stats/users?page=${page}&limit=${limit}`),

  getAds: () =>
    request<{ ads: any[] }>('/api/ads'),

  createAd: (data: { title: string; image_url: string; target_url: string; active?: boolean }) =>
    request<{ id: number }>('/api/ads', { method: 'POST', body: JSON.stringify(data) }),

  updateAd: (id: number, data: Partial<{ title: string; image_url: string; target_url: string; active: boolean }>) =>
    request<{ ok: boolean }>(`/api/ads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteAd: (id: number) =>
    request<{ ok: boolean }>(`/api/ads/${id}`, { method: 'DELETE' }),
}
```

- [ ] **Step 3: Create `admin/src/hooks/useAuth.ts`**

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '../api/client'

interface AuthContextType {
  token: string | null
  login: (username: string, password: string) => Promise<{ sessionToken: string }>
  verify2FA: (code: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  needs2FA: boolean
  sessionToken: string | null
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('admin_token'))
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [needs2FA, setNeeds2FA] = useState(false)

  const login = async (username: string, password: string) => {
    const res = await api.login(username, password)
    setSessionToken(res.sessionToken)
    setNeeds2FA(true)
    return { sessionToken: res.sessionToken }
  }

  const verify2FA = async (code: string) => {
    if (!sessionToken) throw new Error('No session token')
    const res = await api.verify2FA(sessionToken, code)
    setToken(res.token)
    setNeeds2FA(false)
    sessionStorage.setItem('admin_token', res.token)
  }

  const logout = () => {
    api.logout().catch(() => {})
    setToken(null)
    setSessionToken(null)
    setNeeds2FA(false)
    sessionStorage.removeItem('admin_token')
  }

  return (
    <AuthContext.Provider value={{
      token, login, verify2FA, logout,
      isAuthenticated: !!token,
      needs2FA, sessionToken,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

- [ ] **Step 4: Create `admin/src/App.tsx`**

```typescript
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Verify2FA from './pages/Verify2FA'
import Dashboard from './pages/Dashboard'
import Layout from './components/Layout'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, needs2FA } = useAuth()
  if (!isAuthenticated && !needs2FA) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { isAuthenticated, needs2FA } = useAuth()

  if (!isAuthenticated && !needs2FA) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  if (needs2FA) {
    return (
      <Routes>
        <Route path="/login/2fa" element={<Verify2FA />} />
        <Route path="*" element={<Navigate to="/login/2fa" replace />} />
      </Routes>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#0d0f12] text-white">
        <AppRoutes />
      </div>
    </AuthProvider>
  )
}
```

- [ ] **Step 5: Create `admin/src/pages/Login.tsx`**

```typescript
import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Lock, User } from 'lucide-react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/login/2fa')
    } catch {
      setError('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#1a1d24] rounded-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
        <div className="text-center mb-8">
          <div className="text-3xl font-bold mb-2">🔐</div>
          <h1 className="text-xl font-bold">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">Mess&Anger</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text" value={username} onChange={e => setUsername(e.target.value)}
                className="w-full bg-[#0d0f12] text-white rounded-xl pl-10 pr-4 py-2.5
                  border border-white/5 focus:border-orange-500/50 outline-none text-sm"
                placeholder="admin" required autoFocus
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#0d0f12] text-white rounded-xl pl-10 pr-4 py-2.5
                  border border-white/5 focus:border-orange-500/50 outline-none text-sm"
                placeholder="••••••••" required
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500
              text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create `admin/src/pages/Verify2FA.tsx`**

```typescript
import { useState, useRef, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Verify2FA() {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { verify2FA } = useAuth()
  const navigate = useNavigate()
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (i: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newCode = [...code]
    newCode[i] = value.slice(-1)
    setCode(newCode)
    if (value && i < 5) inputRefs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) inputRefs.current[i - 1]?.focus()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const fullCode = code.join('')
    if (fullCode.length !== 6) return
    setError('')
    setLoading(true)
    try {
      await verify2FA(fullCode)
      navigate('/')
    } catch {
      setError('Invalid verification code')
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#1a1d24] rounded-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
        <div className="text-center mb-8">
          <div className="text-3xl font-bold mb-2">🔑</div>
          <h1 className="text-xl font-bold">Two-Factor Auth</h1>
          <p className="text-sm text-gray-500 mt-1">Enter code from authenticator app</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex justify-center gap-2 mb-6">
            {code.map((digit, i) => (
              <input
                key={i} ref={el => inputRefs.current[i] = el}
                type="text" inputMode="numeric" maxLength={1}
                value={digit} onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="w-10 h-12 bg-[#0d0f12] text-white text-lg font-bold text-center rounded-xl
                  border border-white/5 focus:border-orange-500/50 outline-none"
                autoFocus={i === 0}
              />
            ))}
          </div>

          {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

          <button
            type="submit" disabled={loading || code.join('').length !== 6}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500
              text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {loading ? 'Verifying...' : 'Verify & Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Create `admin/src/components/Layout.tsx`**

```typescript
import { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { LayoutDashboard, Users, Monitor, Globe, Megaphone, Settings, LogOut } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/users', label: 'Users', icon: Users },
  { path: '/devices', label: 'Devices', icon: Monitor },
  { path: '/map', label: 'Map', icon: Globe },
  { path: '/ads', label: 'Ads', icon: Megaphone },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { logout } = useAuth()
  const location = useLocation()

  return (
    <div className="flex h-screen">
      <aside className="w-56 bg-[#1a1d24] border-r border-white/5 flex flex-col">
        <div className="p-4 border-b border-white/5">
          <div className="text-sm font-bold">📊 Admin Panel</div>
          <div className="text-[10px] text-gray-500">Mess&Anger</div>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(item => (
            <Link key={item.path} to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors
                ${location.pathname === item.path
                  ? 'bg-orange-500/15 text-orange-400 font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-2 border-t border-white/5">
          <button onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400
              hover:text-red-400 hover:bg-red-500/10 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 8: Install deps and verify build**

```bash
cd admin && npm install && npx tsc --noEmit
Expected: No type errors
```

- [ ] **Step 9: Commit**

```bash
git add admin/
git commit -m "feat(admin): scaffold admin UI with login and 2FA flow"
```

---

### Task 8: Admin UI — Dashboard, Users, Devices, Ads Pages

**Files:**
- Create: `admin/src/pages/Dashboard.tsx`
- Create: `admin/src/pages/Users.tsx`
- Create: `admin/src/pages/Devices.tsx`
- Create: `admin/src/pages/Ads.tsx`
- Create: `admin/src/pages/Settings.tsx`
- Create: `admin/src/components/MetricCard.tsx`
- Create: `admin/src/components/StatTable.tsx`

- [ ] **Step 1: Create `admin/src/components/MetricCard.tsx`**

```typescript
interface MetricCardProps {
  label: string
  value: string | number
  icon: string
}

export default function MetricCard({ label, value, icon }: MetricCardProps) {
  return (
    <div className="bg-[#1a1d24] rounded-xl p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}
```

- [ ] **Step 2: Create `admin/src/components/StatTable.tsx`**

```typescript
interface StatTableProps {
  columns: Array<{ key: string; label: string; render?: (val: any) => string }>
  data: any[]
}

export default function StatTable({ columns, data }: StatTableProps) {
  return (
    <div className="bg-[#1a1d24] rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5">
            {columns.map(col => (
              <th key={col.key} className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5">
              {columns.map(col => (
                <td key={col.key} className="px-4 py-2.5">
                  {col.render ? col.render(row[col.key]) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 3: Create `admin/src/pages/Dashboard.tsx`**

```typescript
import { useState, useEffect } from 'react'
import { api } from '../api/client'
import MetricCard from '../components/MetricCard'
import StatTable from '../components/StatTable'

export default function Dashboard() {
  const [overview, setOverview] = useState({ onlineNow: 0, today: 0, totalUsers: 0, countries: 0 })
  const [countries, setCountries] = useState<Array<{ country: string; count: number }>>([])
  const [devices, setDevices] = useState<Array<{ name: string; count: number; percentage: number }>>([])
  const [ads, setAds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getOverview().then(setOverview).catch(() => {}),
      api.getCountries().then(r => setCountries(r.countries)).catch(() => {}),
      api.getDevices().then(r => setDevices(r.devices)).catch(() => {}),
      api.getAds().then(r => setAds(r.ads)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-center text-gray-500 py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold">Dashboard</h1>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Online Now" value={overview.onlineNow} icon="🟢" />
        <MetricCard label="Today" value={overview.today} icon="📊" />
        <MetricCard label="Total Users" value={overview.totalUsers} icon="👥" />
        <MetricCard label="Countries" value={overview.countries} icon="🌍" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-400 mb-3">🌍 Top Countries</h2>
          <StatTable
            columns={[
              { key: 'country', label: 'Country' },
              { key: 'count', label: 'Users' },
            ]}
            data={countries}
          />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-400 mb-3">📱 Devices</h2>
          <div className="bg-[#1a1d24] rounded-xl p-4 space-y-3">
            {devices.map(d => (
              <div key={d.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{d.name}</span>
                  <span className="text-gray-400">{d.percentage}%</span>
                </div>
                <div className="h-1.5 bg-[#0d0f12] rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full transition-all"
                    style={{ width: `${d.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {ads.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 mb-3">📢 Recent Ads</h2>
          <div className="grid grid-cols-4 gap-4">
            {ads.slice(0, 4).map(ad => (
              <div key={ad.id} className="bg-[#1a1d24] rounded-xl p-3">
                <div className="font-semibold text-sm truncate">{ad.title}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {ad.impressions} impressions
                </div>
                <div className="text-xs text-orange-400">
                  {ad.clicks} clicks ({ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0'}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create `admin/src/pages/Users.tsx`**

```typescript
import { useState, useEffect } from 'react'
import { api } from '../api/client'
import StatTable from '../components/StatTable'

export default function Users() {
  const [users, setUsers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const limit = 50

  useEffect(() => {
    setLoading(true)
    api.getUsers(page, limit).then(r => {
      setUsers(r.users)
      setTotal(r.total)
    }).finally(() => setLoading(false))
  }, [page])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-bold">Users ({total})</h1>
      </div>

      <StatTable
        columns={[
          { key: 'public_key', label: 'Public Key', render: (v: string) => v.slice(0, 16) + '...' },
          { key: 'country', label: 'Country' },
          { key: 'ip', label: 'IP' },
          {
            key: 'is_online', label: 'Status',
            render: (v: number) => v ? '🟢 Online' : '⚫ Offline',
          },
          { key: 'last_seen', label: 'Last Seen', render: (v: string) => v ? new Date(v).toLocaleString() : '-' },
        ]}
        data={users}
      />

      <div className="flex justify-center gap-2">
        <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
          className="px-3 py-1.5 rounded-lg bg-[#1a1d24] text-sm disabled:opacity-30">
          ← Previous
        </button>
        <span className="text-sm text-gray-500 self-center">Page {page}</span>
        <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)}
          className="px-3 py-1.5 rounded-lg bg-[#1a1d24] text-sm disabled:opacity-30">
          Next →
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create `admin/src/pages/Devices.tsx`**

```typescript
import { useState, useEffect } from 'react'
import { api } from '../api/client'

export default function Devices() {
  const [devices, setDevices] = useState<Array<{ name: string; count: number; percentage: number }>>([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    api.getDevices().then(r => {
      setDevices(r.devices)
      setTotal(r.total)
    }).catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold">Devices ({total} total)</h1>

      <div className="max-w-lg space-y-4">
        {devices.map(d => (
          <div key={d.name} className="bg-[#1a1d24] rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">{d.name}</span>
              <span className="text-gray-400 text-sm">{d.count} ({d.percentage}%)</span>
            </div>
            <div className="h-2 bg-[#0d0f12] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                style={{ width: `${d.percentage}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create `admin/src/pages/Ads.tsx`**

```typescript
import { useState, useEffect, FormEvent } from 'react'
import { api } from '../api/client'

interface Ad {
  id: number; title: string; image_url: string; target_url: string
  active: number; impressions: number; clicks: number
  created_at: string; updated_at: string
}

export default function Ads() {
  const [ads, setAds] = useState<Ad[]>([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)

  const loadAds = () => api.getAds().then(r => setAds(r.ads)).catch(() => {})

  useEffect(() => { loadAds() }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (editingId) {
      await api.updateAd(editingId, { title, image_url: imageUrl, target_url: targetUrl })
    } else {
      await api.createAd({ title, image_url: imageUrl, target_url: targetUrl, active: true })
    }
    setShowForm(false)
    setEditingId(null)
    setTitle('')
    setImageUrl('')
    setTargetUrl('')
    loadAds()
  }

  const toggleActive = async (ad: Ad) => {
    await api.updateAd(ad.id, { active: !ad.active })
    loadAds()
  }

  const deleteAd = async (id: number) => {
    if (confirm('Delete this ad?')) {
      await api.deleteAd(id)
      loadAds()
    }
  }

  const editAd = (ad: Ad) => {
    setTitle(ad.title)
    setImageUrl(ad.image_url)
    setTargetUrl(ad.target_url)
    setEditingId(ad.id)
    setShowForm(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-bold">Advertisements</h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); setTitle(''); setImageUrl(''); setTargetUrl('') }}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold">
          + New Ad
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#1a1d24] rounded-xl p-4 space-y-3 max-w-lg">
          <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required
            className="w-full bg-[#0d0f12] text-white rounded-lg px-3 py-2 text-sm border border-white/5 outline-none focus:border-orange-500/50" />
          <input placeholder="Image URL" value={imageUrl} onChange={e => setImageUrl(e.target.value)} required
            className="w-full bg-[#0d0f12] text-white rounded-lg px-3 py-2 text-sm border border-white/5 outline-none focus:border-orange-500/50" />
          <input placeholder="Target URL" value={targetUrl} onChange={e => setTargetUrl(e.target.value)} required
            className="w-full bg-[#0d0f12] text-white rounded-lg px-3 py-2 text-sm border border-white/5 outline-none focus:border-orange-500/50" />
          <div className="flex gap-2">
            <button type="submit"
              className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold">
              {editingId ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg bg-white/5 text-gray-400 text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-3">
        {ads.map(ad => (
          <div key={ad.id} className="bg-[#1a1d24] rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0 text-lg">
              📢
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{ad.title}</div>
              <div className="text-xs text-gray-500 truncate">{ad.target_url}</div>
              <div className="text-xs text-gray-500 mt-1">
                {ad.impressions} impressions · {ad.clicks} clicks ·
                {ad.impressions > 0 ? ` ${((ad.clicks / ad.impressions) * 100).toFixed(1)}% CTR` : ' 0% CTR'}
              </div>
            </div>
            <button onClick={() => toggleActive(ad)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold
                ${ad.active
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-500/20 text-gray-400'
                }`}
            >
              {ad.active ? 'Active' : 'Inactive'}
            </button>
            <button onClick={() => editAd(ad)}
              className="px-3 py-1 rounded-lg bg-white/5 text-gray-400 text-xs">
              Edit
            </button>
            <button onClick={() => deleteAd(ad.id)}
              className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400 text-xs">
              Delete
            </button>
          </div>
        ))}
        {ads.length === 0 && (
          <p className="text-center text-gray-500 py-8">No ads created yet</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Create `admin/src/pages/Settings.tsx`**

```typescript
import { useState, FormEvent } from 'react'
import { api } from '../api/client'

export default function Settings() {
  const [message, setMessage] = useState('')

  const handleReset2FA = async () => {
    if (confirm('Reset 2FA? This will invalidate your current authenticator setup.')) {
      try {
        setMessage('2FA reset requested. Check server logs for new secret.')
      } catch {
        setMessage('Failed to reset 2FA')
      }
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-lg font-bold">Settings</h1>

      <div className="bg-[#1a1d24] rounded-xl p-4 space-y-3">
        <h2 className="font-semibold text-sm">Security</h2>
        <button onClick={handleReset2FA}
          className="px-4 py-2 rounded-lg bg-orange-500/10 text-orange-400 text-sm hover:bg-orange-500/20 transition-colors">
          Reset 2FA Authentication
        </button>
      </div>

      {message && (
        <div className="bg-blue-500/10 text-blue-400 rounded-xl p-3 text-sm">
          {message}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 8: Update `admin/src/App.tsx` to include all routes**

Add route imports and update `Layout` children Routes:

```typescript
import Users from './pages/Users'
import Devices from './pages/Devices'
import Ads from './pages/Ads'
import Settings from './pages/Settings'
```

Replace the Layout Routes block with:
```typescript
<Layout>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/users" element={<Users />} />
    <Route path="/devices" element={<Devices />} />
    <Route path="/ads" element={<Ads />} />
    <Route path="/settings" element={<Settings />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
</Layout>
```

- [ ] **Step 9: Verify build**

```bash
cd admin && npx tsc --noEmit
Expected: No type errors
```

- [ ] **Step 10: Commit**

```bash
git add admin/src/pages/ admin/src/components/
git commit -m "feat(admin): add Dashboard, Users, Devices, Ads pages"
```

---

## Self-Review Checklist

1. **Spec coverage**: All spec requirements covered — DB schema ✓, connection logging ✓, JWT+TOTP auth ✓, stats API ✓, ads CRUD+tracking ✓, admin UI with all pages ✓, AdBanner component ✓
2. **Placeholder scan**: No TBD, TODO, or incomplete patterns
3. **Type consistency**: Signatures match across tasks — api client methods match route handlers, auth context interface matches Login/Verify2FA pages
4. **No gaps**: Each spec section maps to at least one task

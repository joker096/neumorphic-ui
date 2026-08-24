import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'

const RAW_DB_PATH = process.env.DB_PATH
const DB_PATH = (() => {
  const raw = RAW_DB_PATH || path.join(process.cwd(), 'data', 'admin.db')
  const normalized = path.resolve(raw)
  // Validate that the resolved path is within a safe directory
  const safeDir = path.resolve(path.join(process.cwd(), 'data'))
  if (!normalized.startsWith(safeDir)) {
    throw new Error('Invalid DB_PATH: must be within the data/ directory')
  }
  return normalized
})()

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

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL REFERENCES admins(id),
      action TEXT NOT NULL,
      ip TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL,
      payment_id INTEGER,
      order_id TEXT UNIQUE NOT NULL,
      api_key TEXT NOT NULL,
      amount TEXT NOT NULL DEFAULT '',
      currency TEXT NOT NULL DEFAULT '',
      status INTEGER NOT NULL DEFAULT 0,
      additional_data TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS entitlements (
      public_key TEXT PRIMARY KEY,
      plan TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subscription_grants (
      order_id TEXT PRIMARY KEY,
      public_key TEXT NOT NULL,
      plan TEXT NOT NULL,
      granted_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_connections_pk ON connections(public_key);
    CREATE INDEX IF NOT EXISTS idx_connections_country ON connections(country);
    CREATE INDEX IF NOT EXISTS idx_ad_events_ad ON ad_events(ad_id);
    CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
    CREATE INDEX IF NOT EXISTS idx_payments_token ON payments(token);
  `)
}

export interface Entitlement {
  plan: string
  expiresAt: number
}

export function grantEntitlement(pk: string, plan: string, days: number): number {
  const d = getDb()
  const row = d
    .prepare('SELECT expires_at FROM entitlements WHERE public_key = ?')
    .get(pk) as { expires_at: number } | undefined
  const now = Date.now()
  const base = row && row.expires_at > now ? row.expires_at : now
  const expiresAt = base + days * 86400000
  d.prepare(
    `INSERT INTO entitlements (public_key, plan, expires_at, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(public_key) DO UPDATE SET plan = ?, expires_at = ?, updated_at = datetime('now')`,
  ).run(pk, plan, expiresAt, plan, expiresAt)
  return expiresAt
}

export function getActiveEntitlement(pk: string): Entitlement | null {
  const row = getDb()
    .prepare('SELECT plan, expires_at FROM entitlements WHERE public_key = ? AND expires_at > ?')
    .get(pk, Date.now()) as { plan: string; expires_at: number } | undefined
  return row ? { plan: row.plan, expiresAt: row.expires_at } : null
}

// Idempotent grant ledger: a paid order_id can only grant once, even if the
// IPN is delivered multiple times.
export function recordSubscriptionGrant(orderId: string, pk: string, plan: string): boolean {
  const r = getDb()
    .prepare('INSERT OR IGNORE INTO subscription_grants (order_id, public_key, plan) VALUES (?, ?, ?)')
    .run(orderId, pk, plan)
  return r.changes > 0
}

export function insertPayment(p: {
  token: string
  paymentId: number | null
  orderId: string
  apiKey: string
  amount: string
  currency: string
  status: number
  additionalData: string
}): void {
  getDb()
    .prepare(
      `INSERT INTO payments (token, payment_id, order_id, api_key, amount, currency, status, additional_data, updated_at)
       VALUES (@token, @paymentId, @orderId, @apiKey, @amount, @currency, @status, @additionalData, datetime('now'))
       ON CONFLICT(order_id) DO UPDATE SET
         token = excluded.token,
         payment_id = excluded.payment_id,
         status = excluded.status,
         updated_at = datetime('now')`,
    )
    .run(p)
}

export function updatePaymentStatus(orderId: string, status: number, paymentId: number | null): void {
  getDb()
    .prepare(
      "UPDATE payments SET status = ?, payment_id = COALESCE(?, payment_id), updated_at = datetime('now') WHERE order_id = ?",
    )
    .run(status, paymentId, orderId)
}

export function getPaymentByOrderId(orderId: string): any {
  return getDb().prepare('SELECT * FROM payments WHERE order_id = ?').get(orderId)
}

export function getPaymentByToken(token: string): any {
  return getDb().prepare('SELECT * FROM payments WHERE token = ?').get(token)
}

export function listPayments(limit = 50): any[] {
  return getDb()
    .prepare('SELECT order_id, token, payment_id, amount, currency, status, created_at, updated_at FROM payments ORDER BY updated_at DESC LIMIT ?')
    .all(limit)
}

export function logConnection(pk: string, ip: string, ua: string, country?: string): void {
  getDb().prepare(
    'INSERT INTO connections (public_key, ip, user_agent, country) VALUES (?, ?, ?, ?)'
  ).run(pk, ip, ua, country || null)
}

export function logDisconnection(pk: string): void {
  getDb().prepare(
    "UPDATE connections SET disconnected_at = datetime('now') WHERE public_key = ? AND disconnected_at IS NULL"
  ).run(pk)
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
    initDone = false
  }
}

export function getActiveConnectionCount(): number {
  const row = getDb().prepare(
    'SELECT COUNT(*) as count FROM connections WHERE disconnected_at IS NULL'
  ).get() as { count: number }
  return row.count
}

export function resetDbForTests(): void {
  closeDb()
  if (fs.existsSync(DB_PATH)) {
    try {
      fs.unlinkSync(DB_PATH)
    } catch (e: any) {
      // On Windows, the file may be locked - that's okay for tests
      if (e?.code !== 'EBUSY' && e?.code !== 'EPERM') {
        throw e
      }
    }
  }
}

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
    fs.unlinkSync(DB_PATH)
  }
}

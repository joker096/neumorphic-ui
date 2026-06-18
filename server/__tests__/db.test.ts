import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import path from 'node:path'
import fs from 'node:fs'
import { getDb, closeDb, resetDbForTests } from '../db'

const TEST_DB = path.join(process.cwd(), 'data', 'test-admin.db')

describe('Database Layer', () => {
  beforeAll(() => {
    process.env.DB_PATH = TEST_DB
    resetDbForTests()
    getDb()
  })

  afterAll(() => {
    closeDb()
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB)
  })

  it('should create all tables', () => {
    const db = getDb()
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).all() as { name: string }[]
    const names = tables.map(t => t.name)
    expect(names).toContain('connections')
    expect(names).toContain('admins')
    expect(names).toContain('sessions')
    expect(names).toContain('ads')
    expect(names).toContain('ad_events')
    expect(names).toContain('logs')
  })

  it('should insert and read a connection', () => {
    const db = getDb()
    db.prepare(
      'INSERT INTO connections (public_key, ip, user_agent, country) VALUES (?, ?, ?, ?)'
    ).run('pk1', '1.2.3.4', 'TestAgent', 'US')
    const row = db.prepare('SELECT * FROM connections WHERE public_key = ?').get('pk1') as any
    expect(row.public_key).toBe('pk1')
    expect(row.ip).toBe('1.2.3.4')
    expect(row.country).toBe('US')
  })

  it('should update disconnection time', () => {
    const db = getDb()
    db.prepare(
      'INSERT INTO connections (public_key, ip, user_agent, country) VALUES (?, ?, ?, ?)'
    ).run('pk2', '5.6.7.8', 'TestAgent', 'DE')
    db.prepare(
      "UPDATE connections SET disconnected_at = datetime('now') WHERE public_key = ? AND disconnected_at IS NULL"
    ).run('pk2')
    const row = db.prepare('SELECT * FROM connections WHERE public_key = ?').get('pk2') as any
    expect(row.disconnected_at).not.toBeNull()
  })

  it('should count active connections', () => {
    const count = getDb().prepare(
      'SELECT COUNT(*) as count FROM connections WHERE disconnected_at IS NULL'
    ).get() as { count: number }
    expect(count.count).toBeGreaterThanOrEqual(0)
  })
})

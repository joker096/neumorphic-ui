import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import jwt from 'jsonwebtoken'
import { TOTP } from 'otpauth'
import bcrypt from 'bcrypt'
import path from 'node:path'
import fs from 'node:fs'

vi.hoisted(() => {
  process.env.JWT_SECRET = 'test-secret-key-for-jwt-testing'
})

const TEST_DB = path.join(process.cwd(), 'data', 'test-auth.db')
process.env.DB_PATH = TEST_DB

import { getDb, closeDb, resetDbForTests } from '../db'
import {
  signToken,
  verifyAdminToken,
  verifyRelayToken,
  signRelayToken,
  generateTotpSecret,
  verifyTotp,
  createAdminSession,
  validateSession,
  invalidateSession,
} from '../auth'

let adminId: number

describe('Auth', () => {
  beforeAll(async () => {
    resetDbForTests()
    const db = getDb()
    const hash = await bcrypt.hash('testpass', 4)
    const result = db.prepare(
      "INSERT INTO admins (username, password_hash, totp_secret) VALUES ('testadmin', ?, 'JBSWY3DPEHPK3PXP')"
    ).run(hash)
    adminId = result.lastInsertRowid as number
  })

  afterAll(() => {
    closeDb()
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB)
  })

  it('should generate and verify JWT', () => {
    const payload = { adminId: 1, username: 'admin' }
    const token = signToken(payload)
    const decoded = verifyAdminToken(token)
    expect(decoded.adminId).toBe(1)
    expect(decoded.username).toBe('admin')
  })

  it('should reject invalid signature', () => {
    const badToken = jwt.sign({ adminId: 1, username: 'hacker', scope: 'admin' }, 'wrong-secret')
    expect(() => verifyAdminToken(badToken)).toThrow()
  })

  it('mints admin and relay tokens on separate keys with distinct audiences', () => {
    const admin = verifyAdminToken(signToken({ adminId: 1, username: 'admin' }))
    const relay = verifyRelayToken(signRelayToken('peer-1'))
    expect(admin.adminId).toBe(1)
    expect(relay.id).toBe('peer-1')
  })

  it('does not accept a relay token as an admin token (token-type confusion)', () => {
    // The relay token comes from a public, unauthenticated endpoint, so it must
    // never satisfy an admin check — previously it verified under the same key.
    const relayToken = signRelayToken('peer-1')
    expect(() => verifyAdminToken(relayToken)).toThrow()
    expect(validateSession(relayToken)).toBeNull()
  })

  it('does not accept an admin session token as a relay token', () => {
    // An admin token is a 24h bearer credential for the admin panel; it must not
    // double as a mesh/relay token.
    expect(() => verifyRelayToken(signToken({ adminId: 1, username: 'admin' }))).toThrow()
  })

  it('rejects a relay token signed with the admin key directly', () => {
    // Simulates an attacker who knows JWT_SECRET forging a "relay" token by
    // hand: correct scope, wrong key. Audience alone is not enough.
    const forged = jwt.sign({ id: 'x', scope: 'relay' }, process.env.JWT_SECRET!, {
      algorithm: 'HS256',
      audience: 'relay',
    })
    expect(() => verifyRelayToken(forged)).toThrow()
  })

  it('should generate valid TOTP secret', () => {
    const { secret, uri } = generateTotpSecret()
    expect(secret).toBeTruthy()
    expect(uri).toContain('otpauth://')
    expect(uri).toContain('Mess%26Anger')
  })

  it('should verify TOTP code', () => {
    const { secret } = generateTotpSecret()
    const totp = new TOTP({
      secret,
      algorithm: 'SHA256',
      digits: 6,
      period: 30,
    })
    const code = totp.generate()
    expect(verifyTotp(secret, code)).toBe(true)
  })

  it('should reject wrong TOTP code', () => {
    const { secret } = generateTotpSecret()
    expect(verifyTotp(secret, '000000')).toBe(false)
  })

  it('should create and validate sessions', () => {
    const token = signToken({ adminId, username: 'testadmin' })
    createAdminSession(adminId, token)

    const payload = validateSession(token)
    expect(payload).not.toBeNull()
    expect(payload!.adminId).toBe(adminId)

    invalidateSession(token)
    const afterInvalidation = validateSession(token)
    expect(afterInvalidation).toBeNull()
  })
})

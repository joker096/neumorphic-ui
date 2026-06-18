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
import { signToken, verifyToken, generateTotpSecret, verifyTotp, createAdminSession, validateSession, invalidateSession } from '../auth'

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
    const decoded = verifyToken(token)
    expect(decoded.adminId).toBe(1)
    expect(decoded.username).toBe('admin')
  })

  it('should reject invalid signature', () => {
    const badToken = jwt.sign({ adminId: 1, username: 'hacker' }, 'wrong-secret')
    expect(() => verifyToken(badToken)).toThrow()
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

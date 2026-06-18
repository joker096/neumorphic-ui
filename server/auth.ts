import jwt from 'jsonwebtoken'
import { TOTP } from 'otpauth'
import { getDb } from './db.js'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"')
  process.exit(1)
}

export interface JwtPayload {
  adminId: number
  username: string
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}

export function generateTotpSecret(): { secret: string; uri: string } {
  const totp = new TOTP({
    issuer: 'Mess&Anger',
    label: 'admin',
    algorithm: 'SHA256',
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
    algorithm: 'SHA256',
    digits: 6,
    period: 30,
  })
  const delta = totp.validate({ token, window: 1 })
  return delta !== null
}

export function createAdminSession(adminId: number, token: string): void {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  getDb().prepare('INSERT INTO sessions (admin_id, token, expires_at) VALUES (?, ?, ?)').run(adminId, token, expiresAt)
}

export function validateSession(token: string): JwtPayload | null {
  try {
    const payload = verifyToken(token)
    const row = getDb().prepare(
      "SELECT id FROM sessions WHERE token = ? AND expires_at > datetime('now')"
    ).get(token)
    if (!row) return null
    return payload
  } catch {
    return null
  }
}

export function invalidateSession(token: string): void {
  getDb().prepare('DELETE FROM sessions WHERE token = ?').run(token)
}

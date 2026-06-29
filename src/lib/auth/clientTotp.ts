import * as OTPAuth from 'otpauth'

const TOTP_ISSUER = 'Mess&Anger'
const TOTP_LABEL = 'Account Backup'

let _cachedTotp: OTPAuth.TOTP | null = null

export interface TotpResult {
  secret: string
  url: string
}

export function generateTotp(): TotpResult {
  const secret = new OTPAuth.Secret({ size: 20 })
  _cachedTotp = new OTPAuth.TOTP({
    issuer: TOTP_ISSUER,
    label: TOTP_LABEL,
    algorithm: 'SHA-256',
    digits: 6,
    period: 30,
    secret,
  })
  return {
    secret: secret.base32,
    url: _cachedTotp.toString(),
  }
}

export function verifyTotp(token: string, secretBase32?: string): boolean {
  const totp = secretBase32 ? createTotpFromSecret(secretBase32) : _cachedTotp
  if (!totp) return false
  const delta = totp.validate({ token, window: 1 })
  return delta !== null
}

export function getCurrentTotpCode(secretBase32: string): string {
  return createTotpFromSecret(secretBase32).generate()
}

function createTotpFromSecret(secretBase32: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: TOTP_ISSUER,
    label: TOTP_LABEL,
    algorithm: 'SHA-256',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  })
}

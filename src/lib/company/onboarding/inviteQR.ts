import type { InviteQRPayload } from '../types'
import QRCode from 'qrcode'

export async function encodeInviteQR(payload: InviteQRPayload): Promise<string> {
  const json = JSON.stringify(payload)
  return await QRCode.toDataURL(json, {
    errorCorrectionLevel: 'M',
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  })
}

export function decodeInviteQR(qrData: string): InviteQRPayload | null {
  try {
    if (qrData.startsWith('data:image')) {
      const base64Data = qrData.split(',')[1]
      const binary = atob(base64Data)
      const json = binary.split('').map(c => c.charCodeAt(0)).join('')
      const parsed = JSON.parse(json)
      return validateInvitePayload(parsed) ? parsed : null
    }
    return validateInvitePayload(JSON.parse(qrData)) ? JSON.parse(qrData) : null
  } catch {
    return null
  }
}

export function validateInvitePayload(data: any): data is InviteQRPayload {
  return (
    typeof data === 'object' &&
    typeof data.org === 'string' &&
    typeof data.code === 'string' &&
    typeof data.name === 'string' &&
    typeof data.adminKey === 'string' &&
    (data.expiresAt === undefined || typeof data.expiresAt === 'number')
  )
}

export function isInviteExpired(payload: InviteQRPayload): boolean {
  if (!payload.expiresAt) return false
  return Date.now() > payload.expiresAt
}

export function createInvitePayload(
  companyId: string,
  inviteCode: string,
  companyName: string,
  adminPublicKeyHex: string,
  expiresAt?: number
): InviteQRPayload {
  return {
    org: companyId,
    code: inviteCode,
    name: companyName,
    adminKey: adminPublicKeyHex,
    expiresAt,
  }
}
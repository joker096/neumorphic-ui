import { getMasterKeySet } from '../lib/identity/masterKey'
import { PAYMENTO_BACKEND_BASE } from '../config/paymento'

export interface EntitlementState {
  premium: boolean
  plan: string | null
  expiresAt: number | null
}

export function bufToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

// Stable per-install device public key (ed25519, base64, 44 chars incl. padding).
export async function getDevicePublicKey(): Promise<string> {
  const keys = await getMasterKeySet()
  return bufToBase64(keys.ed25519Public)
}

export async function fetchEntitlement(devicePublicKey: string): Promise<EntitlementState> {
  const res = await fetch(
    `${PAYMENTO_BACKEND_BASE}/entitlement?pk=${encodeURIComponent(devicePublicKey)}`,
  )
  if (!res.ok) throw new Error(`Entitlement check failed (${res.status})`)
  const data = (await res.json()) as { premium?: boolean; plan?: string; expiresAt?: number }
  return {
    premium: data.premium === true,
    plan: data.plan ?? null,
    expiresAt: typeof data.expiresAt === 'number' ? data.expiresAt : null,
  }
}

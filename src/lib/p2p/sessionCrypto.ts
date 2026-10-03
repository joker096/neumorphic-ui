import { b64decode, b64encode, deriveSharedSessionKeys, hex2buf } from '../crypto/cryptoCore'

export async function deriveSessionKeys(
  localDhPrivateKey: Uint8Array,
  peerDhPubHex: string,
): Promise<{ hmacKey: string; aesKey: CryptoKey } | null> {
  const peerKey = hex2buf(peerDhPubHex)
  if (peerKey.length !== 32) return null
  const { hmacKey, aesKeyHex } = deriveSharedSessionKeys(localDhPrivateKey, peerKey)
  const aesKey = await crypto.subtle.importKey(
    'raw',
    hex2buf(aesKeyHex),
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
  return { hmacKey, aesKey }
}

export async function encryptSessionPayload(aesKey: CryptoKey, data: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    new TextEncoder().encode(data),
  )
  return `${b64encode(iv)}:${b64encode(new Uint8Array(cipher))}`
}

export async function decryptSessionPayload(
  aesKey: CryptoKey | null,
  payload: string,
): Promise<string | null> {
  if (!aesKey) return null
  const sep = payload.indexOf(':')
  if (sep === -1) {
    console.warn('[P2PTransport] Missing AES-GCM IV separator')
    return null
  }
  try {
    const iv = b64decode(payload.slice(0, sep))
    const cipher = b64decode(payload.slice(sep + 1))
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      cipher,
    )
    return new TextDecoder().decode(plain)
  } catch {
    console.warn('[P2PTransport] Failed to decrypt session payload')
    return null
  }
}

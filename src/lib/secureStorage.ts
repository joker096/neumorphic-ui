let _cachedKey: CryptoKey | null = null

async function getStorageKey(): Promise<CryptoKey> {
  if (_cachedKey) return _cachedKey
  const pwKey = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode('mess-anger-storage-v1'),
    'PBKDF2', false, ['deriveKey'],
  )
  const salt = new Uint8Array([0x6d, 0x65, 0x73, 0x73, 0x2d, 0x73, 0x61, 0x6c, 0x74])
  _cachedKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
    pwKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
  return _cachedKey
}

export async function secureSetItem(key: string, value: string): Promise<void> {
  const encKey = await getStorageKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(value)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, encKey, encoded)
  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.length)
  const b64 = btoa(String.fromCharCode(...combined))
  localStorage.setItem(key, b64)
}

export async function secureGetItem(key: string): Promise<string | null> {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  try {
    const encKey = await getStorageKey()
    const combined = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0))
    const iv = combined.slice(0, 12)
    const ciphertext = combined.slice(12)
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, encKey, ciphertext)
    return new TextDecoder().decode(decrypted)
  } catch {
    return null
  }
}

export async function secureRemoveItem(key: string): Promise<void> {
  localStorage.removeItem(key)
}

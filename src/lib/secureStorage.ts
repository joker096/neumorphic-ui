const KEK_STORAGE_KEY = 'mess_anger_kek_v1'
let _cachedKey: CryptoKey | null = null

async function getStorageKey(): Promise<CryptoKey> {
  if (_cachedKey) return _cachedKey
  // Per-install random key (not a shipped constant) so client-side blobs are
  // not decryptable by anyone possessing the build. Stored in localStorage;
  // a same-device attacker with JS execution can still read it, but the global
  // hardcoded key is gone.
  let rawHex = localStorage.getItem(KEK_STORAGE_KEY)
  if (!rawHex) {
    const bytes = crypto.getRandomValues(new Uint8Array(32))
    rawHex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
    localStorage.setItem(KEK_STORAGE_KEY, rawHex)
  }
  const keyBytes = new Uint8Array(rawHex.match(/../g)!.map((h) => parseInt(h, 16)))
  _cachedKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
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

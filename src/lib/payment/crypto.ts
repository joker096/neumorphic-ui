// Client-side HMAC-SHA256 verification (Web Crypto) for Paymento callbacks.
// Mirrors the gateway's X-HMAC-SHA256-SIGNATURE scheme: hex, uppercase.

export async function verifyPaymentoSignature(
  rawPayload: string,
  receivedSignature: string,
  secret: string,
): Promise<boolean> {
  if (!receivedSignature || !secret) return false
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(rawPayload))
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()

  const expected = receivedSignature.toUpperCase()
  if (hex.length !== expected.length) return false

  let diff = 0
  for (let i = 0; i < hex.length; i++) {
    diff |= hex.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0
}

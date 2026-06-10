export class HMACAuth {
  static async sign(keyHex: string, data: string): Promise<string> {
    const key = await crypto.subtle.importKey(
      'raw',
      hexToBytes(keyHex),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
    return bytesToHex(new Uint8Array(sig))
  }

  static async verify(keyHex: string, data: string, sigHex: string): Promise<boolean> {
    try {
      const key = await crypto.subtle.importKey(
        'raw',
        hexToBytes(keyHex),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify'],
      )
      return await crypto.subtle.verify(
        'HMAC',
        key,
        hexToBytes(sigHex),
        new TextEncoder().encode(data),
      )
    } catch {
      return false
    }
  }

  static async generateKey(): Promise<string> {
    const key = await crypto.subtle.generateKey(
      { name: 'HMAC', hash: 'SHA-256', length: 256 },
      true,
      ['sign', 'verify'],
    )
    const raw = await crypto.subtle.exportKey('raw', key)
    return bytesToHex(new Uint8Array(raw))
  }
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

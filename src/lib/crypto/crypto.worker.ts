// Web Worker for crypto operations (offloads AES-GCM, HMAC from main thread)

self.onmessage = async (e: MessageEvent<{
  type: 'encrypt' | 'decrypt' | 'hmac' | 'hash' | 'deriveKey'
  id: string
  data: {
    key?: Uint8Array
    iv?: Uint8Array
    plaintext?: Uint8Array
    ciphertext?: Uint8Array
    message?: Uint8Array
    salt?: Uint8Array
    iterations?: number
    length?: number
  }
}>) => {
  const { type, id, data } = e.data

  try {
    switch (type) {
      case 'encrypt': {
        if (!data.key || !data.iv || !data.plaintext) throw new Error('Missing encrypt params')
        const key = await crypto.subtle.importKey('raw', data.key, 'AES-GCM', false, ['encrypt'])
        const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: data.iv }, key, data.plaintext)
        self.postMessage({ id, result: new Uint8Array(ct) }, { transfer: [ct] })
        break
      }
      case 'decrypt': {
        if (!data.key || !data.iv || !data.ciphertext) throw new Error('Missing decrypt params')
        const key = await crypto.subtle.importKey('raw', data.key, 'AES-GCM', false, ['decrypt'])
        const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: data.iv }, key, data.ciphertext)
        self.postMessage({ id, result: new Uint8Array(pt) }, { transfer: [pt] })
        break
      }
      case 'hmac': {
        if (!data.key || !data.message) throw new Error('Missing HMAC params')
        const hmacKey = await crypto.subtle.importKey('raw', data.key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
        const sig = await crypto.subtle.sign('HMAC', hmacKey, data.message)
        self.postMessage({ id, result: new Uint8Array(sig) }, { transfer: [sig] })
        break
      }
      case 'hash': {
        if (!data.message) throw new Error('Missing hash params')
        const hash = await crypto.subtle.digest('SHA-256', data.message)
        self.postMessage({ id, result: new Uint8Array(hash) }, { transfer: [hash] })
        break
      }
      case 'deriveKey': {
        if (!data.message || !data.salt) throw new Error('Missing deriveKey params')
        const keyMaterial = await crypto.subtle.importKey('raw', data.message, 'PBKDF2', false, ['deriveBits'])
        const bits = await crypto.subtle.deriveBits(
          { name: 'PBKDF2', salt: data.salt, iterations: data.iterations || 600000, hash: 'SHA-256' },
          keyMaterial,
          (data.length || 256),
        )
        self.postMessage({ id, result: new Uint8Array(bits) }, { transfer: [bits] })
        break
      }
      default:
        throw new Error(`Unknown operation: ${type}`)
    }
  } catch (err: any) {
    self.postMessage({ id, error: err.message })
  }
}

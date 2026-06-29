import * as nacl from 'tweetnacl'

export function generateEd25519KeyPair(): { publicKey: Uint8Array; secretKey: Uint8Array } {
  const kp = nacl.sign.keyPair()
  return { publicKey: kp.publicKey, secretKey: kp.secretKey }
}

export function ed25519_sign(message: string | Uint8Array, secretKey: Uint8Array): Uint8Array
export function ed25519_sign(message: string | Uint8Array, secretKey?: Uint8Array): Uint8Array {
  const msgBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message
  if (!secretKey) {
    const seed = crypto.getRandomValues(new Uint8Array(32))
    const kp = nacl.sign.keyPair.fromSeed(seed)
    return nacl.sign.detached(msgBytes, kp.secretKey)
  }
  return nacl.sign.detached(msgBytes, secretKey)
}

export function ed25519_verify(message: string | Uint8Array, signature: Uint8Array, publicKey: Uint8Array): boolean {
  const msgBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message
  return nacl.sign.detached.verify(msgBytes, signature, publicKey)
}
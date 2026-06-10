export interface X25519KeyPair {
  publicKey: Uint8Array
  secretKey: Uint8Array
}

export interface EncryptedPayload {
  cipher: string
  iv: string
}

export interface HandshakeResult {
  sharedSecret: string
  handshakeId: string
}

export interface EncryptResult {
  ciphertext: string
  iv: string
  tag: string
  publicKey: string
}

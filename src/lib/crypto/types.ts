export interface X25519KeyPair {
  publicKey: Uint8Array
  secretKey: Uint8Array
}

export interface EncryptedPayload {
  cipher: string
  iv: string
}

import { generateX25519KeyPair, x25519DH, buf2hex, hex2buf } from '../cryptoCore'
import type { X25519KeyPair } from './types'

export interface DoubleRatchetState {
  sendChainKey: CryptoKey
  recvChainKey: CryptoKey
  sendCounter: number
  recvCounter: number
  localDHKeyPair: X25519KeyPair
  remotePublicKey: Uint8Array
  previousRemoteKey: Uint8Array | null
  skippedMessageKeys: Map<string, { key: CryptoKey; counter: number }>
}

async function hkdfDerive(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length = 32): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey('raw', ikm, { name: 'HKDF' }, false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, keyMaterial, length * 8)
  return new Uint8Array(bits)
}

async function dhRatchet(dhPair: X25519KeyPair, remoteKey: Uint8Array): Promise<{
  sendKey: CryptoKey
  recvKey: CryptoKey
}> {
  const sharedSecret = x25519DH(dhPair.secretKey, remoteKey)

  const salt = new Uint8Array(32)
  const recvRoot = await hkdfDerive(salt, sharedSecret, new TextEncoder().encode('recv'))
  const sendRoot = await hkdfDerive(salt, sharedSecret, new TextEncoder().encode('send'))

  const recvKey = await crypto.subtle.importKey('raw', recvRoot, { name: 'AES-GCM', length: 256 }, false, ['decrypt'])
  const sendKey = await crypto.subtle.importKey('raw', sendRoot, { name: 'AES-GCM', length: 256 }, false, ['encrypt'])

  return { sendKey, recvKey }
}

export class DoubleRatchet {
  private state: DoubleRatchetState

  constructor(state: DoubleRatchetState) {
    this.state = state
  }

  static async initialize(): Promise<{ ratchet: DoubleRatchet; publicKey: Uint8Array }> {
    const dhPair = generateX25519KeyPair()
    const emptyKey = new Uint8Array(32)
    const encryptDummyKey = await crypto.subtle.importKey('raw', emptyKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt'])
    const recvDummyKey = await crypto.subtle.importKey('raw', emptyKey, { name: 'AES-GCM', length: 256 }, false, ['decrypt'])

    const state: DoubleRatchetState = {
      sendChainKey: encryptDummyKey,
      recvChainKey: recvDummyKey,
      sendCounter: 0,
      recvCounter: 0,
      localDHKeyPair: dhPair,
      remotePublicKey: emptyKey,
      previousRemoteKey: null,
      skippedMessageKeys: new Map(),
    }
    return { ratchet: new DoubleRatchet(state), publicKey: dhPair.publicKey }
  }

  async encrypt(plaintext: string): Promise<{
    ciphertext: string; nonce: string; publicKey: string; messageHash: string
  }> {
    const nonce = crypto.getRandomValues(new Uint8Array(12))
    const cipherBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce },
      this.state.sendChainKey,
      new TextEncoder().encode(plaintext),
    )
    const ciphertext = new Uint8Array(cipherBuffer)
    const hashBuffer = await crypto.subtle.digest('SHA-256', cipherBuffer)
    this.state.sendCounter++
    return {
      ciphertext: buf2hex(cipherBuffer),
      nonce: buf2hex(nonce),
      publicKey: buf2hex(this.state.localDHKeyPair.publicKey),
      messageHash: buf2hex(hashBuffer),
    }
  }

  async decrypt(ciphertextHex: string, nonceHex: string, publicKeyHex: string): Promise<{
    plaintext: string; isValid: boolean
  }> {
    const remotePub = hex2buf(publicKeyHex)
    const key = this.state.recvChainKey

    try {
      const plainBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: hex2buf(nonceHex) },
        key,
        hex2buf(ciphertextHex),
      )
      this.state.recvCounter++
      return { plaintext: new TextDecoder().decode(plainBuffer), isValid: true }
    } catch {
      return { plaintext: '', isValid: false }
    }
  }

  async trySkippedDecrypt(
    ciphertextHex: string, nonceHex: string, publicKeyHex: string,
  ): Promise<{ plaintext: string; isValid: boolean }> {
    const key = this.state.skippedMessageKeys.get(publicKeyHex)
    if (!key) return { plaintext: '', isValid: false }
    try {
      const plainBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: hex2buf(nonceHex) },
        key.key,
        hex2buf(ciphertextHex),
      )
      this.state.skippedMessageKeys.delete(publicKeyHex)
      return { plaintext: new TextDecoder().decode(plainBuffer), isValid: true }
    } catch {
      return { plaintext: '', isValid: false }
    }
  }

  /**
   * Exchange the remote public key and derive symmetric keys.
   * Both sides call this with each other's public key. Since X25519 DH
   * is symmetric (DH(a_priv, b_pub) == DH(b_priv, a_pub)), both sides
   * derive the same send/recv keys.
   */
  async ratchet(remoteKey: Uint8Array): Promise<void> {
    this.state.previousRemoteKey = this.state.remotePublicKey
    this.state.remotePublicKey = remoteKey

    const { sendKey, recvKey } = await dhRatchet(this.state.localDHKeyPair, remoteKey)

    this.state.sendChainKey = sendKey
    this.state.recvChainKey = recvKey
    this.state.sendCounter = 0
    this.state.recvCounter = 0
  }

  /**
   * Perform an additional ratchet step (skip ratchet) without changing the DH key.
   * This derives new chain keys from the current DH key pair.
   */
  async ratchetStep(): Promise<void> {
    const { sendKey, recvKey } = await dhRatchet(this.state.localDHKeyPair, this.state.remotePublicKey)

    this.state.sendChainKey = sendKey
    this.state.recvChainKey = recvKey
    this.state.sendCounter = 0
    this.state.recvCounter = 0
  }

  getState(): DoubleRatchetState {
    return this.state
  }

  static async createFromState(state: DoubleRatchetState): Promise<DoubleRatchet> {
    return new DoubleRatchet(state)
  }
}

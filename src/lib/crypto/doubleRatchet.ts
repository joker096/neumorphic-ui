// src/lib/crypto/doubleRatchet.ts
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
  rootKey?: CryptoKey
}

async function hkdfDerive(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length = 32): Promise<Uint8Array> {
  try {
    const key = await crypto.subtle.importKey('raw', ikm, { name: 'PBKDF2' }, false, ['deriveKey'])
    const combinedSalt = new Uint8Array(salt.length + info.length)
    combinedSalt.set(salt, 0)
    combinedSalt.set(info, salt.length)
    const keyDerive = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: combinedSalt, iterations: 1 },
      key,
      { name: 'AES-GCM', length },
      false,
      ['encrypt', 'decrypt']
    )
    const rawKey = await crypto.subtle.exportKey('raw', keyDerive)
    return new Uint8Array(rawKey)
  } catch {
    // Fallback: use SHA-256 based derivation if PBKDF2 is not available
    const hash = await crypto.subtle.digest('SHA-256', new Uint8Array([...salt, ...ikm, ...info]))
    const result = new Uint8Array(length)
    result.set(new Uint8Array(hash), 0)
    if (length > 32) {
      for (let i = 1; result.byteLength < length; i++) {
        const block = await crypto.subtle.digest('SHA-256', new Uint8Array([...result.subarray(0, 32), i]))
        result.set(new Uint8Array(block), i * 32)
      }
    }
    return result.slice(0, length)
  }
}

async function deriveChainKeys(rootKey: CryptoKey, role: 'send' | 'recv'): Promise<CryptoKey> {
  const salt = crypto.getRandomValues(new Uint8Array(32))
  const info = new TextEncoder().encode(role)
  const combinedSalt = new Uint8Array(salt.length + info.length)
  combinedSalt.set(salt, 0)
  combinedSalt.set(info, salt.length)
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: combinedSalt, iterations: 1 },
    rootKey,
    { name: 'AES-GCM', length: 256 },
    false,
    role === 'send' ? ['encrypt'] : ['decrypt'],
  )
}

async function dhRatchet(dhPair: X25519KeyPair, remoteKey: Uint8Array): Promise<{
  sendKey: CryptoKey
  recvKey: CryptoKey
}> {
  const sharedSecret = x25519DH(dhPair.secretKey, remoteKey)
  const salt = crypto.getRandomValues(new Uint8Array(32))
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
    const randomKey = crypto.getRandomValues(new Uint8Array(32))
    const encryptDummyKey = await crypto.subtle.importKey('raw', randomKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt'])
    const recvDummyKey = await crypto.subtle.importKey('raw', randomKey, { name: 'AES-GCM', length: 256 }, false, ['decrypt'])

    const state: DoubleRatchetState = {
      sendChainKey: encryptDummyKey,
      recvChainKey: recvDummyKey,
      sendCounter: 0,
      recvCounter: 0,
      localDHKeyPair: dhPair,
      remotePublicKey: randomKey,
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

  async ratchet(remoteKey: Uint8Array): Promise<void> {
    this.state.previousRemoteKey = this.state.remotePublicKey
    this.state.remotePublicKey = remoteKey

    const { sendKey, recvKey } = await dhRatchet(this.state.localDHKeyPair, remoteKey)

    this.state.sendChainKey = sendKey
    this.state.recvChainKey = recvKey
    this.state.sendCounter = 0
    this.state.recvCounter = 0
  }

  async ratchetStep(): Promise<void> {
    const newDHKeyPair = generateX25519KeyPair()
    const { sendKey, recvKey } = await dhRatchet(this.state.localDHKeyPair, this.state.remotePublicKey)

    this.state.sendChainKey = sendKey
    this.state.recvChainKey = recvKey
    this.state.localDHKeyPair = newDHKeyPair
    this.state.sendCounter = 0
    this.state.recvCounter = 0
  }

  /**
   * Derive forward secrecy key from current ratchet state
   */
  async deriveForwardSecrecyKey(): Promise<CryptoKey> {
    if (!this.state.rootKey) {
      throw new Error('Root key not initialized')
    }
    const salt = crypto.getRandomValues(new Uint8Array(32))
    const info = new TextEncoder().encode(`forward-secrecy-${this.state.sendCounter}`)
    const combinedSalt = new Uint8Array(salt.length + info.length)
    combinedSalt.set(salt, 0)
    combinedSalt.set(info, salt.length)
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: combinedSalt, iterations: 1 },
      this.state.rootKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    )
  }

  /**
   * Add a skipped message key for out-of-order delivery
   */
  addSkippedMessageKey(keyId: string, key: CryptoKey, counter: number): void {
    this.state.skippedMessageKeys.set(keyId, { key, counter })
  }

  getState(): DoubleRatchetState {
    return this.state
  }

  static async createFromState(state: DoubleRatchetState): Promise<DoubleRatchet> {
    return new DoubleRatchet(state)
  }
}
